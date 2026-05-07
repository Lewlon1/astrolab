// Compact inline SVG icons in Premiere's style — 14×14 viewBox, 1.5px stroke

const base = {
  width: 14,
  height: 14,
  viewBox: "0 0 14 14",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SelectIcon = () => (
  <svg {...base}>
    <path d="M3 2 L3 11 L5.5 8.5 L7.5 12 L9 11 L7 7.5 L11 7.5 Z" fill="currentColor" stroke="none" />
  </svg>
);

export const TrackSelectIcon = () => (
  <svg {...base}>
    <path d="M2 4 L8 4 M2 7 L9 7 M2 10 L10 10" />
    <path d="M11 7 L13 7 M12 6 L13 7 L12 8" />
  </svg>
);

export const RippleIcon = () => (
  <svg {...base}>
    <rect x="2" y="4" width="3.5" height="6" />
    <rect x="8.5" y="4" width="3.5" height="6" />
    <path d="M6 7 L8 7 M6.5 5.5 L8 7 L6.5 8.5" />
  </svg>
);

export const RollingIcon = () => (
  <svg {...base}>
    <rect x="2" y="4" width="4" height="6" />
    <rect x="8" y="4" width="4" height="6" />
    <path d="M6 5 L6 9 M8 5 L8 9" />
  </svg>
);

export const RateIcon = () => (
  <svg {...base}>
    <path d="M2 11 L2 3 L7 7 Z" fill="currentColor" stroke="none" />
    <path d="M9 4 L9 10 M11 5 L11 9" />
  </svg>
);

export const RazorIcon = () => (
  <svg {...base}>
    <path d="M2 11 L8 5" />
    <circle cx="9.5" cy="3.5" r="1.5" />
    <path d="M3 9 L5 11" />
  </svg>
);

export const SlipIcon = () => (
  <svg {...base}>
    <rect x="2" y="4" width="10" height="6" />
    <path d="M5 7 L4 7 M4.5 6 L4 7 L4.5 8" />
    <path d="M9 7 L10 7 M9.5 6 L10 7 L9.5 8" />
  </svg>
);

export const SlideIcon = () => (
  <svg {...base}>
    <rect x="4" y="4" width="6" height="6" />
    <path d="M2 7 L3 7 M2.5 6 L2 7 L2.5 8" />
    <path d="M11 7 L12 7 M11.5 6 L12 7 L11.5 8" />
  </svg>
);

export const HandIcon = () => (
  <svg {...base}>
    <path d="M5 11 L5 5 Q5 4 6 4 Q7 4 7 5 L7 7 Q7 4 8 4 Q9 4 9 5 L9 7 Q9 5 10 5 Q11 5 11 6 L11 9 Q11 11 9 11 Z" />
  </svg>
);

export const ZoomIcon = () => (
  <svg {...base}>
    <circle cx="6" cy="6" r="3.5" />
    <path d="M9 9 L12 12" />
    <path d="M5 6 L7 6 M6 5 L6 7" />
  </svg>
);

export const PenIcon = () => (
  <svg {...base}>
    <path d="M2 12 L4 10 L11 3 L13 5 L6 12 L4 12 Z" />
    <path d="M9 5 L11 7" />
  </svg>
);

export const TypeIcon = () => (
  <svg {...base}>
    <path d="M3 3 L11 3 M7 3 L7 12 M5 12 L9 12" />
  </svg>
);

export const PlayIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor">
    <path d="M3 2 L11 7 L3 12 Z" />
  </svg>
);

export const PauseIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor">
    <rect x="3" y="2.5" width="3" height="9" />
    <rect x="8" y="2.5" width="3" height="9" />
  </svg>
);

export const StepBackIcon = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <rect x="2.5" y="3" width="1.5" height="8" />
    <path d="M12 3 L5 7 L12 11 Z" />
  </svg>
);

export const StepForwardIcon = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M2 3 L9 7 L2 11 Z" />
    <rect x="10" y="3" width="1.5" height="8" />
  </svg>
);

export const MarkInIcon = () => (
  <svg {...base}>
    <path d="M3 2 L3 12 L7 7 Z" fill="currentColor" stroke="none" />
    <path d="M9 2 L9 12" strokeWidth="1.5" />
  </svg>
);

export const MarkOutIcon = () => (
  <svg {...base}>
    <path d="M5 2 L5 12" strokeWidth="1.5" />
    <path d="M11 2 L7 7 L11 12 Z" fill="currentColor" stroke="none" />
  </svg>
);

export const SpeakerIcon = ({ muted }: { muted?: boolean }) => (
  <svg {...base}>
    <path d="M2 5 L4 5 L7 3 L7 11 L4 9 L2 9 Z" fill="currentColor" stroke="none" />
    {muted ? (
      <path d="M9 5 L13 9 M13 5 L9 9" />
    ) : (
      <>
        <path d="M9.5 5.5 Q11 7 9.5 8.5" />
        <path d="M11 4 Q13 7 11 10" />
      </>
    )}
  </svg>
);

export const LockIcon = ({ locked }: { locked?: boolean }) => (
  <svg {...base}>
    <rect x="3" y="6.5" width="8" height="5.5" />
    {locked ? (
      <path d="M5 6.5 L5 4 Q5 2.5 7 2.5 Q9 2.5 9 4 L9 6.5" />
    ) : (
      <path d="M5 6.5 L5 4 Q5 2.5 7 2.5 Q9 2.5 9 4" />
    )}
  </svg>
);

export const ImportIcon = () => (
  <svg {...base}>
    <path d="M7 2 L7 9 M4 6 L7 9 L10 6" />
    <path d="M2 12 L12 12" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="6" cy="6" r="3.5" />
    <path d="M9 9 L12 12" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg {...base}>
    <path d="M5 3 L9 7 L5 11" />
  </svg>
);

export const ChevronDownIcon = () => (
  <svg {...base}>
    <path d="M3 5 L7 9 L11 5" />
  </svg>
);

export const VideoIcon = () => (
  <svg {...base}>
    <rect x="2" y="4" width="7" height="6" />
    <path d="M9 6.5 L12 5 L12 9 L9 7.5 Z" fill="currentColor" />
  </svg>
);

export const AudioIcon = () => (
  <svg {...base}>
    <path d="M3 5 L3 9 M5 4 L5 10 M7 3 L7 11 M9 5 L9 9 M11 6 L11 8" />
  </svg>
);

export const ExportIcon = () => (
  <svg {...base}>
    <path d="M7 9 L7 2 M4 5 L7 2 L10 5" />
    <path d="M2 12 L12 12" />
  </svg>
);
