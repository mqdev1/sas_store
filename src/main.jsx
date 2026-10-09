import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import TemplateSettings from "./Context/TemplateSettings";
import { store } from "./Store/index.js";
import { getCookie } from "./lib/ReactCookie";
import { setLanguage, setDarkMode } from "./Store/TemplateSettings";
import i18n from "./lib/i18n.js";

// ✅ 1. اقرأ القيم من ReactCookie قبل التطبيق
const savedLanguage = getCookie("app_language");
const savedDarkMode = getCookie("app_darkmode");

// ✅ 2. طبّقها على Redux
if (savedLanguage === "ar" || savedLanguage === "en") {
    store.dispatch(setLanguage(savedLanguage));
}

if (savedDarkMode === "dark" || savedDarkMode === "light") {
    store.dispatch(setDarkMode(savedDarkMode));
}

// ✅ 3. طبّق على <html> مباشرة
if (savedLanguage) {
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
    i18n.changeLanguage(savedLanguage);
}

if (savedDarkMode === "dark") {
    document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <TemplateSettings>
                <App />
            </TemplateSettings>
        </Provider>
    </StrictMode>
);