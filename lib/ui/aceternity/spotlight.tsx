"use client";
import { useRef, useState } from "react";

export function Spotlight() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(13,148,136,0.08), transparent 40%)`,
        }}
      />
    </div>
  );
}
