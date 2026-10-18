import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    MenuIcon,
    Moon,
    Search,
    Sun,
    User,
} from "lucide-react";
import { useSyncCookie } from "../../lib/ReactCookie";
import {
    updateDarkMode,
    updateLanguage,
    updateSidebarStatus,
    setDarkMode,
    setLanguage,
    TemplateLanguage,
    TemplateDarkMode,
} from "../../Store/TemplateSettings";

import { useTranslation } from "react-i18next";
import i18n from "../../lib/i18n";

const KEY_LANGUAGE = "app_language";
const KEY_DARKMODE = "app_darkmode";

export default function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { t } = useTranslation();

    const language = useSelector(TemplateLanguage);
    const darkMode = useSelector(TemplateDarkMode);

    // ✅ 1. مزامنة تلقائية بين التبويبات
    const syncedLanguage = useSyncCookie(KEY_LANGUAGE);
    const syncedDarkMode = useSyncCookie(KEY_DARKMODE);

    // ✅ 2. لو تغيّرت القيمة في تبويب آخر → حدّث Redux
    useEffect(() => {
        if (syncedLanguage && syncedLanguage !== language) {
            dispatch(setLanguage(syncedLanguage));
        }
    }, [syncedLanguage, language, dispatch]);

    useEffect(() => {
        if (syncedDarkMode && syncedDarkMode !== darkMode) {
            dispatch(setDarkMode(syncedDarkMode));
        }
    }, [syncedDarkMode, darkMode, dispatch]);

    // ✅ 3. تطبيق اللغة على <html>
    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    }, [language]);

    // ✅ 4. تطبيق Dark Mode على <html>
    useEffect(() => {
        if (darkMode === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    // ✅ 5. دوال التبديل
    const toggleDarkMode = () => {
        dispatch(updateDarkMode());
    };

    const changeLanguage = (lang) => {
        dispatch(updateLanguage({ language: lang }));
        i18n.changeLanguage(lang);
    };

    return (
        <nav className="fixed top-2 left-2 right-2 md:top-5 md:left-20 md:right-20 z-50
            flex items-center justify-between
            bg-(--bg-card) rounded-xl p-4 md:p-5
            shadow-xs
            border border-(--bg-border)
            transition-colors duration-300">

            <div className="flex items-center">
                <div className="flex md:hidden">
                    <button
                        className="p-2 rounded-full cursor-pointer transition-colors
                            text-(--text-muted)
                            hover:text-(--color-lavender) me-2"
                        onClick={() => dispatch(updateSidebarStatus())}
                    >
                        <MenuIcon />
                    </button>
                </div>
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <LayoutDashboard className="text-(--color-lavender)" />
                    <h1 className="text-xl font-bold text-(--text-primary)">
                        {t("navbar.brand")}
                    </h1>
                </button>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                <div className="relative items-center hidden md:flex">
                    <Search
                        size={17}
                        className="absolute inset-s-3 text-(--text-muted) pointer-events-none"
                    />
                    <input
                        id="search"
                        name="search"
                        type="search"
                        placeholder={t("navbar.search")}
                        autoComplete="off"
                        className="p-2 ps-10 rounded-xl box-border outline-0 w-56
                            border border-(--bg-border)
                            text-sm
                            bg-(--bg-elevated)
                            text-(--text-primary)
                            placeholder:text-(--text-muted)
                            focus:border-(--color-lavender)
                            transition-colors"
                    />
                </div>

                <button
                    onClick={toggleDarkMode}
                    aria-label={t("navbar.darkMode")}
                    className="p-2 rounded-full cursor-pointer transition-colors
                        border border-(--bg-border)
                        text-(--text-muted)
                        text-sm
                        hover:bg-(--bg-hover)
                        hover:text-(--color-lavender)"
                >
                    {darkMode === "light" ? (
                        <Moon size={20} />
                    ) : (
                        <Sun size={20} />
                    )}
                </button>

                <div className="flex rounded-full gap-1 p-1
                    border border-(--bg-border)">
                    {[
                        { code: "ar", label: "العربية", short: "ع" },
                        { code: "en", label: "English", short: "E" },
                    ].map(({ code, label, short }) => (
                        <button
                            key={code}
                            onClick={() => changeLanguage(code)}
                            className={`cursor-pointer px-3 py-1 rounded-full text-sm transition-all
                                ${language === code
                                    ? "bg-(--color-lavender) text-white font-bold shadow-sm"
                                    : "text-(--text-secondary) hover:text-(--color-lavender)"
                                }`}
                        >
                            <span className="hidden md:block">{label}</span>
                            <span className="sm:block md:hidden">{short}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => navigate("/profile")}
                    aria-label={t("navbar.profile")}
                    className="p-2 rounded-full cursor-pointer transition-colors
                        border border-(--bg-border)
                        text-(--text-muted)
                        hover:bg-(--bg-hover)
                        hover:text-(--color-lavender) flex items-center"
                >
                    <User size={20} strokeWidth={2} />
                </button>
            </div>
        </nav>
    );
}