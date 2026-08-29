import React, { useState, useEffect, useRef } from 'react';

/**
 * Smoothly interpolates numeric values for KPI counters with requestAnimationFrame
 */
export default function AnimatedNumber({
  value,
  duration = 750,
  formatter = (v) => v.toLocaleString('en-IN')
}) {
  const [displayValue, setDisplayValue] = useState(value || 0);
  const prevValueRef = useRef(value || 0);

  useEffect(() => {
    const startVal = Number(prevValueRef.current) || 0;
    const endVal = Number(value) || 0;
    prevValueRef.current = endVal;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
}
