// Compact 16×16 SVG icons matching Photoshop's tool aesthetic

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const MoveIcon = () => (
  <svg {...base}>
    <path d="M8 1 V15 M1 8 H15 M5 4 L8 1 L11 4 M5 12 L8 15 L11 12 M4 5 L1 8 L4 11 M12 5 L15 8 L12 11" />
  </svg>
);

export const MarqueeIcon = () => (
  <svg {...base}>
    <path d="M2 2 H4 M6 2 H8 M10 2 H12 M14 2 V4 M14 6 V8 M14 10 V12 M14 14 H12 M10 14 H8 M6 14 H4 M2 14 V12 M2 10 V8 M2 6 V4" />
  </svg>
);

export const LassoIcon = () => (
  <svg {...base}>
    <path d="M3 5 Q3 2 7 2 Q12 2 13 5 Q14 9 11 11 L7 12 L8 14 L6 13" />
  </svg>
);

export const WandIcon = () => (
  <svg {...base}>
    <path d="M11 2 L14 5 L6 13 L3 10 Z" />
    <path d="M2 3 L4 5 M12 12 L14 14 M2 13 L4 11" />
  </svg>
);

export const CropIcon = () => (
  <svg {...base}>
    <path d="M4 2 V12 H14 M2 4 H12 V14" />
  </svg>
);

export const EyedropperIcon = () => (
  <svg {...base}>
    <path d="M9 3 L13 7 L7 13 L3 13 L3 9 Z" />
    <path d="M10 2 L14 6" strokeWidth="2" />
  </svg>
);

export const HealIcon = () => (
  <svg {...base}>
    <path d="M5 5 L11 11 M11 5 L5 11" />
    <circle cx="8" cy="8" r="6" />
  </svg>
);

export const BrushIcon = () => (
  <svg {...base}>
    <path d="M3 13 Q5 11 6 11 L11 6 L10 5 L5 10 Q5 11 3 13 Z" fill="currentColor" stroke="none" />
    <path d="M11 5 L14 2" />
  </svg>
);

export const CloneIcon = () => (
  <svg {...base}>
    <rect x="6" y="2" width="6" height="3" />
    <path d="M5 5 L13 5 L12 13 L6 13 Z" />
  </svg>
);

export const EraserIcon = () => (
  <svg {...base}>
    <path d="M3 11 L8 6 L13 11 L11 13 L5 13 Z" />
    <path d="M9 5 L13 9" />
  </svg>
);

export const BucketIcon = () => (
  <svg {...base}>
    <path d="M3 5 L8 1 L13 6 L9 14 L4 13 Z" />
    <circle cx="13" cy="11" r="1.5" fill="currentColor" />
  </svg>
);

export const BlurIcon = () => (
  <svg {...base}>
    <path d="M8 2 Q3 7 3 10 Q3 13 8 13 Q13 13 13 10 Q13 7 8 2 Z" />
  </svg>
);

export const DodgeIcon = () => (
  <svg {...base}>
    <circle cx="6" cy="9" r="3" />
    <path d="M9 6 L13 2 M9 6 L11 4" />
  </svg>
);

export const PenIcon = () => (
  <svg {...base}>
    <path d="M2 14 L4 11 L11 4 L13 6 L6 13 L4 13 Z" />
  </svg>
);

export const TypeIcon = () => (
  <svg {...base}>
    <path d="M3 3 L13 3 M8 3 L8 13 M5 13 L11 13" />
  </svg>
);

export const RectangleIcon = () => (
  <svg {...base}>
    <rect x="3" y="4" width="10" height="8" />
  </svg>
);

export const EllipseIcon = () => (
  <svg {...base}>
    <ellipse cx="8" cy="8" rx="5.5" ry="4" />
  </svg>
);

export const HandIcon = () => (
  <svg {...base}>
    <path d="M5 13 L5 6 Q5 4 6.5 4 Q8 4 8 6 L8 8 Q8 4 9.5 4 Q11 4 11 6 L11 8 Q11 6 12.5 6 Q14 6 14 8 L14 11 Q14 14 11 14 Z" />
  </svg>
);

export const ZoomIcon = () => (
  <svg {...base}>
    <circle cx="7" cy="7" r="4" />
    <path d="M10 10 L14 14" />
    <path d="M5 7 L9 7" />
  </svg>
);

export const EyeIcon = ({ open }: { open: boolean }) => (
  <svg {...base} fill={open ? "currentColor" : "none"} stroke="currentColor">
    {open ? (
      <>
        <path d="M2 8 Q5 4 8 4 Q11 4 14 8 Q11 12 8 12 Q5 12 2 8 Z" fill="none" />
        <circle cx="8" cy="8" r="2" />
      </>
    ) : (
      <path d="M2 4 L14 12" />
    )}
  </svg>
);

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M8 3 L8 13 M3 8 L13 8" />
  </svg>
);

export const TrashIcon = () => (
  <svg {...base}>
    <path d="M3 4 L13 4 M5 4 L5 2 L11 2 L11 4 M5 4 L6 13 L10 13 L11 4" />
  </svg>
);

export const FolderIcon = () => (
  <svg {...base}>
    <path d="M2 5 L7 5 L8 6 L14 6 L14 13 L2 13 Z" />
  </svg>
);

export const LockIcon = ({ locked }: { locked?: boolean }) => (
  <svg {...base}>
    <rect x="4" y="7" width="8" height="6" />
    {locked ? (
      <path d="M6 7 L6 5 Q6 3 8 3 Q10 3 10 5 L10 7" />
    ) : (
      <path d="M6 7 L6 5 Q6 3 8 3 Q10 3 10 5" />
    )}
  </svg>
);

export const SwapIcon = () => (
  <svg {...base}>
    <path d="M3 5 L11 5 L9 3 M13 11 L5 11 L7 13" />
  </svg>
);

export const ResetIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="5" height="5" />
    <rect x="8" y="8" width="5" height="5" />
  </svg>
);

export const ChevronDownIcon = () => (
  <svg {...base}>
    <path d="M3 6 L8 11 L13 6" />
  </svg>
);
