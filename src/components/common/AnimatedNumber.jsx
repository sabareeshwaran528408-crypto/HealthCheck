import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value, suffix = '', duration = 650 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValue = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const startValue = currentValue.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      const frameId = window.requestAnimationFrame(() => {
        currentValue.current = target;
        setDisplayValue(target);
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    let frameId;
    let startTime;
    const animate = (time) => {
      if (startTime === undefined) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(startValue + (target - startValue) * eased);
      currentValue.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, value]);

  return <>{displayValue}{suffix}</>;
}
