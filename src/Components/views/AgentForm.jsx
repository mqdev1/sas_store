import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Bot,
    Save,
    Puzzle,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Key,
    Eye,
    EyeOff,
    Cpu,
    Lock,
    Sparkles,
} from "lucide-react";
import {
    AVAILABLE_TOOLS,
    PROVIDERS,
    MODELS_BY_PROVIDER,
    PROMPT_TEMPLATES,
} from "../../data/agentsData";
import * as agentsService from "../../Services/agentsService";

// ============================================
// حقل موحّد
// ============================================
function Field({
    icon: Icon,
    label,
    error,
    children,
    endAdornment,
    ...inputProps
}) {
    const Component = inputProps.as || "input";
    return (
        <div className="flex w-full flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputProps.name}
                    className="ps-1 text-xs font-medium text-(--text-secondary)"
                >
                    {label}
                </label>
            )}

            <div className="relative flex w-full items-center">
                {Icon && (
                    <Icon
                        size={17}
                        className="pointer-events-none absolute inset-s-3 text-(--text-muted)"
                    />
                )}
                <Component
                    {...inputProps}
                    id={inputProps.name}
                    className={`box-border w-full rounded-xl border p-2 ${
                        Icon ? "ps-10" : "ps-3"
                    } ${endAdornment ? "pe-10" : ""} text-sm
                        bg-(--bg-elevated) text-(--text-primary)
                        placeholder:text-(--text-muted)
                        outline-0 transition-colors
                        disabled:opacity-60
                        ${
                            error
                                ? "border-(--color-error) focus:border-(--color-error)"
                                : "border-(--bg-border) focus:border-(--color-lavender)"
                        }`}
                >
                    {children}
                </Component>
                {endAdornment && (
                    <div className="absolute inset-e-3 flex items-center">
                        {endAdornment}
                    </div>
                )}
            </div>

            {error && (
                <span className="ps-1 text-xs text-(--color-error)">
                    {error}
                </span>
            )}
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function AgentForm() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        name: "",
        description: "",
        provider: "groq",
        model: "openai/gpt-oss-20b",
        api_key: "",
        system_prompt:
            "أنت مساعد ذكي يساعد المستخدمين في إدارة المتجر.",
        tools: [],
        temperature: 0.7,
        is_active: true,
        color: "#6366F1",
    });

    const [keyInfo, setKeyInfo] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // ============================================
    // تحميل عند التعديل
    // ============================================
    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;
        (async () => {
            try {
                const a = await agentsService.getById(id);
                if (cancelled) return;

                setForm({
                    name: a.name || "",
                    description: a.description || "",
                    provider: a.provider || "groq",
                    model: a.model || "",
                    api_key: "",
                    system_prompt: a.system_prompt || "",
                    tools: a.tools || [],
                    temperature: Number(a.temperature) || 0.7,
                    is_active: a.is_active ?? true,
                    color: a.color || "#6366F1",
                });

                try {
                    const keyData = await agentsService.getMaskedKey(id);
                    if (!cancelled) setKeyInfo(keyData);
                } catch (keyErr) {
                    console.warn("Key info error:", keyErr);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    const updateField = (name, value) =>
        setForm((prev) => ({ ...prev, [name]: value }));

    const toggleTool = (toolId) => {
        setForm((prev) => ({
            ...prev,
            tools: prev.tools.includes(toolId)
                ? prev.tools.filter((t) => t !== toolId)
                : [...prev.tools, toolId],
        }));
    };

    const applyTemplate = (templateId) => {
        const template = PROMPT_TEMPLATES.find(
            (t) => t.id === templateId
        );
        if (!template) return;

        setForm((f) => ({
            ...f,
            name: f.name || template.name,
            description: f.description || template.description,
            system_prompt: template.prompt,
            tools: template.tools,
        }));
    };

    const handleProviderChange = (provider) => {
        setForm((prev) => ({
            ...prev,
            provider,
            model: MODELS_BY_PROVIDER[provider]?.[0] || "",
        }));
    };

    // ============================================
    // Validation
    // ============================================
    const validate = () => {
        const err = {};
        if (!form.name || form.name.length < 3)
            err.name = t("agents.form.required.name");
        if (!form.system_prompt || form.system_prompt.length < 10)
            err.system_prompt = t("agents.form.required.systemPrompt");
        if (!form.tools.length)
            err.tools = t("agents.form.required.tools");
        if (!form.model)
            err.model = t("agents.form.required.model");
        if (!isEdit && !form.api_key)
            err.api_key = t("agents.form.required.apiKey");
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!validate()) return;

        setLoading(true);
        try {
            const unique = await agentsService.isNameUnique(
                form.name.trim(),
                isEdit ? Number(id) : null
            );
            if (!unique) {
                setError(t("agents.form.nameUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                provider: form.provider,
                model: form.model,
                system_prompt: form.system_prompt.trim(),
                tools: form.tools,
                temperature: Number(form.temperature),
                is_active: form.is_active,
                color: form.color,
            };

            if (form.api_key) {
                payload.api_key = form.api_key;
            }

            if (isEdit) {
                await agentsService.update(id, payload);
            } else {
                await agentsService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/agents"), 1200);
        } catch (err) {
            setError(err.message || t("agents.form.genericError"));
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // Loading
    // ============================================
    if (initialLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("agents.form.loading")}
                    </p>
                </div>
            </div>
        );
    }

    const availableModels = MODELS_BY_PROVIDER[form.provider] || [];

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {/* رأس الصفحة */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/agents")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                >
                    <ArrowRight
                        size={16}
                        className={isRTL ? "" : "rotate-180"}
                    />
                </button>
                <div className="flex items-center gap-2">
                    <Bot size={24} className="text-(--color-lavender)" />
                    <h1 className="text-2xl font-bold text-(--text-primary)">
                        {isEdit
                            ? t("agents.form.editTitle")
                            : t("agents.form.createTitle")}
                    </h1>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("agents.form.basicInfo")}
                    </h2>
                    <div className="flex flex-col gap-4">
                        <Field
                            icon={Bot}
                            label={t("agents.form.name")}
                            name="name"
                            value={form.name}
                            onChange={(e) =>
                                updateField("name", e.target.value)
                            }
                            placeholder={t("agents.form.namePlaceholder")}
                            error={errors.name}
                        />

                        <Field
                            label={t("agents.form.description")}
                            name="description"
                            value={form.description}
                            onChange={(e) =>
                                updateField("description", e.target.value)
                            }
                            placeholder={t(
                                "agents.form.descriptionPlaceholder"
                            )}
                        />
                    </div>
                </div>

                {/* الإعدادات */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("agents.form.settings")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Cpu}
                            label={t("agents.form.provider")}
                            name="provider"
                            as="select"
                            value={form.provider}
                            onChange={(e) =>
                                handleProviderChange(e.target.value)
                            }
                        >
                            {PROVIDERS.map((p) => (
                                <option key={p.key} value={p.key}>
                                    {p.label}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Cpu}
                            label={t("agents.form.model")}
                            name="model"
                            as="select"
                            value={form.model}
                            onChange={(e) =>
                                updateField("model", e.target.value)
                            }
                            error={errors.model}
                        >
                            {availableModels.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </Field>

                        {/* المفتاح الحالي */}
                        {isEdit && keyInfo?.has_key && (
                            <div className="md:col-span-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="ps-1 text-xs font-medium text-(--text-secondary)">
                                        {t("agents.form.currentKey")}
                                    </label>
                                    <div className="flex items-center gap-2 rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-2.5">
                                        <Lock
                                            size={15}
                                            className="text-(--color-mint)"
                                        />
                                        <span className="font-mono text-xs text-(--text-primary)">
                                            {keyInfo.api_key_masked}
                                        </span>
                                        <span className="ms-auto rounded-full bg-(--color-mint)/10 px-2 py-0.5 text-[10px] font-medium text-(--color-mint)">
                                            {t("agents.form.keySaved")}
                                        </span>
                                    </div>
                                    <span className="ps-1 text-[10px] text-(--text-muted)">
                                        {t("agents.form.keyChangeHint")}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Field
                            icon={Key}
                            label={
                                isEdit
                                    ? t("agents.form.apiKeyEdit")
                                    : t("agents.form.apiKey")
                            }
                            name="api_key"
                            type={showApiKey ? "text" : "password"}
                            value={form.api_key}
                            onChange={(e) =>
                                updateField("api_key", e.target.value)
                            }
                            placeholder={
                                isEdit
                                    ? t("agents.form.apiKeyPlaceholderEdit")
                                    : t("agents.form.apiKeyPlaceholder")
                            }
                            error={errors.api_key}
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowApiKey((s) => !s)
                                    }
                                    className="cursor-pointer text-(--text-muted) hover:text-(--color-lavender)"
                                >
                                    {showApiKey ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>
                            }
                        />

                        <Field
                            label={t("agents.form.temperature")}
                            name="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={form.temperature}
                            onChange={(e) =>
                                updateField(
                                    "temperature",
                                    Number(e.target.value)
                                )
                            }
                        />
                    </div>

                    <div className="mt-4 flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-(--text-secondary)">
                            {t("agents.form.systemPrompt")}
                        </label>

                        {/* قوالب جاهزة */}
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 py-1 text-xs font-medium text-(--text-muted)">
                                <Sparkles size={12} />
                                {t("agents.form.templates")}
                            </span>
                            {PROMPT_TEMPLATES.map((tpl) => (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => applyTemplate(tpl.id)}
                                    className="rounded-full border border-(--bg-border) bg-(--bg-card) px-3 py-1 text-xs font-medium text-(--text-secondary) transition-colors hover:border-(--color-lavender) hover:bg-(--color-lavender)/10 hover:text-(--color-lavender)"
                                    title={tpl.description}
                                >
                                    {tpl.name}
                                </button>
                            ))}
                        </div>

                        <textarea
                            rows={4}
                            value={form.system_prompt}
                            onChange={(e) =>
                                updateField(
                                    "system_prompt",
                                    e.target.value
                                )
                            }
                            className={`rounded-xl border bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender) ${
                                errors.system_prompt
                                    ? "border-(--color-error)"
                                    : "border-(--bg-border)"
                            }`}
                        />
                        {errors.system_prompt && (
                            <span className="text-xs text-(--color-error)">
                                {errors.system_prompt}
                            </span>
                        )}
                    </div>

                    {/* الحالة */}
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                        <div>
                            <span className="text-sm font-medium text-(--text-primary)">
                                {t("agents.form.activate")}
                            </span>
                            <p className="text-xs text-(--text-muted)">
                                {t("agents.form.activateHint")}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                updateField(
                                    "is_active",
                                    !form.is_active
                                )
                            }
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                                form.is_active
                                    ? "bg-(--color-lavender)"
                                    : "bg-(--bg-border)"
                            }`}
                        >
                            <span
                                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                                style={{
                                    left: form.is_active ? 22 : 2,
                                }}
                            />
                        </button>
                    </div>
                </div>

                {/* الأدوات */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("agents.form.tools")}
                    </h2>
                    <p className="mb-3 text-xs text-(--text-muted)">
                        {t("agents.form.toolsHint")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {AVAILABLE_TOOLS.map((tool) => {
                            const checked = form.tools.includes(tool.id);
                            return (
                                <button
                                    type="button"
                                    key={tool.id}
                                    onClick={() => toggleTool(tool.id)}
                                    className={`flex items-center gap-2 rounded-xl border p-3 text-start text-sm transition-all ${
                                        checked
                                            ? "border-(--color-lavender) bg-(--color-lavender)/10"
                                            : "border-(--bg-border) hover:bg-(--bg-hover)"
                                    }`}
                                >
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                            checked
                                                ? "bg-(--color-lavender) text-white"
                                                : "bg-(--bg-hover) text-(--text-secondary)"
                                        }`}
                                    >
                                        <Puzzle size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-(--text-primary)">
                                            {tool.name}
                                        </span>
                                        <span className="text-[10px] text-(--text-muted)">
                                            {tool.description}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {errors.tools && (
                        <span className="mt-2 block text-xs text-(--color-error)">
                            {errors.tools}
                        </span>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                        <AlertCircle
                            size={18}
                            className="shrink-0 text-(--color-error)"
                        />
                        <span className="text-(--text-primary)">
                            {error}
                        </span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-success)/40 bg-(--color-success)/5 p-3 text-sm">
                        <CheckCircle2
                            size={18}
                            className="shrink-0 text-(--color-success)"
                        />
                        <span className="text-(--text-primary)">
                            {isEdit
                                ? t("agents.form.successUpdate")
                                : t("agents.form.successCreate")}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/agents")}
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--bg-hover)"
                    >
                        {t("agents.form.cancel")}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit
                            ? t("agents.form.update")
                            : t("agents.form.save")}
                    </button>
                </div>
            </form>
        </div>
    );
}