"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "tr", name: "Türkçe" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "zh", name: "中文" },
  { code: "hi", name: "हिन्दी" },
  { code: "ru", name: "Русский" },
];

interface LanguageSelectorProps {
  onChange?: (lang: string) => void;
}

export function LanguageSelector({ onChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("en");

  const currentLang = languages.find((l) => l.code === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
      >
        <Globe className="h-3.5 w-3.5" />
        {currentLang?.name}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelected(lang.code);
                setOpen(false);
                onChange?.(lang.code);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-50 ${
                selected === lang.code
                  ? "font-medium text-yasmin"
                  : "text-gray-700"
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
