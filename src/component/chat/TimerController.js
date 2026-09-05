    import { useEffect, useRef } from "react";

/**
 * TimerController component
 * Handles countdown timer and chat end logic, but does NOT fetch any API or cause re-renders in parent.
 * Props:
 * - initialTime: number (seconds)
 * - onTimeEnd: function (called when timer hits 0)
 * - onTick: function (called every second with new timeLeft)
 */
const TimerController = ({ initialTime, onTimeEnd, onTick }) => {
  const timerRef = useRef();
  const timeLeftRef = useRef(initialTime);

  useEffect(() => {
    timeLeftRef.current = initialTime;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (timeLeftRef.current > 0) {
        timeLeftRef.current -= 1;
        if (onTick) onTick(timeLeftRef.current);
      } else {
        clearInterval(timerRef.current);
        if (onTimeEnd) onTimeEnd();
      }
    }, 1000 * 60); // Decrement every minute
    return () => clearInterval(timerRef.current);
  }, [initialTime, onTimeEnd, onTick]);

  return null; // This component does not render anything
};

export default TimerController;