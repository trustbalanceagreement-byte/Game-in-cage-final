import React, { useState, useEffect, useRef } from 'react';

interface AnalogClockPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSet: (hour: string, minute: string, second: string, ampm: string) => void;
  onKeyboardToggle: () => void;
  currentHour: string;
  currentMinute: string;
  currentSecond: string;
  currentAmpm: string;
}

export default function AnalogClockPicker({
  isOpen,
  onClose,
  onSet,
  onKeyboardToggle,
  currentHour,
  currentMinute,
  currentSecond,
  currentAmpm,
}: AnalogClockPickerProps) {
  const [tempHour, setTempHour] = useState(currentHour || '12');
  const [tempMinute, setTempMinute] = useState(currentMinute || '00');
  const [tempSecond, setTempSecond] = useState(currentSecond || '00');
  const [tempAmpm, setTempAmpm] = useState(currentAmpm || 'PM');
  const [pickingMode, setPickingMode] = useState<'hours' | 'minutes' | 'seconds'>('hours');
  
  const dialContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Synchronize temp state when open
  useEffect(() => {
    if (isOpen) {
      setTempHour(currentHour || '12');
      setTempMinute(currentMinute || '00');
      setTempSecond(currentSecond || '00');
      setTempAmpm(currentAmpm || 'PM');
      setPickingMode('hours');
    }
  }, [isOpen, currentHour, currentMinute, currentSecond, currentAmpm]);

  // Decide dial numbers depending on pickingMode
  const getDialNumbers = () => {
    if (pickingMode === 'hours') {
      return ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    } else {
      // Minutes / Seconds
      return ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
    }
  };

  const numbers = getDialNumbers();

  // Helper to place numbers absolutely on the circular dial path
  const getNumberStyle = (index: number, total: number) => {
    // index 0 is at top (12 o'clock, which is -Math.PI / 2)
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 38; // percentage radius of parent container
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  // Convert current selected value to rotation angle (degrees)
  const getHandAngle = () => {
    if (pickingMode === 'hours') {
      const h = parseInt(tempHour) % 12;
      return h * 30; // 360 / 12 = 30 deg per hour
    } else if (pickingMode === 'minutes') {
      const m = parseInt(tempMinute);
      return m * 6; // 360 / 60 = 6 deg per minute
    } else {
      const s = parseInt(tempSecond);
      return s * 6; // 360 / 60 = 6 deg per second
    }
  };

  const handAngle = getHandAngle();

  const handleDialClickOrDrag = (clientX: number, clientY: number) => {
    if (!dialContainerRef.current) return;
    const rect = dialContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angleRad = Math.atan2(clientY - centerY, clientX - centerX);
    let angleDeg = angleRad * (180 / Math.PI) + 90; // offset so 12 o'clock is 0
    if (angleDeg < 0) angleDeg += 360;

    if (pickingMode === 'hours') {
      // 30 deg per hour chunk
      let h = Math.round(angleDeg / 30);
      if (h === 0 || h === 12) h = 12;
      setTempHour(String(h).padStart(2, '0'));
    } else if (pickingMode === 'minutes') {
      // 6 deg per minute chunk
      let m = Math.round(angleDeg / 6);
      if (m === 60) m = 0;
      setTempMinute(String(m).padStart(2, '0'));
    } else {
      // Seconds mode
      let s = Math.round(angleDeg / 6);
      if (s === 60) s = 0;
      setTempSecond(String(s).padStart(2, '0'));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleDialClickOrDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches.length > 0) {
      handleDialClickOrDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Drag listeners
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleDialClickOrDrag(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (e.touches.length > 0) {
        handleDialClickOrDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleGlobalRelease = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalRelease);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, [pickingMode]);

  const handleClear = () => {
    setTempHour('12');
    setTempMinute('00');
    setTempSecond('00');
    setTempAmpm('PM');
    setPickingMode('hours');
  };

  const handleSet = () => {
    onSet(tempHour, tempMinute, tempSecond, tempAmpm);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#2c2626] rounded-3xl w-full max-w-[320px] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
        
        {/* Dynamic Display Header */}
        <div className="bg-[#3f3434] p-6 flex flex-col justify-between select-none border-b border-black/20">
          <span className="text-[10px] text-rose-300/60 font-mono uppercase tracking-widest font-semibold mb-2 block text-center">
            {pickingMode === 'hours' ? 'Select Hour' : pickingMode === 'minutes' ? 'Select Minute' : 'Select Second'}
          </span>
          <div className="flex items-baseline justify-center gap-1.5 text-5xl font-sans text-rose-100/40">
            {/* Hour Segment */}
            <button
              type="button"
              onClick={() => setPickingMode('hours')}
              className={`font-sans font-light hover:text-rose-200 transition-all focus:outline-none cursor-pointer ${
                pickingMode === 'hours' ? 'text-[#fca5a5] font-normal scale-105' : ''
              }`}
            >
              {tempHour}
            </button>
            <span className="text-rose-300/30 font-light select-none">:</span>

            {/* Minute Segment */}
            <button
              type="button"
              onClick={() => setPickingMode('minutes')}
              className={`font-sans font-light hover:text-rose-200 transition-all focus:outline-none cursor-pointer ${
                pickingMode === 'minutes' ? 'text-[#fca5a5] font-normal scale-105' : ''
              }`}
            >
              {tempMinute}
            </button>
            <span className="text-rose-300/30 font-light select-none text-2xl">:</span>

            {/* Second Segment */}
            <button
              type="button"
              onClick={() => setPickingMode('seconds')}
              className={`text-2xl font-sans font-light hover:text-rose-200 transition-all focus:outline-none cursor-pointer ${
                pickingMode === 'seconds' ? 'text-[#fca5a5] font-normal scale-105' : ''
              }`}
            >
              {tempSecond}
            </button>

            {/* AM / PM Stack */}
            <div className="flex flex-col ml-4 text-xs font-mono tracking-wider text-rose-100/30 gap-1 select-none">
              <button
                type="button"
                onClick={() => setTempAmpm('AM')}
                className={`hover:text-[#fca5a5] transition-colors focus:outline-none cursor-pointer font-bold ${
                  tempAmpm === 'AM' ? 'text-[#fca5a5]' : ''
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setTempAmpm('PM')}
                className={`hover:text-[#fca5a5] transition-colors focus:outline-none cursor-pointer font-bold ${
                  tempAmpm === 'PM' ? 'text-[#fca5a5]' : ''
                }`}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Circular Dial Area */}
        <div className="bg-[#2c2626] p-6 flex flex-col items-center justify-center relative select-none">
          <div
            ref={dialContainerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative w-64 h-64 rounded-full bg-[#3d3333] border border-white/5 shadow-inner cursor-pointer"
          >
            {/* Center dot */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#fca5a5] z-20 pointer-events-none" />

            {/* Selecting Hand overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${handAngle}deg)` }}
            >
              {/* Hand stem */}
              <div className="absolute left-1/2 top-[15%] bottom-1/2 w-[2px] bg-[#fca5a5] -translate-x-1/2 origin-bottom pointer-events-none" />
              {/* Selection dial ball */}
              <div className="absolute left-1/2 top-[15%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fca5a5] pointer-events-none shadow" />
            </div>

            {/* Interactive numbers inside track */}
            {numbers.map((num, idx) => {
              const parsedVal = parseInt(num);
              const isSelected =
                pickingMode === 'hours'
                  ? parseInt(tempHour) === parsedVal
                  : pickingMode === 'minutes'
                  ? parseInt(tempMinute) === parsedVal
                  : parseInt(tempSecond) === parsedVal;

              return (
                <div
                  key={idx}
                  style={getNumberStyle(idx, 12)}
                  className={`absolute select-none pointer-events-none text-xs font-mono font-medium rounded-full w-8 h-8 flex items-center justify-center transition-all ${
                    isSelected ? 'text-[#2c2626] font-bold z-10 scale-110' : 'text-rose-100/70'
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Control Links */}
        <div className="flex items-center justify-between px-6 pb-6 bg-[#2c2626] border-t border-white/5 pt-4">
          {/* Keyboard Toggle Icon */}
          <button
            type="button"
            onClick={() => {
              onKeyboardToggle();
              onClose();
            }}
            className="p-2 text-rose-200/40 hover:text-[#fca5a5] transition-colors bg-transparent border-0 cursor-pointer"
            title="Switch to dropdown entry"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M9 13h1M12 13h1M15 13h1M9 9h1M12 9h1M15 9h1M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
          </button>

          {/* Action Row */}
          <div className="flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-rose-100 transition-colors bg-transparent border-0 cursor-pointer py-1.5 px-2"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-rose-100 transition-colors bg-transparent border-0 cursor-pointer py-1.5 px-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSet}
              className="bg-rose-400/10 border border-rose-400/20 hover:bg-rose-400 hover:text-black transition-all px-3 py-1.5 rounded-lg cursor-pointer text-rose-300"
            >
              Set
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
