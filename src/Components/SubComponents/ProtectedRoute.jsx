import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const { user, session, initialized } = useSelector((s) => s.auth);
    const location = useLocation();

    // 🔵 DEBUG
    console.log("🛡️ [ProtectedRoute]", {
        user: user?.email || null,
        session: !!session,
        initialized,
        pathname: location.pathname,
    });

    if (!initialized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-(--bg-main)">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--bg-border) border-t-(--color-lavender)" />
            </div>
        );
    }

    const isAuthenticated = !!session || !!user;

    if (!isAuthenticated) {
        console.log("🛡️ [ProtectedRoute] 🔴 غير مصادق → /login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log("🛡️ [ProtectedRoute] 🟢 مصادق → عرض المحتوى");
    return children;
}