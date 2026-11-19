"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeGroup, activeItem, visibleNavGroups } from "./navConfig";
import NavIconSvg from "./NavIcons";

const groups = visibleNavGroups();

/**
 * Mobile bottom tab bar (hidden from md up). A single-page group links straight
 * there; a multi-page group opens a bottom sheet, so every page is ≤2 taps away.
 */
export default function AdminTabBar() {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<string | null>(null);
  const current = activeGroup(pathname, groups);
  const currentItem = activeItem(pathname, groups);
  const openGroup = groups.find((g) => g.label === sheet);

  // Hide the bar while the keyboard is up (a text field has focus): on iPhone a fixed
  // bottom bar otherwise floats above the keyboard and covers what's being typed.
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (el: Element | null) =>
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el instanceof HTMLInputElement &&
        !["checkbox", "radio", "button", "submit", "file", "range", "color"].includes(el.type)) ||
      (el instanceof HTMLElement && el.isContentEditable);
    const update = () => setTyping(isField(document.activeElement));
    document.addEventListener("focusin", update);
    // focusout fires before focus lands on the next field; check once it has.
    const onOut = () => setTimeout(update, 0);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  useEffect(() => setSheet(null), [pathname]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  return (
    <div className="md:hidden">
      {/* Bottom sheet */}
      {openGroup && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSheet(null)}
            className="fixed inset-0 bg-black/20 z-40"
          />
          <div
            role="dialog"
            aria-label={openGroup.label}
            className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl border-t border-[#e8e5df] shadow-lg pb-[calc(3.5rem+max(env(safe-area-inset-bottom),0.5rem))]"
          >
            <p className="px-5 pt-4 pb-2 text-xs font-medium uppercase tracking-wider text-[#b8b0a4]">
              {openGroup.label}
            </p>
            <nav className="flex flex-col px-2">
              {openGroup.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheet(null)}
                  className={`text-base px-3 py-3 rounded-lg ${
                    currentItem?.href === item.href
                      ? "text-[#1a1a18] font-medium bg-[#f5f3ef]"
                      : "text-[#6b6560] active:bg-[#f5f3ef]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Tab bar */}
      <nav
        aria-label="Admin sections"
        hidden={typing}
        className="fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-[#e8e5df] pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
          {groups.map((group) => {
            const isActive = sheet ? sheet === group.label : current === group.label;
            // Full-cell targets with press feedback; the safe-area padding below keeps
            // them clear of the iPhone home-indicator swipe zone, which eats taps.
            const cls = `flex flex-col items-center justify-center gap-1 h-14 w-full text-[11px] select-none [-webkit-tap-highlight-color:transparent] active:bg-[#f5f3ef] transition-colors ${
              isActive ? "text-[#1a1a18] font-medium" : "text-[#8a837b]"
            }`;
            const inner = (
              <>
                <NavIconSvg icon={group.icon} />
                {group.label}
              </>
            );
            return (
              <li key={group.label}>
                {group.items.length === 1 ? (
                  <Link
                    href={group.items[0].href}
                    className={cls}
                    aria-current={current === group.label ? "page" : undefined}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSheet(sheet === group.label ? null : group.label)}
                    aria-expanded={sheet === group.label}
                    className={cls}
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
