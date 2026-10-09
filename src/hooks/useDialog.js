import { useCallback, useEffect, useState, useRef } from "react";

// Global reference
let globalDialog = null;

export function useDialog() {
    const [state, setState] = useState({
        open: false,
        type: "alert",
        content: null,
        confirmText: "OK",
        cancelText: "Cancel",
        loading: false,
    });

    const resolverRef = useRef(null);

    // ============================================
    // Alert
    // ============================================
    const alert = useCallback((content) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setState({
                open: true,
                type: "alert",
                content: String(content),
                confirmText: "OK",
                cancelText: null,
                loading: false,
            });
        });
    }, []);

    // ============================================
    // Confirm
    // ============================================
    const confirm = useCallback((content) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setState({
                open: true,
                type: "confirm",
                content: String(content),
                confirmText: "OK",
                cancelText: "Cancel",
                loading: false,
            });
        });
    }, []);

    // ============================================
    // Close
    // ============================================
    const close = useCallback((result) => {
        setState((prev) => ({ ...prev, open: false }));
        if (resolverRef.current) {
            resolverRef.current(result);
            resolverRef.current = null;
        }
    }, []);

    const onApprove = useCallback(() => close(true), [close]);
    const onCancel = useCallback(() => close(false), [close]);

    // ============================================
    // Global Override
    // ============================================
    useEffect(() => {
        globalDialog = { alert, confirm };

        const originalAlert = window.alert;
        const originalConfirm = window.confirm;

        // ✅ alert
        window.alert = (message) => {
            if (globalDialog) {
                globalDialog.alert(String(message));
            } else {
                originalAlert(message);
            }
        };

        // ✅ confirm
        window.confirm = (message) => {
            if (globalDialog) {
                globalDialog.confirm(String(message));
                // ⚠️ sync: نرجع false دايمًا
                // (المستخدم لازم يتحكم async من صفحته)
                return false;
            }
            return originalConfirm(message);
        };

        return () => {
            window.alert = originalAlert;
            window.confirm = originalConfirm;
            globalDialog = null;
        };
    }, [alert, confirm]);

    return {
        ...state,
        alert,
        confirm,
        onApprove,
        onCancel,
        close,
    };
}