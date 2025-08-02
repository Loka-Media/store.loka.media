"use client";

export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(251, 146, 60, 0.1) 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>
    </div>
  );
}
