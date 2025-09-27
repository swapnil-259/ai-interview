# 🧑‍💻 AI-Powered Interview Assistant

An interactive AI-powered interview platform built with **React + Node.js/Express**.  
It simulates real interview scenarios by asking dynamically generated coding/technical questions and tracking candidate responses.

---

## 🚀 Features

- **Resume Upload**  
  - Accepts **PDF/DOCX**.  
  - Extracts **Name, Email, Phone** automatically.  

- **Missing Fields Handling**  
  - If any field (e.g., phone) is missing from the resume, chatbot prompts candidate to provide it before starting.

- **Interview Flow**  
  - 6 AI-generated questions:  
    - 2 Easy → 2 Medium → 2 Hard.  
  - One question at a time with a countdown timer:  
    - Easy → 20s  
    - Medium → 60s  
    - Hard → 120s  
  - Auto-submits answer when time runs out.  

- **Scoring & Summary**  
  - AI calculates a **final score** and generates a **short summary** after all 6 questions.  

- **Tabs**  
  - **Interviewee Tab** → Candidate chat (Q&A, timers, progress).  
  - **Interviewer Tab** → Dashboard with all candidates, scores, summaries, search, and sort.  
  - Candidate detail view: Full transcript of Q&A and scores.

- **Persistence (Local Storage)**  
  - Saves all timers, answers, and progress locally.  
  - Restores everything after refresh/reopen.  
  - Displays a **“Welcome Back” modal** for unfinished sessions.  

---

## 🛠️ Tech Stack

- **Frontend:** React, TailwindCSS, antd, Redux (for state persistence)
- **Backend:** Node.js
- **AI Integration:** GPT-based question generation & evaluation
- **Build Tool:** Vite
- **Package Manager:** pnpm

---

## 🚀 Getting Started

**1. Clone the repo**
```
git clone https://github.com/your-username/ai-interview-assistant.git
cd ai-interview-assistant
```

**2. Install dependencies**
```
pnpm install
```

**3. Configure API**

**Option A: With backend (recommended)**

If you’re using a Node/Express backend for OpenAI calls, update the API URL in:

src/components/IntervieweeChat.tsx

Replace:
```
const { data } = await axios.post('http://localhost:4000/api/generate-test', { ... })
```
with your deployed backend endpoint.

**Option B: Direct OpenAI call from React**

Make sure your .env contains:
```
VITE_OPENAI_API_KEY=your_api_key_here
```


and restart dev server.

**4. Run in dev mode**
```
pnpm dev
```

**5. Build for production**
```
pnpm build
```

***6. Preview production build***
```
pnpm preview
```

## 🌐 Deployment (Vercel)

This project is ready to deploy on Vercel:

**Push your code to GitHub.**

**Import the repo into Vercel.**

**Add environment variables under Project Settings → Environment Variables.**

## Deploy 🚀

**✅ Checklist (Core Requirements)**

 Resume upload (PDF/DOCX)

 Extract Name, Email, Phone

 Missing fields prompt in chat

 6 dynamic questions (2 Easy, 2 Medium, 2 Hard)

 Timed Q&A flow with auto-next

 AI score + summary generation

 Two tabs: Candidate Chat + Interviewer Dashboard

 Search & sort in dashboard

 Pause/Resume with Welcome Back modal

 State persistence across refresh/close

## 🛠️ Development Notes

Uses Redux for state management.

Persists state with localStorage so progress isn’t lost.

Uses Ant Design for modern UI/UX.

Global Loader component is shown during API requests.

## 👨‍💻 Author

**Swapnil Agrawal**

📧 swapnilagrawal259@gmail.com