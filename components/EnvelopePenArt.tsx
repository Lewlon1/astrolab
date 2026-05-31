"use client";

import { useId } from "react";

type Props = {
  width?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Loose, abstract gouache-style illustration: an open envelope with a pink
 * liner beside a mustard fountain pen. Edges are wavered with a turbulence
 * displacement so it reads hand-painted rather than vector-perfect.
 */
export default function EnvelopePenArt({ width = 170, className, style }: Props) {
  const uid = useId().replace(/:/g, "");
  const paint = `paint-${uid}`;

  // earthy gouache palette
  const edge = "#3A2E22";
  const sageBody = "#7C8A63";
  const sageFlap = "#95A17B";
  const rose = "#C77F7C";
  const ochre = "#D2A35C";

  return (
    <svg
      width={width}
      height={(width * 150) / 230}
      viewBox="0 0 230 150"
      fill="none"
      className={className}
      style={{ overflow: "visible", display: "block", ...style }}
      aria-hidden="true"
    >
      <defs>
        <filter id={paint} x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves={2}
            seed={4}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={3.6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g filter={`url(#${paint})`}>
        {/* fountain pen — lower left, tilted */}
        <g transform="translate(2 86) rotate(-24)">
          <rect
            x="0"
            y="0"
            width="100"
            height="16"
            rx="8"
            fill={ochre}
            stroke={edge}
            strokeWidth="1.6"
          />
          {/* cap */}
          <rect
            x="-2"
            y="-1"
            width="30"
            height="18"
            rx="8"
            fill={sageFlap}
            stroke={edge}
            strokeWidth="1.6"
          />
          {/* trim ring */}
          <rect x="29" y="0" width="4" height="16" fill="rgba(58,46,34,.55)" />
          {/* nib */}
          <path
            d="M100 2 L100 14 L122 8 Z"
            fill={rose}
            stroke={edge}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <line x1="105" y1="8" x2="118" y2="8" stroke={edge} strokeWidth="1" />
        </g>

        {/* open envelope — right */}
        <g transform="translate(94 20)">
          {/* flap, folded open behind */}
          <path
            d="M3 45 L113 45 L58 -3 Z"
            fill={sageFlap}
            stroke={edge}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* body */}
          <rect
            x="0"
            y="41"
            width="116"
            height="74"
            rx="11"
            fill={sageBody}
            stroke={edge}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* pink liner showing inside the mouth */}
          <path
            d="M14 43 L102 43 L58 93 Z"
            fill={rose}
            stroke={edge}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
