import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Upload,
    X,
    Star,
    GripVertical,
} from "lucide-react";

export default function ImageUploader({
    images = [],
    onChange,
    maxImages = 8,
    primaryIndex = 0,
    disabled = false,
}) {
    const { t } = useTranslation();
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleFiles = (files) => {
        const fileList = Array.from(files).slice(
            0,
            maxImages - images.length
        );

        const valid = fileList.filter((f) => {
            if (!f.type.startsWith("image/")) return false;
            if (f.size > 5 * 1024 * 1024) {
                alert(t("common.imageUploader.fileTooLarge", { name: f.name }));
                return false;
            }
            return true;
        });

        if (valid.length === 0) return;

        const withPreview = valid.map((file) =>
            Object.assign(file, {
                preview: URL.createObjectURL(file),
            })
        );

        onChange([...images, ...withPreview]);
    };

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragging(false);
            if (disabled) return;
            handleFiles(e.dataTransfer.files);
        },
        [images, maxImages, disabled]
    );

    const removeImage = (index) => {
        if (disabled) return;
        onChange(images.filter((_, i) => i !== index));
    };

    const setPrimary = (index) => {
        if (disabled || index === 0) return;
        const newImages = [...images];
        const [item] = newImages.splice(index, 1);
        newImages.unshift(item);
        onChange(newImages);
    };

    const handleSort = () => {
        if (disabled) return;
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newImages = [...images];
        const [dragged] = newImages.splice(dragItem.current, 1);
        newImages.splice(dragOverItem.current, 0, dragged);
        dragItem.current = null;
        dragOverItem.current = null;
        onChange(newImages);
    };

    const getSrc = (img) =>
        typeof img === "string" ? img : img.preview || "";

    return (
        <div className="flex flex-col gap-3">
            <div
                onDrop={onDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    !disabled && setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${
                    dragging
                        ? "border-(--color-lavender) bg-(--color-lavender)/5"
                        : "border-(--bg-border) hover:border-(--color-lavender)/50"
                } ${images.length >= maxImages ? "opacity-50" : ""}`}
            >
                <div className="rounded-full bg-(--color-lavender)/10 p-3">
                    <Upload size={22} className="text-(--color-lavender)" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-(--text-primary)">
                        {t("common.imageUploader.dropHere")}
                    </p>
                    <p className="mt-1 text-xs text-(--text-muted)">
                        {t("common.imageUploader.formats")}
                    </p>
                    <p className="mt-0.5 text-xs text-(--text-muted)">
                        {t("common.imageUploader.count", {
                            count: images.length,
                            max: maxImages,
                        })}
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={disabled || images.length >= maxImages}
                />
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((img, i) => (
                        <div
                            key={i}
                            draggable={!disabled}
                            onDragStart={() => (dragItem.current = i)}
                            onDragEnter={() => (dragOverItem.current = i)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-(--bg-border) bg-(--bg-main) cursor-move"
                        >
                            <img
                                src={getSrc(img)}
                                alt={t("common.imageUploader.imageAlt", {
                                    index: i + 1,
                                })}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />

                            <div className="absolute inset-s-2 top-2 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <GripVertical size={12} />
                            </div>

                            {i === primaryIndex && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-(--color-amber) px-2 py-0.5 text-[10px] font-bold text-white">
                                    <Star size={10} fill="white" />
                                    {t("common.imageUploader.primary")}
                                </div>
                            )}

                            {!disabled && (
                                <div className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    {i !== primaryIndex && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPrimary(i);
                                            }}
                                            className="rounded-full bg-white/90 p-1.5 text-(--color-amber) transition-colors hover:bg-white"
                                            title={t(
                                                "common.imageUploader.setAsPrimary"
                                            )}
                                        >
                                            <Star size={12} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(i);
                                        }}
                                        className="rounded-full bg-white/90 p-1.5 text-(--color-error) transition-colors hover:bg-white"
                                        title={t("common.imageUploader.remove")}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}