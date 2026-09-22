// src/Store/TemplateSettings.js
import { createSlice } from "@reduxjs/toolkit";
import { getCookie, setCookie } from "../../lib/ReactCookie";

// ============================================
// المفاتيح + الصلاحية
// ============================================
const KEY_LANGUAGE = "app_language";
const KEY_DARKMODE = "app_darkmode";
const COOKIE_TIME = 60 * 60 * 24 * 365; // سنة

// ============================================
// قراءة القيم الأولية من Cookie
// ============================================
const getInitialLanguage = () => {
    try {
        const saved = getCookie(KEY_LANGUAGE);
        if (saved === "ar" || saved === "en") return saved;
    } catch (e) {
        console.warn("Failed to read language:", e);
    }
    return "ar";
};

const getInitialDarkMode = () => {
    try {
        const saved = getCookie(KEY_DARKMODE);
        if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
        console.warn("Failed to read darkmode:", e);
    }
    return "light";
};

// ============================================
// حفظ القيم
// ============================================
const saveLanguage = (lang) => {
    try {
        setCookie({
            name: KEY_LANGUAGE,
            value: lang,
            time: COOKIE_TIME,
        });
    } catch (e) {
        console.warn("Failed to save language:", e);
    }
};

const saveDarkMode = (mode) => {
    try {
        setCookie({
            name: KEY_DARKMODE,
            value: mode,
            time: COOKIE_TIME,
        });
    } catch (e) {
        console.warn("Failed to save darkmode:", e);
    }
};

// ============================================
// تطبيق على <html>
// ============================================
const applyLanguageToHtml = (lang) => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
};

const applyDarkModeToHtml = (mode) => {
    if (typeof document === "undefined") return;
    if (mode === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
};

// ============================================
// الحالة الافتراضية
// ============================================
const defaultStatus = {
    Language: getInitialLanguage(),
    DarkMode: getInitialDarkMode(),
    isLoading: false,
    SideBarIsShow: false,
    PageTitle: null,        // ← جديد
    PageSubtitle: null,     // ← اختياري
};

// ============================================
// Slice
// ============================================
const TemplateSettings = createSlice({
    name: "TemplateSettings",
    initialState: defaultStatus,
    reducers: {
        updateLanguage: (state, action) => {
            const newLang = action.payload.language;
            state.Language = newLang;
            saveLanguage(newLang);
            applyLanguageToHtml(newLang);
        },

        updateDarkMode: (state) => {
            const newMode = state.DarkMode === "dark" ? "light" : "dark";
            state.DarkMode = newMode;
            saveDarkMode(newMode);
            applyDarkModeToHtml(newMode);
        },

        // ✅ للاستخدام في المزامنة بين التبويبات
        setLanguage: (state, action) => {
            const newLang = action.payload;
            state.Language = newLang;
            saveLanguage(newLang);
            applyLanguageToHtml(newLang);
        },

        setDarkMode: (state, action) => {
            const newMode = action.payload;
            state.DarkMode = newMode;
            saveDarkMode(newMode);
            applyDarkModeToHtml(newMode);
        },

        updateSidebarStatus: (state) => {
            state.SideBarIsShow = !state.SideBarIsShow;
        },

        // ============================================
        // ✅ جديد: عنوان الصفحة
        // ============================================
        setPageTitle: (state, action) => {
            state.PageTitle = action.payload?.title || null;
            state.PageSubtitle = action.payload?.subtitle || null;
        },

        clearPageTitle: (state) => {
            state.PageTitle = null;
            state.PageSubtitle = null;
        },
    },
});

// ============================================
// Actions
// ============================================
export const {
    updateLanguage,
    updateDarkMode,
    setLanguage,
    setDarkMode,
    updateSidebarStatus,
    setPageTitle,       // ← جديد
    clearPageTitle,     // ← جديد
} = TemplateSettings.actions;

// ============================================
// Selectors
// ============================================
export const TemplateLanguage = (state) => state.TemplateSettings.Language;
export const TemplateDarkMode = (state) => state.TemplateSettings.DarkMode;
export const TemplateIsLoading = (state) => state.TemplateSettings.isLoading;
export const TemplateSideBarStatus = (state) =>
    state.TemplateSettings.SideBarIsShow;

// ✅ جديد
export const TemplatePageTitle = (state) =>
    state.TemplateSettings.PageTitle;
export const TemplatePageSubtitle = (state) =>
    state.TemplateSettings.PageSubtitle;

export default TemplateSettings.reducer;