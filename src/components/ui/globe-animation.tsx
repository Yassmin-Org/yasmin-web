"use client";

export function GlobeAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
      <svg
        width="700"
        height="700"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-30"
      >
        <style>{`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes travel1 {
            0% { offset-distance: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0; }
          }
          @keyframes travel2 {
            0% { offset-distance: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { r: 3; opacity: 0.6; }
            50% { r: 5; opacity: 1; }
          }
          .globe-grid {
            animation: rotate 120s linear infinite;
            transform-origin: 350px 350px;
          }
          .dot-travel-1 {
            offset-path: path("M180 280 Q280 150 420 230");
            animation: travel1 4s ease-in-out infinite;
          }
          .dot-travel-2 {
            offset-path: path("M520 300 Q400 180 250 310");
            animation: travel1 5s ease-in-out infinite 1s;
          }
          .dot-travel-3 {
            offset-path: path("M300 450 Q350 300 480 250");
            animation: travel1 3.5s ease-in-out infinite 2s;
          }
          .dot-travel-4 {
            offset-path: path("M450 420 Q380 350 280 280");
            animation: travel1 4.5s ease-in-out infinite 0.5s;
          }
          .dot-travel-5 {
            offset-path: path("M200 350 Q320 250 500 340");
            animation: travel1 6s ease-in-out infinite 3s;
          }
          .dot-travel-6 {
            offset-path: path("M380 200 Q300 320 350 460");
            animation: travel1 5.5s ease-in-out infinite 1.5s;
          }
          .dot-travel-7 {
            offset-path: path("M550 380 Q450 280 300 320");
            animation: travel1 4s ease-in-out infinite 2.5s;
          }
          .dot-travel-8 {
            offset-path: path("M250 400 Q350 300 500 280");
            animation: travel1 5s ease-in-out infinite 4s;
          }
          .city-pulse {
            animation: pulse 3s ease-in-out infinite;
          }
        `}</style>

        {/* Rotating globe grid */}
        <g className="globe-grid">
          {/* Main circle */}
          <circle cx="350" cy="350" r="250" stroke="#009854" strokeWidth="1.2" />
          {/* Latitude lines */}
          <ellipse cx="350" cy="350" rx="250" ry="70" stroke="#009854" strokeWidth="0.6" />
          <ellipse cx="350" cy="350" rx="250" ry="140" stroke="#009854" strokeWidth="0.6" />
          <ellipse cx="350" cy="350" rx="250" ry="210" stroke="#009854" strokeWidth="0.6" />
          {/* Longitude lines */}
          <ellipse cx="350" cy="350" rx="70" ry="250" stroke="#009854" strokeWidth="0.6" />
          <ellipse cx="350" cy="350" rx="140" ry="250" stroke="#009854" strokeWidth="0.6" />
          <ellipse cx="350" cy="350" rx="210" ry="250" stroke="#009854" strokeWidth="0.6" />
          {/* Extra tilted meridians */}
          <ellipse cx="350" cy="350" rx="180" ry="250" stroke="#009854" strokeWidth="0.4" transform="rotate(25 350 350)" />
          <ellipse cx="350" cy="350" rx="180" ry="250" stroke="#009854" strokeWidth="0.4" transform="rotate(-25 350 350)" />
        </g>

        {/* Static transfer arcs */}
        {/* Middle East → Europe */}
        <path d="M180 280 Q280 150 420 230" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* Americas → Middle East */}
        <path d="M520 300 Q400 180 250 310" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* Europe → Africa */}
        <path d="M300 450 Q350 300 480 250" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* Asia → Europe */}
        <path d="M450 420 Q380 350 280 280" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* South → North */}
        <path d="M200 350 Q320 250 500 340" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* North → South */}
        <path d="M380 200 Q300 320 350 460" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* East → West */}
        <path d="M550 380 Q450 280 300 320" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />
        {/* West → East */}
        <path d="M250 400 Q350 300 500 280" stroke="#009854" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.5" />

        {/* Traveling dots */}
        <circle className="dot-travel-1" r="4" fill="#00e581" />
        <circle className="dot-travel-2" r="4" fill="#00e581" />
        <circle className="dot-travel-3" r="3.5" fill="#009854" />
        <circle className="dot-travel-4" r="3.5" fill="#009854" />
        <circle className="dot-travel-5" r="3" fill="#00e581" />
        <circle className="dot-travel-6" r="3" fill="#009854" />
        <circle className="dot-travel-7" r="4" fill="#00e581" />
        <circle className="dot-travel-8" r="3.5" fill="#009854" />

        {/* City dots (pulsing) */}
        <circle className="city-pulse" cx="180" cy="280" r="4" fill="#009854" style={{ animationDelay: "0s" }} />
        <circle className="city-pulse" cx="420" cy="230" r="4" fill="#009854" style={{ animationDelay: "0.5s" }} />
        <circle className="city-pulse" cx="520" cy="300" r="4" fill="#009854" style={{ animationDelay: "1s" }} />
        <circle className="city-pulse" cx="250" cy="310" r="4" fill="#009854" style={{ animationDelay: "1.5s" }} />
        <circle className="city-pulse" cx="300" cy="450" r="3" fill="#009854" style={{ animationDelay: "2s" }} />
        <circle className="city-pulse" cx="480" cy="250" r="3" fill="#009854" style={{ animationDelay: "0.3s" }} />
        <circle className="city-pulse" cx="450" cy="420" r="3" fill="#009854" style={{ animationDelay: "0.8s" }} />
        <circle className="city-pulse" cx="280" cy="280" r="3" fill="#009854" style={{ animationDelay: "1.3s" }} />
        <circle className="city-pulse" cx="500" cy="340" r="3" fill="#009854" style={{ animationDelay: "1.8s" }} />
        <circle className="city-pulse" cx="200" cy="350" r="3" fill="#009854" style={{ animationDelay: "2.3s" }} />
        <circle className="city-pulse" cx="380" cy="200" r="3" fill="#009854" style={{ animationDelay: "0.7s" }} />
        <circle className="city-pulse" cx="350" cy="460" r="3" fill="#009854" style={{ animationDelay: "1.2s" }} />
        <circle className="city-pulse" cx="550" cy="380" r="3" fill="#009854" style={{ animationDelay: "1.7s" }} />
        <circle className="city-pulse" cx="300" cy="320" r="3" fill="#009854" style={{ animationDelay: "2.2s" }} />
        <circle className="city-pulse" cx="500" cy="280" r="3" fill="#009854" style={{ animationDelay: "0.4s" }} />
        <circle className="city-pulse" cx="250" cy="400" r="3" fill="#009854" style={{ animationDelay: "0.9s" }} />
      </svg>
    </div>
  );
}
