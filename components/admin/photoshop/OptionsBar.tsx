"use client";

import type { PsTool } from "./types";
import { ChevronDownIcon, ResetIcon } from "./PsIcons";

export default function OptionsBar({
  tool,
  brushSize,
  brushHardness,
  brushOpacity,
  brushFlow,
  shapeFill,
  fontSize,
  onChange,
}: {
  tool: PsTool;
  brushSize: number;
  brushHardness: number;
  brushOpacity: number;
  brushFlow: number;
  shapeFill: string;
  fontSize: number;
  onChange: (patch: Partial<{
    brushSize: number;
    brushHardness: number;
    brushOpacity: number;
    brushFlow: number;
    fontSize: number;
  }>) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2 border-b"
      style={{
        height: 34,
        background: "var(--ps-panel)",
        borderColor: "var(--ps-border)",
      }}
    >
      {/* Tool icon area */}
      <div
        className="flex items-center gap-1 pr-2 border-r h-full"
        style={{ borderColor: "var(--ps-border-soft)" }}
      >
        <div
          className="w-7 h-7 rounded-sm flex items-center justify-center"
          style={{
            background: "var(--ps-bg)",
            border: "1px solid var(--ps-border-soft)",
            textTransform: "capitalize",
            color: "var(--ps-text-bright)",
            fontSize: 10,
            fontWeight: 600,
          }}
          title={tool}
        >
          {tool[0].toUpperCase()}
        </div>
        <button className="ps-tool-btn" style={{ width: 18, height: 18 }} title="Reset tool">
          <ResetIcon />
        </button>
      </div>

      {/* Tool-specific controls */}
      {(tool === "brush" || tool === "eraser" || tool === "clone" || tool === "heal") && (
        <>
          <NumField
            label="Size"
            value={brushSize}
            onChange={(v) => onChange({ brushSize: v })}
            min={1}
            max={500}
            unit="px"
          />
          <PctField
            label="Hardness"
            value={brushHardness}
            onChange={(v) => onChange({ brushHardness: v })}
          />
          <PctField
            label="Opacity"
            value={brushOpacity}
            onChange={(v) => onChange({ brushOpacity: v })}
          />
          <PctField
            label="Flow"
            value={brushFlow}
            onChange={(v) => onChange({ brushFlow: v })}
          />
        </>
      )}
      {(tool === "rectangle" || tool === "ellipse") && (
        <>
          <FillSwatch label="Fill" color={shapeFill} />
          <FillSwatch label="Stroke" color="transparent" />
          <NumField
            label="W"
            value={0}
            onChange={() => {}}
            unit="px"
            disabled
          />
          <NumField
            label="H"
            value={0}
            onChange={() => {}}
            unit="px"
            disabled
          />
        </>
      )}
      {tool === "type" && (
        <>
          <SelectField
            label=""
            value="DM Sans"
            options={["DM Sans", "Playfair Display", "Inter", "SF Pro", "Helvetica"]}
            width={130}
          />
          <NumField
            label=""
            value={fontSize}
            onChange={(v) => onChange({ fontSize: v })}
            min={8}
            max={480}
            unit="pt"
            width={60}
          />
          <SelectField label="" value="Sharp" options={["Sharp", "Crisp", "Smooth"]} />
        </>
      )}
      {tool === "marquee" && (
        <>
          <SelectField label="" value="New" options={["New", "Add", "Subtract", "Intersect"]} />
          <NumField label="Feather" value={0} onChange={() => {}} unit="px" />
          <SelectField label="Style" value="Normal" options={["Normal", "Fixed Ratio", "Fixed Size"]} />
        </>
      )}
      {tool === "wand" && (
        <>
          <NumField label="Tolerance" value={32} onChange={() => {}} />
          <ToggleField label="Anti-alias" on />
          <ToggleField label="Contiguous" on />
          <ToggleField label="Sample All Layers" />
        </>
      )}
      {tool === "crop" && (
        <>
          <SelectField label="" value="Ratio" options={["Ratio", "W × H × Resolution", "Original Ratio"]} />
          <NumField label="" value={0} onChange={() => {}} width={48} />
          <NumField label="" value={0} onChange={() => {}} width={48} />
          <button className="ps-btn">Straighten</button>
        </>
      )}
      {(tool === "move" || tool === "lasso") && (
        <>
          <ToggleField label="Auto-Select" />
          <ToggleField label="Show Transform Controls" on />
          <SelectField label="" value="Layer" options={["Layer", "Group"]} />
        </>
      )}
      {tool === "eyedropper" && (
        <>
          <SelectField label="Sample Size" value="Point Sample" options={["Point Sample", "3 × 3 Avg", "5 × 5 Avg"]} width={130} />
          <SelectField label="Sample" value="All Layers" options={["All Layers", "Current Layer"]} width={130} />
        </>
      )}
      {(tool === "hand" || tool === "zoom") && (
        <>
          <button className="ps-btn">Fit Screen</button>
          <button className="ps-btn">100%</button>
          <button className="ps-btn">Actual Pixels</button>
        </>
      )}

      <div className="flex-1" />
      <button
        className="ps-tool-btn"
        title="Toggle Brushes panel"
        style={{ width: 22, height: 22, fontSize: 10 }}
      >
        {"☰"}
      </button>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  unit,
  width,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  width?: number;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5">
      {label && <span style={{ color: "var(--ps-text-dim)" }}>{label}</span>}
      <div
        className="flex items-center"
        style={{
          background: "var(--ps-bg)",
          border: "1px solid var(--ps-border-soft)",
          borderRadius: 2,
          height: 22,
          paddingLeft: 6,
          paddingRight: 4,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="bg-transparent outline-none"
          style={{
            color: "var(--ps-text)",
            width: width ?? 50,
            fontSize: 11,
          }}
        />
        {unit && (
          <span style={{ color: "var(--ps-text-dim)", fontSize: 10 }}>
            {unit}
          </span>
        )}
        <span style={{ color: "var(--ps-text-dim)", marginLeft: 2 }}>
          <ChevronDownIcon />
        </span>
      </div>
    </label>
  );
}

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return <NumField label={label} value={value} onChange={onChange} unit="%" min={0} max={100} width={36} />;
}

function SelectField({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  options: string[];
  width?: number;
}) {
  return (
    <label className="flex items-center gap-1.5">
      {label && <span style={{ color: "var(--ps-text-dim)" }}>{label}</span>}
      <div
        className="flex items-center justify-between"
        style={{
          background: "var(--ps-bg)",
          border: "1px solid var(--ps-border-soft)",
          borderRadius: 2,
          height: 22,
          padding: "0 6px",
          width: width ?? 100,
          color: "var(--ps-text)",
        }}
      >
        <span>{value}</span>
        <span style={{ color: "var(--ps-text-dim)" }}>
          <ChevronDownIcon />
        </span>
      </div>
    </label>
  );
}

function ToggleField({ label, on }: { label: string; on?: boolean }) {
  return (
    <label className="flex items-center gap-1.5">
      <span
        className="inline-block w-3.5 h-3.5 rounded-sm flex items-center justify-center"
        style={{
          background: on ? "var(--ps-accent-blue)" : "var(--ps-bg)",
          border: "1px solid var(--ps-border-soft)",
          color: "white",
          fontSize: 9,
          lineHeight: 1,
        }}
      >
        {on ? "✓" : ""}
      </span>
      <span style={{ color: "var(--ps-text)" }}>{label}</span>
    </label>
  );
}

function FillSwatch({ label, color }: { label: string; color: string }) {
  const isTransparent = color === "transparent";
  return (
    <label className="flex items-center gap-1.5">
      <span style={{ color: "var(--ps-text-dim)" }}>{label}:</span>
      <div
        className="rounded-sm"
        style={{
          width: 28,
          height: 18,
          background: isTransparent
            ? "repeating-conic-gradient(#a0a0a0 0% 25%, #fff 0% 50%) 50% / 8px 8px"
            : color,
          border: "1px solid var(--ps-border-soft)",
        }}
      />
    </label>
  );
}
