import { createContext, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  TemplateDarkMode,
  TemplateIsLoading,
  TemplateLanguage,
  TemplateSideBarStatus
} from "../../Store/TemplateSettings";

export const TemplateContext = createContext(null);

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within TemplateSettings");
  }
  return context;
};

export default function TemplateSettings({ children }) {
  const Language = useSelector(TemplateLanguage);
  const DarkMode = useSelector(TemplateDarkMode);
  const isLoading = useSelector(TemplateIsLoading);
  const sideBarStatus = useSelector(TemplateSideBarStatus);

  useEffect(() => {
    let doc = document;
    doc.body.classList.remove('dark', 'light');
    doc.body.classList.add(DarkMode)

    const langs = ["ar", "far"];
    // سوف يتم التحقق من ان اللغة لا تدعم القرائة من اليسار الي اليمين
    doc.dir = langs.indexOf(Language) > -1 ? 'rtl' : 'ltr';

  }, [DarkMode, Language]);

  return (
    <TemplateContext.Provider
      value={{ Language, DarkMode, isLoading, sideBarStatus }}
    >
      {children}
    </TemplateContext.Provider>
  );
}