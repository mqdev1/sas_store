import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Modal from "../SubComponents/Modal";
import {
    DialogProvider,
    useDialogContext,
} from "../../Context/DialogContext";
import {
    TemplatePageTitle,
    TemplatePageSubtitle,
} from "../../Store/TemplateSettings";
import { getRouteTitle } from "../../Config/routeTitles";

// ============================================
// Component داخلي — عشان useDialogContext
// ============================================
function LayoutContent({ children }) {
    const { pathname } = useLocation();
    const { t, i18n } = useTranslation();
    const dialog = useDialogContext();

    const dynamicTitle = useSelector(TemplatePageTitle);
    const dynamicSubtitle = useSelector(TemplatePageSubtitle);

    // ✅ تحديث document.title
    useEffect(() => {
        const appName = t("app.name", { defaultValue: "Brand" });

        // 1. عنوان ديناميكي من Redux (أولوية)
        if (dynamicTitle) {
            document.title = `${dynamicTitle} | ${appName}`;
            return;
        }

        // 2. route map (fallback)
        const titleKey = getRouteTitle(pathname);
        let pageTitle = appName;

        if (titleKey) {
            const translated = t(titleKey, { defaultValue: "" });
            if (translated) {
                pageTitle = `${translated} | ${appName}`;
            }
        }

        document.title = pageTitle;
    }, [dynamicTitle, dynamicSubtitle, pathname, t, i18n.language]);

    return (
        <div className="min-h-screen flex flex-col pt-25 px-5 md:px-15">
            <Navbar />
            <main className={`flex-1 md:p-15 md:ps-75 md:pe-6`}>
                {children}
            </main>
            <Sidebar />

            {/* ✅ Modal واحد لكل التطبيق */}
            <Modal
                type={dialog.type}
                showModal={dialog.open}
                content={dialog.content}
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
                disabled={dialog.loading}
                confirmEvent={dialog.onApprove}
                cancelEvent={dialog.onCancel}
            />
        </div>
    );
}

// ============================================
// MainLayout — يغلّف LayoutContent بـ Provider
// ============================================
export default function MainLayout({ children }) {
    return (
        <DialogProvider>
            <LayoutContent>{children}</LayoutContent>
        </DialogProvider>
    );
}