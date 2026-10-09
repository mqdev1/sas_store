import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../Services/AuthService";

// ============================================
// Thunks
// ============================================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.loginRequest(credentials);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      return await authService.registerRequest(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logoutRequest();
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const loadSession = createAsyncThunk(
  "auth/loadSession",
  async (_, { rejectWithValue }) => {
    try {
      const session = await authService.getCurrentSession();
      if (!session) return null;

      const user = await authService.getCurrentUser();
      return { session, user };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// ============================================
// Slice
// ============================================
const initialState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSession: (state, action) => {
      state.session = action.payload;
      state.user = action.payload?.user || null;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload?.session || null;
        state.user = action.payload?.user || null;
        state.initialized = true; // ← ضروري
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.session = null;
    });

    // loadSession
    builder
      .addCase(loadSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload?.session || null;
        state.user = action.payload?.user || null;
        state.initialized = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      });
  },
});

export const { clearError, setSession } = authSlice.actions;
export default authSlice.reducer;
