import { createContext, useContext } from "react";
import { useDialog } from "../hooks/useDialog";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
    const dialog = useDialog();
    return (
        <DialogContext.Provider value={dialog}>
            {children}
        </DialogContext.Provider>
    );
}

export function useDialogContext() {
    const ctx = useContext(DialogContext);
    if (!ctx) {
        throw new Error(
            "useDialogContext must be used inside DialogProvider"
        );
    }
    return ctx;
}