import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRouteTitle } from "../Config/routeTitles";

const APP_NAME_KEY = "app.name";

export function useDocumentTitle() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const appName = t(APP_NAME_KEY, { defaultValue: "Store" });
    const titleKey = getRouteTitle(pathname);

    let pageTitle = appName;

    if (titleKey) {
      const translated = t(titleKey, { defaultValue: "" });
      if (translated) {
        pageTitle = `${translated} | ${appName}`;
      }
    }

    document.title = pageTitle;
  }, [pathname, t, i18n.language]);
}
