import { ForwardIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";



export default function Error() {

    const navigate = useNavigate();

    return (
        <>
            <div className="flex flex-col gap-4 h-100 items-center justify-center text-center">
                <h1 className="text-4xl">لايمكن عرض الصفحة المطلوبة</h1>
                <p className="text-xl text-(--color-lavender)">يرجى التواصل مع الفريق التقني لحل المشكلة</p>
                <p>او</p>
                <button
                    onClick={() => navigate('/')}
                    className="flex p-3 rounded-full cursor-pointer transition-colors
                    items-center
                    shadow-sm dark:shadow-2xl
                    gap-2
                        border border-(--bg-border)
                        text-(--text-muted)
                        hover:bg-(--bg-hover)
                        hover:text-(--color-lavender)"
                >
                    <ForwardIcon className="text-(--color-lavender)" />
                    <b className="text-sm font-bold text-(--text-primary)">
                        الرجوع للصفحة الرئيسية
                    </b>
                </button>
            </div>
        </>
    )
}