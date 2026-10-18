import { t } from "i18next";
import { useEffect, useState } from "react";

export default function Modal({
    content = null,
    type = "alert",
    confirmText = "OK",
    cancelText = "Cancel",
    disabled = false,
    showModal = false,
    confirmEvent = null,
    cancelEvent = null,
}) {
    const [show, setShow] = useState(showModal || false);
    const _confirmText_ = t("common.ok") || confirmText
    const _cancelText_ = t("common.cancel") || cancelText

    useEffect(() => {
        setShow(showModal);
    }, [showModal]);

    const handlerConfirm = async () => {
        if (confirmEvent) await confirmEvent();
    };

    const handlerCancel = () => {
        if (cancelEvent) cancelEvent();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="flex w-full max-w-md flex-col rounded-xl border border-(--bg-border) bg-(--bg-main) p-5 shadow-2xl">
                {/* المحتوى */}
                <div className="py-2 text-sm leading-relaxed text-(--text-primary)">
                    {content}
                </div>

                {/* الأزرار */}
                <div className="mt-4 flex items-center justify-end gap-2">
                    {type === "alert" && (
                        <button
                            type="button"
                            className="rounded-lg bg-(--color-mint) px-4 py-2 text-sm font-bold text-white opacity-90 transition-opacity hover:opacity-100 disabled:opacity-50"
                            onClick={handlerConfirm}
                            disabled={disabled}
                        >
                            {_confirmText_}
                        </button>
                    )}

                    {type === "confirm" && (
                        <>
                            <button
                                type="button"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) disabled:opacity-50"
                                onClick={handlerCancel}
                                disabled={disabled}
                            >
                                {_cancelText_}
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-(--color-mint) px-4 py-2 text-sm font-bold text-white opacity-90 transition-opacity hover:opacity-100 disabled:opacity-50"
                                onClick={handlerConfirm}
                                disabled={disabled}
                            >
                                {_confirmText_}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}