function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function rng(seed) {
  let s = hashStr(String(seed)) || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

const PALETTES = [
  ['#7c5cff','#5b8dff','#0e1024'],
  ['#ff7a59','#ffb259','#1f1410'],
  ['#34d399','#22d3ee','#072b25'],
  ['#f472b6','#a78bfa','#1a0b22'],
  ['#fde047','#fb923c','#231807'],
  ['#60a5fa','#22d3ee','#0a1726'],
  ['#a3e635','#22d3ee','#10210a'],
  ['#f97316','#ef4444','#241008'],
  ['#c084fc','#f472b6','#180a26'],
  ['#fbbf24','#84cc16','#23170a'],
];

export default function RobotAvatar({ seed = 'a', size = 38 }) {
  const r = rng(seed);
  const pal = PALETTES[Math.floor(r() * PALETTES.length)];
  const [c1, c2, bg] = pal;
  const headShape = ['rect','rounded','dome','hex'][Math.floor(r()*4)];
  const eyes = ['dot','square','line','visor','cyclops'][Math.floor(r()*5)];
  const mouth = ['line','grid','smile','vent','dot'][Math.floor(r()*5)];
  const ant = r() < 0.7;
  const earL = r() < 0.6;
  const accentHue = Math.floor(r() * 360);

  const cx = 32, cy = 34;
  const headW = 38, headH = 36;
  const x = cx - headW/2, y = cy - headH/2;

  let head;
  if (headShape === 'rect') {
    head = <rect x={x} y={y} width={headW} height={headH} rx={4} fill="url(#g1)"/>;
  } else if (headShape === 'rounded') {
    head = <rect x={x} y={y} width={headW} height={headH} rx={10} fill="url(#g1)"/>;
  } else if (headShape === 'dome') {
    head = <path d={`M ${x} ${y+8} Q ${x} ${y-2} ${cx} ${y-2} Q ${x+headW} ${y-2} ${x+headW} ${y+8} L ${x+headW} ${y+headH} Q ${x+headW} ${y+headH+2} ${x+headW-3} ${y+headH+2} L ${x+3} ${y+headH+2} Q ${x} ${y+headH+2} ${x} ${y+headH} Z`} fill="url(#g1)"/>;
  } else {
    head = <polygon points={`${cx},${y-2} ${x+headW+2},${y+headH/2} ${cx},${y+headH+2} ${x-2},${y+headH/2}`} fill="url(#g1)"/>;
  }

  let eyesEl;
  const eyeY = cy - 2;
  if (eyes === 'dot') {
    eyesEl = <g fill="#fff"><circle cx={cx-7} cy={eyeY} r="2.5"/><circle cx={cx+7} cy={eyeY} r="2.5"/></g>;
  } else if (eyes === 'square') {
    eyesEl = <g fill="#fff"><rect x={cx-10} y={eyeY-2.5} width="5" height="5" rx="1"/><rect x={cx+5} y={eyeY-2.5} width="5" height="5" rx="1"/></g>;
  } else if (eyes === 'line') {
    eyesEl = <g stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1={cx-10} y1={eyeY} x2={cx-4} y2={eyeY}/><line x1={cx+4} y1={eyeY} x2={cx+10} y2={eyeY}/></g>;
  } else if (eyes === 'visor') {
    eyesEl = <g><rect x={cx-12} y={eyeY-3} width="24" height="6" rx="3" fill={`oklch(0.5 0.1 ${accentHue})`} opacity="0.4"/><rect x={cx-10} y={eyeY-2} width="20" height="3" rx="1.5" fill="#fff"/></g>;
  } else {
    eyesEl = <circle cx={cx} cy={eyeY} r="3.5" fill="#fff"/>;
  }

  let mouthEl;
  const my = cy + 7;
  if (mouth === 'line') {
    mouthEl = <line x1={cx-5} y1={my} x2={cx+5} y2={my} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>;
  } else if (mouth === 'grid') {
    mouthEl = <g fill="#fff" opacity="0.7">
      <rect x={cx-6} y={my-1.5} width="3" height="3" rx="0.5"/>
      <rect x={cx-1.5} y={my-1.5} width="3" height="3" rx="0.5"/>
      <rect x={cx+3} y={my-1.5} width="3" height="3" rx="0.5"/>
    </g>;
  } else if (mouth === 'smile') {
    mouthEl = <path d={`M ${cx-5} ${my-1} Q ${cx} ${my+3} ${cx+5} ${my-1}`} stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>;
  } else if (mouth === 'vent') {
    mouthEl = <g stroke="#fff" strokeWidth="1" opacity="0.6">
      <line x1={cx-5} y1={my-1} x2={cx+5} y2={my-1}/>
      <line x1={cx-5} y1={my+1} x2={cx+5} y2={my+1}/>
    </g>;
  } else {
    mouthEl = <circle cx={cx} cy={my} r="1.5" fill="#fff" opacity="0.7"/>;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1}/>
          <stop offset="1" stopColor={c2}/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx={0} fill={bg}/>
      {ant && <g stroke={c1} strokeWidth="1.5" strokeLinecap="round">
        <line x1={cx} y1={y-2} x2={cx} y2={y-7}/>
        <circle cx={cx} cy={y-9} r="1.6" fill={c2} stroke="none"/>
      </g>}
      {earL && <g fill={c2}>
        <rect x={x-3} y={cy-4} width="3" height="8" rx="1.5"/>
        <rect x={x+headW} y={cy-4} width="3" height="8" rx="1.5"/>
      </g>}
      {head}
      <rect x={x+3} y={y+5} width={headW-6} height="14" rx="2.5" fill={`oklch(0 0 0 / 0.35)`}/>
      {eyesEl}
      {mouthEl}
      <rect x={x} y={y+headH-6} width={headW} height="2" fill={`oklch(0 0 0 / 0.18)`}/>
    </svg>
  );
}
