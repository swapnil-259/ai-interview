import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Grid, Input, List, Popconfirm, Typography, Upload, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    addChatMessage,
    createCandidate,
    deleteCandidate,
    updateCandidateProfile
} from '../../store/slices/candidatesSlice';
import { findEmail, findName, findPhone } from '../../utils/extractors';
import { extractTextFromDocx, extractTextFromPdf } from '../../utils/pdfHelpers';

interface Question {
  questionId: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  answer?: string;
}

export default function IntervieweeChat() {
  const dispatch = useAppDispatch();
  const candidates = useAppSelector(s => s.candidates.list);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [score, setScore] = useState<number>(0);

  const candidate = currentId ? candidates.find(c => c.id === currentId) : null;

  const getNextMissingField = () => {
    if (!candidate) return null;
    if (!candidate.name) return 'name';
    if (!candidate.email) return 'email';
    if (!candidate.phone) return 'phone';
    return null;
  };

  const nextField = getNextMissingField();

  async function handleResume(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let text = '';
    if (ext === 'pdf') text = await extractTextFromPdf(file);
    else if (ext === 'docx') text = await extractTextFromDocx(file);
    else return;

    const name = findName(text) ?? undefined;
    const email = findEmail(text) ?? undefined;
    const phone = findPhone(text) ?? undefined;

    const id = uuidv4();
    dispatch(createCandidate({
      id,
      name,
      email,
      phone,
      chat: [],
      resumeFileName: file.name,
      score: 0,
      testCompleted: false
    }));
    setCurrentId(id);
    setTestStarted(false);
    setQuestionQueue([]);
    setCurrentQuestionIndex(0);
    setTimer(0);
    setScore(0);

    const firstMissing = !name ? 'name' : !email ? 'email' : !phone ? 'phone' : null;
    if (firstMissing) {
      dispatch(addChatMessage({
        id,
        msg: { id: uuidv4(), role: 'ai', text: `Bot: Please provide your ${firstMissing}.`, timestamp: new Date().toISOString() }
      }));
    }
  }
  const startTest = async () => {
    if (!currentId || nextField) return;

    try {
      setTestStarted(true);
      const resp = await fetch('http://localhost:4000/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: `${candidate?.name ?? ''}` })
      });
      const data = await resp.json();
      const questions: Question[] = data.questions.map((q: any) => ({
        questionId: q.questionId,
        question: q.question,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }));

      setQuestionQueue(questions);
      setCurrentQuestionIndex(0);
      setTimer(questions[0].timeLimit);

      dispatch(addChatMessage({
        id: currentId,
        msg: { id: uuidv4(), role: 'ai', text: questions[0].question, timestamp: new Date().toISOString() }
      }));
    } catch (err) {
      message.error('Failed to fetch test questions. Try again.');
      console.error(err);
      setTestStarted(false);
    }
  };

  useEffect(() => {
    if (!testStarted || questionQueue.length === 0 || currentQuestionIndex >= questionQueue.length) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer, currentQuestionIndex, testStarted, questionQueue]);

  const handleSendMessage = () => {
    if (!currentId || !chatInput.trim()) return;

    dispatch(addChatMessage({
      id: currentId,
      msg: { id: uuidv4(), role: 'candidate', text: chatInput.trim(), timestamp: new Date().toISOString() }
    }));

    if (nextField) {
      const newData: any = {};
      newData[nextField] = chatInput.trim();
      dispatch(updateCandidateProfile({ id: currentId, data: newData }));

      const updatedCandidate = { ...candidate, ...newData };
      const remainingField =
        !updatedCandidate.name ? 'name' :
        !updatedCandidate.email ? 'email' :
        !updatedCandidate.phone ? 'phone' : null;

      if (remainingField) {
        dispatch(addChatMessage({
          id: currentId,
          msg: { id: uuidv4(), role: 'ai', text: `Bot: Please provide your ${remainingField}.`, timestamp: new Date().toISOString() }
        }));
      }
    } else if (testStarted && questionQueue.length > 0) {
      const updatedQueue = [...questionQueue];
      updatedQueue[currentQuestionIndex].answer = chatInput.trim();
      setQuestionQueue(updatedQueue);
      handleNextQuestion();
    }

    setChatInput('');
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questionQueue.length) {
      setTimer(0);
      setTestStarted(false);
      evaluateTest();
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    setTimer(questionQueue[nextIndex].timeLimit);

    dispatch(addChatMessage({
      id: currentId!,
      msg: { id: uuidv4(), role: 'ai', text: questionQueue[nextIndex].question, timestamp: new Date().toISOString() }
    }));
  };

  const evaluateTest = async () => {
    if (!currentId) return;
    try {
      const resp = await fetch('http://localhost:4000/api/evaluate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: questionQueue.map(q => ({
            questionId: q.questionId,
            answer: q.answer ?? ''
          })),
          candidateContext: candidate?.name ?? ''
        })
      });
      const data = await resp.json();
      const totalScore = data.totalScore ?? (data as { score: number }[]).reduce((sum, e) => sum + (e.score ?? 0), 0);

      setScore(totalScore);
      dispatch(updateCandidateProfile({ id: currentId, data: { score: totalScore, testCompleted: true } }));
      message.success(`Test completed! Score: ${totalScore}`);
      setTestStarted(false);
    } catch (err) {
      console.error(err);
      message.error('Failed to evaluate test.');
    }
  };

  const handleDeleteCandidate = (id: string) => {
    if (currentId === id) setCurrentId(null);
    dispatch(deleteCandidate(id));
    setTestStarted(false);
    setQuestionQueue([]);
    setCurrentQuestionIndex(0);
    setTimer(0);
    setScore(0);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16,
        padding: 16
      }}
    >
      <Card
        style={{
          flex: 1,
          width: isMobile ? '100%' : '30%',
          marginBottom: isMobile ? 16 : 0,
          borderRadius: 8
        }}
      >
        <Typography.Title level={4}>Upload Resume</Typography.Title>
        <Upload
          beforeUpload={(file) => { handleResume(file as File); return false; }}
          maxCount={1}
          accept=".pdf,.docx"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Upload PDF / DOCX</Button>
        </Upload>

        <Typography.Title level={5} style={{ marginTop: 16 }}>Candidates</Typography.Title>
        <List
          dataSource={candidates}
          locale={{ emptyText: 'No candidate uploaded' }}
          renderItem={c => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Delete candidate?"
                  onConfirm={() => handleDeleteCandidate(c.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={c.name ?? 'Unnamed Candidate'}
                description={
                  <>
                    <div>Email: {c.email ?? 'N/A'}</div>
                    <div>Phone: {c.phone ?? 'N/A'}</div>
                    <div>Resume: {c.resumeFileName ?? 'N/A'}</div>
                    {c.score !== undefined && <div>Score: {c.score}</div>}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        style={{
          flex: 2,
          width: isMobile ? '100%' : '70%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
          borderRadius: 8
        }}
      >
        <Typography.Title level={4}>Chat</Typography.Title>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            // border: '1px solid #f0f0f0',
            padding: 8,
            minHeight: 200
          }}
        >
          {candidate?.chat.map(msg => (
            <div key={msg.id} style={{ marginBottom: 6, textAlign: msg.role === 'ai' ? 'left' : 'right' }}>
              <strong>{msg.role === 'ai' ? 'Bot' : 'You'}:</strong> {msg.text}
            </div>
          ))}
        </div>

        {!testStarted && candidate && !nextField && !candidate.testCompleted && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <Button type="primary" onClick={startTest}>Start Test</Button>
          </div>
        )}

        {(nextField || (testStarted && currentQuestionIndex < questionQueue.length)) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={nextField ? `Enter your ${nextField}...` : 'Type your answer...'}
              onPressEnter={handleSendMessage}
            />
            <Button type="primary" onClick={handleSendMessage}>Send</Button>
          </div>
        )}

        {testStarted && currentQuestionIndex < questionQueue.length && (
          <div style={{ marginTop: 8 }}>
            <Typography.Text type="secondary">
              Timer: {timer}s
            </Typography.Text>
          </div>
        )}
      </Card>
    </div>
  );
}
