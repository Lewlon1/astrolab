"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: 1 | 2 | 3 | 4;
  className?: string;
};

export default function Reveal({ children, delay, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay ? ` reveal-d${delay}` : "";
  const extra = className ? ` ${className}` : "";

  return (
    <div ref={ref} className={`reveal${delayClass}${extra}`}>
      {children}
    </div>
  );
}
