import cors from "cors";
import dotenv from "dotenv";

import express from "express";

import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;

if (!process.env.OPENAI_API_KEY) {
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildTestPrompt({
  role = "full stack (React/Node)",
  context = "",
}) {
  return `
You are an expert technical interviewer for ${role} roles.
Generate exactly 6 interview questions in JSON format:
- 2 easy (20s each, 1 point each)
- 2 medium (60s each, 2 points each)
- 2 hard (120s each, 3 points each)

Return strictly valid JSON array only.
Each item must have:
{
  "question": "the question text",
  "difficulty": "easy|medium|hard",
  "expected_points": 1|2|3
}

Keep the questions unique and relevant.
Context: ${context}
`;
}

function fallbackQuestions() {
  return [
    { questionId: "f1", question: "What is React?", difficulty: "easy", expectedPoints: 1, timeLimit: 20 },
    { questionId: "f2", question: "What is useState in React?", difficulty: "easy", expectedPoints: 1, timeLimit: 20 },
    { questionId: "f3", question: "Explain event loop in Node.js.", difficulty: "medium", expectedPoints: 2, timeLimit: 60 },
    { questionId: "f4", question: "What is middleware in Express.js?", difficulty: "medium", expectedPoints: 2, timeLimit: 60 },
    { questionId: "f5", question: "How would you optimize React rendering?", difficulty: "hard", expectedPoints: 3, timeLimit: 120 },
    { questionId: "f6", question: "Explain scaling WebSocket servers in Node.", difficulty: "hard", expectedPoints: 3, timeLimit: 120 },
  ];
}

const timeMap = { easy: 20, medium: 60, hard: 120 };

app.post("/api/generate-test", async (req, res) => {
  try {
    const { context = "" } = req.body;
    const prompt = buildTestPrompt({ context });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const out = completion.choices?.[0]?.message?.content ?? "";
    let parsed

    try {
      parsed = JSON.parse(out.trim());
    } catch {
      const firstBracket = out.indexOf("[");
      const lastBracket = out.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1) {
        parsed = JSON.parse(out.slice(firstBracket, lastBracket + 1));
      } else {
        console.warn("⚠️ Invalid JSON, using fallback questions.");
        return res.json({ questions: fallbackQuestions() });
      }
    }

    const questions = parsed.map((q, idx) => ({
      questionId: `q_${Date.now()}_${idx}`,
      question: q.question,
      difficulty: q.difficulty,
      expectedPoints: q.expected_points,
      timeLimit: timeMap[q.difficulty] ?? 60,
    }));

    res.json({ questions });
  } catch (err) {
    console.error("generate-test error:", err);
    res.json({ questions: fallbackQuestions() });
  }
});

app.post("/api/evaluate-test", async (req, res) => {
  try {
    const { answers = [], candidateContext = "" } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers array required" });
    }

    const evalPrompt = `
You are an expert interviewer and grader.
Evaluate each answer strictly in JSON array format:
[
  { "questionId": "...", "score": 0-3, "feedback": "short feedback" }
]
Also, provide a final summary about the candidate in a field "finalSummary": "<text>"

Add a final field: { "totalScore": <sum> }

Answers:
${JSON.stringify(answers, null, 2)}

Candidate context: ${candidateContext}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: evalPrompt }],
      temperature: 0.0,
      max_tokens: 800,
    });

    const out = completion.choices?.[0]?.message?.content ?? "";
    let parsed

    try {
      parsed = JSON.parse(out.trim());
    } catch {
      const firstBracket = out.indexOf("[");
      const lastBracket = out.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1) {
        parsed = JSON.parse(out.slice(firstBracket, lastBracket + 1));
        const summaryMatch = out.match(/"finalSummary"\s*:\s*"([^"]+)"/);
        parsed.finalSummary = summaryMatch ? summaryMatch[1] : "Summary not available";
      } else {
        console.warn("⚠️ Invalid eval JSON, using fallback scoring.");
        const total = answers.length;
        return res.json({
          evaluations: answers.map((a) => ({
            questionId: a.questionId,
            score: 1,
            feedback: "Fallback: answer accepted",
            
          })),
          totalScore: total,
          finalSummary: "Fallback: candidate evaluation summary not available",
        });
      }
    }

    res.json(parsed);
  } catch (err) {
    console.error("evaluate-test error:", err);
    res.json({
      evaluations: req.body.answers.map((a) => ({
        questionId: a.questionId,
        score: 1,
        feedback: "Fallback: answer accepted",
      })),
      totalScore: req.body.answers.length,
      finalSummary: "Fallback: candidate evaluation summary not available",
    });
  }
});

app.listen(port, () => {
  console.log(` LLM backend running on port ${port}`);
});
