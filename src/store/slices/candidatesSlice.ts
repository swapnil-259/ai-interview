import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Candidate } from '../../types/candidate';
import type { ChatMsg } from '../../types/chatMsg';

type CandidatesState = { list: Candidate[] };

const initialState: CandidatesState = { list: [] };

const slice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    createCandidate: (state, action: PayloadAction<Partial<Candidate>>) => {
      const c: Candidate = {
        id: action.payload.id || uuidv4(), 
        name: action.payload.name,
        email: action.payload.email,
        phone: action.payload.phone,
        createdAt: new Date().toISOString(),
        chat: action.payload.chat ?? [],
        currentScore: 0,
        status: 'not-started',
        summary: undefined,
        progress: { currentQuestionIndex: 0, questionStartAt: undefined, pausedAt: undefined },
        resumeFileName: action.payload.resumeFileName,
        score : action.payload.score ?? 0,
        testCompleted: action.payload.testCompleted ?? false
      };
      state.list.push(c);
    },
    updateCandidateProfile: (state, action: PayloadAction<{ id: string; data: Partial<Candidate> }>) => {
      const c = state.list.find(x => x.id === action.payload.id);
      if (!c) return;
      Object.assign(c, action.payload.data);
    },
    addChatMessage: (state, action: PayloadAction<{ id: string; msg: ChatMsg }>) => {
      const c = state.list.find(x => x.id === action.payload.id);
      if (!c) return;
      c.chat.push(action.payload.msg);
    },
    setCandidateScore: (state, action: PayloadAction<{ id: string; score: number }>) => {
      const c = state.list.find(x => x.id === action.payload.id);
      if (!c) return;
      c.currentScore = action.payload.score;
    },
    setCandidateStatus: (
      state,
      action: PayloadAction<{ id: string; status: Candidate['status'] }>
    ) => {
      const c = state.list.find(x => x.id === action.payload.id);
      if (!c) return;
      c.status = action.payload.status;
    },
    setCandidateSummary: (state, action: PayloadAction<{ id: string; summary: string }>) => {
      const c = state.list.find(x => x.id === action.payload.id);
      if (!c) return;
      c.summary = action.payload.summary;
    },
    clearCandidates: (state) => {
        console.log('Clearing candidates');
      state.list = [];
    },
    deleteCandidate: (state, action: PayloadAction<string>) => {
  state.list = state.list.filter(c => c.id !== action.payload);
}
  }
});

export const {
  createCandidate,
  updateCandidateProfile,
  addChatMessage,
  setCandidateScore,
  setCandidateStatus,
  setCandidateSummary,
  clearCandidates,
  deleteCandidate
  
} = slice.actions;

export default slice.reducer;
