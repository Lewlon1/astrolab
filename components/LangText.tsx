"use client";

import type { ReactNode } from "react";
import { useLang } from "@/context/LangContext";

type Props = {
  en: ReactNode;
  es: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
};

export default function LangText({ en, es, as: As = "span", className }: Props) {
  const { lang } = useLang();
  return <As className={className}>{lang === "en" ? en : es}</As>;
}
