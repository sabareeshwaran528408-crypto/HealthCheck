import React, { useEffect, useState } from 'react';
import AnimatedNumber from './AnimatedNumber';

export default function ProgressRing({ percentage = 50, size = 150, strokeWidth = 14 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--hc-primary)" />
            <stop offset="100%" stopColor="var(--hc-accent)" />
          </linearGradient>
        </defs>
        
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--hc-surface-muted)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />

        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring-arc"
          style={{
            strokeDashoffset: isReady ? strokeDashoffset : circumference,
            transition: 'stroke-dashoffset 850ms cubic-bezier(0.2, 0.7, 0.2, 1)',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold tracking-tight text-[var(--hc-ink)] font-manrope">
          <AnimatedNumber value={percentage} suffix="%" />
        </span>
        <span className="text-xs font-semibold text-[var(--hc-muted)] tracking-wide uppercase mt-0.5">
          Complete
        </span>
      </div>
    </div>
  );
}
