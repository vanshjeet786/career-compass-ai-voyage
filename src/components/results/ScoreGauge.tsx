import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  value: number;
  max: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { width: 100, height: 60, strokeWidth: 8, fontSize: 18, labelSize: 10 },
  md: { width: 160, height: 95, strokeWidth: 10, fontSize: 28, labelSize: 12 },
  lg: { width: 220, height: 130, strokeWidth: 14, fontSize: 38, labelSize: 14 },
};

function getGaugeColor(ratio: number): string {
  if (ratio >= 0.8) return "hsl(142, 71%, 45%)";
  if (ratio >= 0.6) return "hsl(38, 92%, 50%)";
  if (ratio >= 0.4) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

const ScoreGauge = ({ value, max, label, size = "md" }: ScoreGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const cfg = SIZE_CONFIG[size];
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;

  useEffect(() => {
    let start: number | null = null;
    const duration = 1000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  const cx = cfg.width / 2;
  const cy = cfg.height - 4;
  const r = cx - cfg.strokeWidth;
  const circumference = Math.PI * r;
  const animatedRatio = max > 0 ? Math.min(animatedValue / max, 1) : 0;
  const offset = circumference * (1 - animatedRatio);

  return (
    <div className="flex flex-col items-center">
      <svg width={cfg.width} height={cfg.height} viewBox={`0 0 ${cfg.width} ${cfg.height}`}>
        {/* Background arc */}
        <path
          d={`M ${cfg.strokeWidth / 2} ${cy} A ${r} ${r} 0 0 1 ${cfg.width - cfg.strokeWidth / 2} ${cy}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${cfg.strokeWidth / 2} ${cy} A ${r} ${r} 0 0 1 ${cfg.width - cfg.strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={getGaugeColor(ratio)}
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
        {/* Value text */}
        <text
          x={cx}
          y={cy - cfg.fontSize * 0.3}
          textAnchor="middle"
          className="fill-foreground font-bold"
          fontSize={cfg.fontSize}
        >
          {animatedValue.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy - cfg.fontSize * 0.3 + cfg.labelSize + 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={cfg.labelSize}
        >
          out of {max}
        </text>
      </svg>
      {label && (
        <span className="text-xs text-muted-foreground mt-1 font-medium">{label}</span>
      )}
    </div>
  );
};

export default ScoreGauge;
