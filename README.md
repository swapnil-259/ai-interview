# 🧑‍💻 AI-Powered Interview Assistant

An interactive AI-powered interview platform built with **React + Node.js/Express + FastAPI backend**.  
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
