import { createSlice } from "@reduxjs/toolkit";

const AuthStatus = {
  isAuth: false,
  UserData: null,
  UserRole: "user",
};

const Auth = createSlice({
  name: "Auth",
  initialState: AuthStatus,
  reducers: {},
});

export const {} = Auth.actions;
export const isAuth = (state) => state.isAuth
export const UserData = (state) => state.UserData;
export const UserRole = (state) => state.UserRole;
export default Auth.reducer;
