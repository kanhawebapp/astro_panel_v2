import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  user: null, 
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    clearCredentials: (state) => {
      state.accessToken = null;
      state.user = null;
    },
    logoutSuccess: () => initialState, 
  },
});

export const { setCredentials, clearCredentials, logoutSuccess } = authSlice.actions;

export default authSlice.reducer;
