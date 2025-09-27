export type ChatMsg = {
  id: string;
  role: 'ai' | 'system' | 'interviewer' | 'interviewee' | 'candidate';
  text: string;
  timestamp: string;
  score?: number;
};