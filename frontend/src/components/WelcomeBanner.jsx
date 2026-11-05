function Illustration() {
  return (
    <svg viewBox="0 0 520 150" className="h-full w-full" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      {/* skyline */}
      <g fill="#b9b4f0" opacity="0.75">
        <rect x="20" y="86" width="22" height="64" />
        <rect x="46" y="64" width="26" height="86" />
        <rect x="76" y="92" width="20" height="58" />
        <rect x="100" y="52" width="24" height="98" />
        <rect x="128" y="80" width="30" height="70" />
        <rect x="162" y="96" width="22" height="54" />
      </g>
      <g fill="#9d97ea" opacity="0.8">
        <rect x="190" y="70" width="24" height="80" />
        <rect x="218" y="100" width="28" height="50" />
        <rect x="250" y="84" width="20" height="66" />
      </g>
      {/* hills / ground */}
      <path d="M0 150 L0 128 Q120 112 260 126 T520 120 L520 150 Z" fill="#7fb98a" opacity="0.55" />
      <rect x="0" y="136" width="520" height="14" fill="#5b6b8c" opacity="0.55" />
      {/* trees */}
      <g>
        <rect x="316" y="112" width="5" height="26" fill="#5a4a3a" />
        <circle cx="318" cy="102" r="17" fill="#3f9d5b" />
        <circle cx="308" cy="110" r="11" fill="#4fb36b" />
        <rect x="486" y="108" width="5" height="30" fill="#5a4a3a" />
        <circle cx="488" cy="96" r="19" fill="#3f9d5b" />
        <circle cx="498" cy="106" r="12" fill="#4fb36b" />
      </g>
      {/* billboard */}
      <rect x="402" y="62" width="6" height="76" fill="#3b3f63" />
      <rect x="352" y="14" width="142" height="62" rx="4" fill="#2a2f55" />
      <rect x="357" y="19" width="132" height="52" rx="2" fill="url(#board)" />
      <text x="423" y="42" textAnchor="middle" fontSize="14" fontWeight="800" fontStyle="italic" fill="#fff" fontFamily="Plus Jakarta Sans, sans-serif">Advertise</text>
      <text x="423" y="60" textAnchor="middle" fontSize="14" fontWeight="800" fontStyle="italic" fill="#fff" fontFamily="Plus Jakarta Sans, sans-serif">Smarter</text>
      {/* car */}
      <g>
        <path d="M232 138 L236 124 Q240 116 252 116 L282 116 Q294 116 300 126 L306 138 Z" fill="#1e2a55" />
        <path d="M248 118 L254 110 Q258 106 266 106 L282 106 Q288 106 291 112 L296 118 Z" fill="#2c3a72" />
        <rect x="254" y="109" width="14" height="8" rx="1" fill="#bcd2ff" />
        <rect x="271" y="109" width="16" height="8" rx="1" fill="#bcd2ff" />
        <circle cx="252" cy="139" r="7" fill="#12162f" />
        <circle cx="286" cy="139" r="7" fill="#12162f" />
        <circle cx="252" cy="139" r="3" fill="#9aa3c7" />
        <circle cx="286" cy="139" r="3" fill="#9aa3c7" />
      </g>
    </svg>
  );
}

export default function WelcomeBanner({ name }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-100 via-[#eceaff] to-[#dcd8fb] shadow-card">
      <div className="relative z-10 px-6 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Welcome back, {name || 'there'}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">Here&apos;s what&apos;s happening with your campaigns today.</p>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] md:block">
        <Illustration />
      </div>
    </section>
  );
}
