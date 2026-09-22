import { useCallback, useEffect, useState } from "react";

/**
 * Hook موحّد لجلب بيانات من Supabase مع pagination + search
 *
 * @param {Function} fetcher - دالة الاستدعاء (مثل productsService.getAll)
 * @param {Object} options - { page, pageSize, search, filters }
 * @returns { data, loading, error, count, refresh }
 */
export function useSupabaseTable(fetcher, options = {}) {
    const {
        page = 0,
        pageSize = 50,
        search = "",
        filters = {},
        enabled = true,
    } = options;

    const [data, setData] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetcher({
                    page,
                    pageSize,
                    search,
                    ...filters,
                });

                if (!cancelled) {
                    // يدعم { data, count } أو data فقط
                    if (Array.isArray(result)) {
                        setData(result);
                        setCount(result.length);
                    } else {
                        setData(result.data || []);
                        setCount(result.count || (result.data?.length ?? 0));
                    }
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [fetcher, page, pageSize, search, JSON.stringify(filters), reloadKey, enabled]);

    return { data, count, loading, error, refresh };
}