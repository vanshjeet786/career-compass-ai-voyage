import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

const AnimatedNumber = ({
  value,
  duration = 1000,
  decimals = 1,
  suffix = "",
  className = "",
}: AnimatedNumberProps) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toFixed(decimals)}{suffix}
    </span>
  );
};

export default AnimatedNumber;
