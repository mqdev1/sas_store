import { useEffect, useState } from "react"


export default function Modal({
    content = null,
    type = { alert: 'alert', confirm: "confirm" },
    confirmText = "Yes",
    cancelText = "No",
    disabled = false,
    showModal = false,
    confirmEvent = null,
    cancelEvent = null
}) {

    const handlerConfirm = async () => {
        if (confirmEvent) {
            await confirmEvent();
            if (cancelEvent) {
                cancelEvent()
            }
        }
    }
    const handlerCancel = () => {
        if (cancelEvent) {
            cancelEvent()
            setShow(false)
        }
    }

    const [show, setShow] = useState(showModal || false);
    useEffect(() => {
        setShow(showModal)
    }, [showModal])

    return (
        <>
            {show && <div className="flex fixed z-100 items-center justify-center top-0 left-0 right-0 bottom-0 w-auto h-auto backdrop-blur-md">

                <div className="flex flex-col bg-(--bg-main) w-100 rounded-md border border-(--bg-border) p-4 shadow-xl">
                    <div className="flex flex-row p-3">
                        {content}
                    </div>
                    <div className="flex items-center justify-end p-2 gap-3">
                        {
                            type == "alert" && <button className="bg-(--color-mint) opacity-90 px-3 py-1 rounded-md disabled:opacity-35 not-disabled:hover:opacity-100 text-white cursor-pointer" onClick={() => handlerCancel()} disabled={disabled}>
                                {confirmText}
                            </button>
                        }
                        {
                            type == "confirm" && <>
                                <button className="text-(--color-pink) px-3 py-1 rounded-md disabled:opacity-35 not-disabled:hover:bg-(--color-error) not-disabled:hover:text-white cursor-pointer" onClick={() => handlerCancel()} disabled={disabled}>
                                    {cancelText}
                                </button>
                                <button className="bg-(--color-mint) text-white opacity-90 disabled:opacity-35 not-disabled:hover:opacity-100 px-3 py-1 rounded-md cursor-pointer" onClick={() => handlerConfirm()} disabled={disabled}>
                                    {confirmText}
                                </button>
                            </>
                        }
                    </div>
                </div>

            </div>}
        </>
    )

}