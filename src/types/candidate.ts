export type Candidate = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt: string; 
  chat: Array<{
    id: string;
    role: 'system'|'ai'|'interviewee'|'interviewer' |'candidate';
    text: string;
    timestamp: string;
    score?: number; 
  }>;
  currentScore: number;
  status: 'not-started'|'in-progress'|'paused'|'finished';
  summary?: string;
  progress?: { currentQuestionIndex: number; questionStartAt?: number; pausedAt?: number }
  resumeFileName?: string;
  score?: number;
  testCompleted: boolean;
}