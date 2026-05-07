"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";

const STAGE_COUNT = 3;
const CYCLE_MS = 4400;
const SIZE = 220;

const TAROT_IMAGES = [
  "/images/The_fool.JPG",
  "/images/The_star.jpg",
  "/images/The_empress.JPG",
  "/images/The_sun.JPG",
  "/images/The_wheel_of_fortune.JPG",
];

type StageProps = { active: boolean };

export default function Loupe() {
  const [stage, setStage] = useState(0);
  const { lang } = useLang();
  const intervalRef = useRef<number | null>(null);

  const startCycle = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setStage((s) => (s + 1) % STAGE_COUNT);
    }, CYCLE_MS);
  };

  useEffect(() => {
    startCycle();
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const handleSelect = (i: number) => {
    setStage(i);
    startCycle();
  };

  const labelEn = ["I · The Deck", "II · The Map", "III · The Wheel"][stage];
  const labelEs = ["I · La Baraja", "II · El Mapa", "III · La Rueda"][stage];

  return (
    <div
      className="relative ml-auto mr-2 mb-9"
      style={{ width: SIZE, height: SIZE }}
    >
      {/* caption */}
      <div
        className="absolute left-0 right-0 flex justify-between items-baseline font-dm-mono uppercase"
        style={{
          top: -22,
          fontSize: 9,
          letterSpacing: "0.22em",
          color: "var(--ed-text-mute)",
        }}
      >
        <span>
          {lang === "en" ? "Fig. 01 · Live" : "Fig. 01 · En Vivo"}
        </span>
        <span style={{ color: "var(--ed-rust)", transition: "all .4s ease" }}>
          {lang === "en" ? labelEn : labelEs}
        </span>
      </div>

      {/* brass bezel */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #d9b78a 0%, #a8865a 40%, #6b4f33 75%, #3a2a1c 100%)",
          boxShadow:
            "0 24px 48px -16px rgba(58,42,28,.5), inset 0 0 0 2px rgba(255,255,255,.15)",
          padding: 10,
        }}
      >
        {/* dark inner barrel */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 10,
            background: "#2a1f15",
            boxShadow:
              "inset 0 4px 16px rgba(0,0,0,.6), inset 0 0 0 1px rgba(217,183,138,.4)",
          }}
        />
        {/* lens */}
        <div
          className="absolute overflow-hidden rounded-full"
          style={{
            inset: 16,
            background: "#f5ede2",
            boxShadow: "inset 0 0 30px rgba(58,42,28,.25)",
          }}
        >
          <DeckStage active={stage === 0} />
          <MapStage active={stage === 1} />
          <WheelStage active={stage === 2} />

          {/* glass highlight */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 35% at 30% 22%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 70%)",
              zIndex: 5,
            }}
          />
          {/* etched crosshair */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.3, zIndex: 4 }}
          >
            <line x1="50" y1="6" x2="50" y2="14" stroke="#3a2a1c" strokeWidth=".4" />
            <line x1="50" y1="86" x2="50" y2="94" stroke="#3a2a1c" strokeWidth=".4" />
            <line x1="6" y1="50" x2="14" y2="50" stroke="#3a2a1c" strokeWidth=".4" />
            <line x1="86" y1="50" x2="94" y2="50" stroke="#3a2a1c" strokeWidth=".4" />
            <circle
              cx="50"
              cy="50"
              r="2"
              fill="none"
              stroke="#3a2a1c"
              strokeWidth=".25"
            />
          </svg>
        </div>
      </div>

      {/* loupe handle */}
      <div
        className="absolute"
        style={{
          bottom: "-6%",
          right: "-12%",
          width: "30%",
          height: 14,
          borderRadius: 7,
          background:
            "linear-gradient(180deg, #d9b78a 0%, #8b6a44 50%, #4a3622 100%)",
          transform: "rotate(35deg)",
          transformOrigin: "left center",
          boxShadow: "0 8px 16px -6px rgba(58,42,28,.45)",
          zIndex: -1,
        }}
      />

      {/* indicators */}
      <div
        className="absolute left-0 right-0 flex justify-center gap-2"
        style={{ bottom: -22 }}
      >
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            aria-label={`Stage ${i + 1}`}
            className="border-0 p-0 cursor-pointer"
            style={{
              width: i === stage ? 22 : 6,
              height: 2,
              background: i === stage ? "var(--ed-rust)" : "#c4b8a8",
              transition: "all .4s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- I · Deck — real tarot images drifting side-to-side ---------- */
function DeckStage({ active }: StageProps) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity: active ? 1 : 0, transition: "opacity .8s ease" }}
    >
      {TAROT_IMAGES.map((src, i) => {
        const phase = i * 0.7;
        const sway = Math.sin(t * 1.1 + phase) * 12;
        const tilt = Math.sin(t * 1.1 + phase) * 5;
        const offset = (i - 2) * 18;
        const z = 5 - Math.abs(i - 2);
        return (
          <div
            key={i}
            className="absolute overflow-hidden"
            style={{
              width: "32%",
              aspectRatio: "5 / 8",
              border: "1px solid var(--ed-rust)",
              borderRadius: 4,
              transform: `translateX(${offset + sway}px) rotate(${
                (i - 2) * 4 + tilt
              }deg)`,
              boxShadow: "0 8px 14px -4px rgba(58,42,28,.5)",
              zIndex: z,
              background: "#f5ede2",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "sepia(.15) contrast(1.05)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- II · Map — astrocartography ---------- */
function MapStage({ active }: StageProps) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const rot = t * 3;
  const zoom = 1.55 + Math.sin(t * 0.45) * 0.06;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ opacity: active ? 1 : 0, transition: "opacity .8s ease" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/astrocartography.png"
        alt="Astrocartography"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 50%",
          transform: `rotate(${rot}deg) scale(${zoom})`,
          transformOrigin: "center",
          transition: "transform .1s linear",
        }}
      />
    </div>
  );
}

/* ---------- III · Wheel — natal chart ---------- */
function WheelStage({ active }: StageProps) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const rot = t * 5;
  const zoom = 1.45 + Math.sin(t * 0.5) * 0.05;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ opacity: active ? 1 : 0, transition: "opacity .8s ease" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/natal_chart.png"
        alt="Natal chart"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 50%",
          transform: `rotate(${rot}deg) scale(${zoom})`,
          transformOrigin: "center",
          transition: "transform .1s linear",
        }}
      />
    </div>
  );
}
