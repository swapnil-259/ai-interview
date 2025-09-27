import { createSlice } from "@reduxjs/toolkit";


const slice = createSlice({
  name: 'ui',
  initialState: {
    isLoading: false,
    error: null,
  },
  reducers: {
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setLoading, setError } = slice.actions;
export default slice.reducer;
