// src/Store/store.js
import { configureStore } from "@reduxjs/toolkit";
import TemplateSettings from "./TemplateSettings";
import AuthReducer from "./AuthSlice";   // ← لازم يكون

export const store = configureStore({
    reducer: {
        TemplateSettings,
        auth: AuthReducer,               // ← المفتاح "auth" ضروري
    },
});