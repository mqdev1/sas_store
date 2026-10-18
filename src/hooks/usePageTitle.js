import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
    setPageTitle,
    clearPageTitle,
} from "../Store/TemplateSettings";

/**
 * usePageTitle
 *
 * @param {string} title - العنوان الديناميكي
 * @param {object} options - خيارات
 *   @param {string} options.subtitle - عنوان فرعي
 *   @param {Array} options.deps - dependencies إضافية
 *
 * أمثلة:
 *   usePageTitle(product?.name);
 *   usePageTitle(order ? `الطلب #${order.id}` : null);
 */
export function usePageTitle(title, options = {}) {
    const dispatch = useDispatch();
    const { subtitle = null, deps = [] } = options;

    useEffect(() => {
        if (title) {
            dispatch(setPageTitle({ title, subtitle }));
        }

        // عند unmount → امسح
        return () => {
            dispatch(clearPageTitle());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, subtitle, dispatch, ...deps]);
}