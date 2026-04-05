"use client";

export function GlobeAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
      <svg
        width="750"
        height="750"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-[0.12]"
      >
        <style>{`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes travel {
            0% { offset-distance: 0%; opacity: 0; }
            5% { opacity: 0.8; }
            50% { opacity: 1; }
            95% { opacity: 0.8; }
            100% { offset-distance: 100%; opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { r: 2.5; opacity: 0.4; }
            50% { r: 4; opacity: 0.7; }
          }
          @keyframes glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          .globe-grid {
            animation: rotate 200s linear infinite;
            transform-origin: 350px 350px;
          }
          .dot-t1 { offset-path: path("M180 280 Q280 150 420 230"); animation: travel 6s ease-in-out infinite; }
          .dot-t2 { offset-path: path("M520 300 Q400 180 250 310"); animation: travel 7s ease-in-out infinite 1.2s; }
          .dot-t3 { offset-path: path("M300 450 Q350 300 480 250"); animation: travel 5s ease-in-out infinite 2.4s; }
          .dot-t4 { offset-path: path("M450 420 Q380 350 280 280"); animation: travel 6.5s ease-in-out infinite 0.8s; }
          .dot-t5 { offset-path: path("M200 350 Q320 250 500 340"); animation: travel 8s ease-in-out infinite 3.6s; }
          .dot-t6 { offset-path: path("M380 200 Q300 320 350 460"); animation: travel 7.5s ease-in-out infinite 1.8s; }
          .dot-t7 { offset-path: path("M550 380 Q450 280 300 320"); animation: travel 5.5s ease-in-out infinite 3s; }
          .dot-t8 { offset-path: path("M250 400 Q350 300 500 280"); animation: travel 6s ease-in-out infinite 4.5s; }
          .dot-t9 { offset-path: path("M320 200 Q420 300 460 450"); animation: travel 7s ease-in-out infinite 2s; }
          .dot-t10 { offset-path: path("M480 350 Q380 250 220 340"); animation: travel 5.5s ease-in-out infinite 5s; }
          .city { animation: pulse 4s ease-in-out infinite; }
          .arc-glow { animation: glow 6s ease-in-out infinite; }
        `}</style>

        {/* Rotating globe grid */}
        <g className="globe-grid">
          <circle cx="350" cy="350" r="250" stroke="#009854" strokeWidth="0.8" />
          <ellipse cx="350" cy="350" rx="250" ry="70" stroke="#009854" strokeWidth="0.4" />
          <ellipse cx="350" cy="350" rx="250" ry="140" stroke="#009854" strokeWidth="0.4" />
          <ellipse cx="350" cy="350" rx="250" ry="210" stroke="#009854" strokeWidth="0.4" />
          <ellipse cx="350" cy="350" rx="70" ry="250" stroke="#009854" strokeWidth="0.4" />
          <ellipse cx="350" cy="350" rx="140" ry="250" stroke="#009854" strokeWidth="0.4" />
          <ellipse cx="350" cy="350" rx="210" ry="250" stroke="#009854" strokeWidth="0.4" />
          <ellipse cx="350" cy="350" rx="180" ry="250" stroke="#009854" strokeWidth="0.3" transform="rotate(25 350 350)" />
          <ellipse cx="350" cy="350" rx="180" ry="250" stroke="#009854" strokeWidth="0.3" transform="rotate(-25 350 350)" />
          <ellipse cx="350" cy="350" rx="120" ry="250" stroke="#009854" strokeWidth="0.3" transform="rotate(50 350 350)" />
          <ellipse cx="350" cy="350" rx="120" ry="250" stroke="#009854" strokeWidth="0.3" transform="rotate(-50 350 350)" />
        </g>

        {/* Transfer arcs */}
        <path className="arc-glow" d="M180 280 Q280 150 420 230" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" />
        <path className="arc-glow" d="M520 300 Q400 180 250 310" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "1s" }} />
        <path className="arc-glow" d="M300 450 Q350 300 480 250" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "2s" }} />
        <path className="arc-glow" d="M450 420 Q380 350 280 280" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "3s" }} />
        <path className="arc-glow" d="M200 350 Q320 250 500 340" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "1.5s" }} />
        <path className="arc-glow" d="M380 200 Q300 320 350 460" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "2.5s" }} />
        <path className="arc-glow" d="M550 380 Q450 280 300 320" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "0.5s" }} />
        <path className="arc-glow" d="M250 400 Q350 300 500 280" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "3.5s" }} />
        <path className="arc-glow" d="M320 200 Q420 300 460 450" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "4s" }} />
        <path className="arc-glow" d="M480 350 Q380 250 220 340" stroke="#009854" strokeWidth="0.8" strokeDasharray="4 6" fill="none" style={{ animationDelay: "4.5s" }} />

        {/* Traveling dots */}
        <circle className="dot-t1" r="3" fill="#00e581" />
        <circle className="dot-t2" r="3" fill="#00e581" />
        <circle className="dot-t3" r="2.5" fill="#009854" />
        <circle className="dot-t4" r="2.5" fill="#009854" />
        <circle className="dot-t5" r="3" fill="#00e581" />
        <circle className="dot-t6" r="2.5" fill="#009854" />
        <circle className="dot-t7" r="3" fill="#00e581" />
        <circle className="dot-t8" r="2.5" fill="#009854" />
        <circle className="dot-t9" r="3" fill="#00e581" />
        <circle className="dot-t10" r="2.5" fill="#009854" />

        {/* City dots */}
        <circle className="city" cx="180" cy="280" r="3" fill="#009854" style={{ animationDelay: "0s" }} />
        <circle className="city" cx="420" cy="230" r="3" fill="#009854" style={{ animationDelay: "0.5s" }} />
        <circle className="city" cx="520" cy="300" r="3" fill="#009854" style={{ animationDelay: "1s" }} />
        <circle className="city" cx="250" cy="310" r="3" fill="#009854" style={{ animationDelay: "1.5s" }} />
        <circle className="city" cx="300" cy="450" r="2.5" fill="#009854" style={{ animationDelay: "2s" }} />
        <circle className="city" cx="480" cy="250" r="2.5" fill="#009854" style={{ animationDelay: "0.3s" }} />
        <circle className="city" cx="450" cy="420" r="2.5" fill="#009854" style={{ animationDelay: "0.8s" }} />
        <circle className="city" cx="280" cy="280" r="2.5" fill="#009854" style={{ animationDelay: "1.3s" }} />
        <circle className="city" cx="500" cy="340" r="2.5" fill="#009854" style={{ animationDelay: "1.8s" }} />
        <circle className="city" cx="200" cy="350" r="2.5" fill="#009854" style={{ animationDelay: "2.3s" }} />
        <circle className="city" cx="380" cy="200" r="2.5" fill="#009854" style={{ animationDelay: "0.7s" }} />
        <circle className="city" cx="350" cy="460" r="2.5" fill="#009854" style={{ animationDelay: "1.2s" }} />
        <circle className="city" cx="550" cy="380" r="2.5" fill="#009854" style={{ animationDelay: "1.7s" }} />
        <circle className="city" cx="300" cy="320" r="2" fill="#009854" style={{ animationDelay: "2.2s" }} />
        <circle className="city" cx="500" cy="280" r="2" fill="#009854" style={{ animationDelay: "0.4s" }} />
        <circle className="city" cx="250" cy="400" r="2" fill="#009854" style={{ animationDelay: "0.9s" }} />
        <circle className="city" cx="460" cy="450" r="2" fill="#009854" style={{ animationDelay: "1.4s" }} />
        <circle className="city" cx="220" cy="340" r="2" fill="#009854" style={{ animationDelay: "1.9s" }} />
        <circle className="city" cx="320" cy="200" r="2" fill="#009854" style={{ animationDelay: "2.4s" }} />
        <circle className="city" cx="480" cy="350" r="2" fill="#009854" style={{ animationDelay: "2.8s" }} />
      </svg>
    </div>
  );
}
