// Fine-line botanical drawings of the species of the Herbier (docs/game-design.md §9.5, §10.4),
// in a 32 × 32 box centred on (16, 16). The same drawing illustrates the Herbier's plate and,
// scaled down, the species living on the map.
import type { ReactNode } from 'react';
import type { SpeciesId } from '../game/species';

const INK = '#3b4a40';

/** Thin ink outline shared by every drawing. */
const line = {
  stroke: INK,
  strokeWidth: 0.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function wing(d: string, fill = 'rgb(255 255 255 / 0.75)') {
  return <path d={d} fill={fill} {...line} strokeWidth={0.6} />;
}

export const SPECIES_ART: Record<SpeciesId, () => ReactNode> = {
  poppy: () => (
    <>
      <path d="M16 30c0-6 1-10-1-15M15.5 22c2-1 4-1 5.5-3" fill="none" {...line} stroke="#5d8a5a" />
      <path d="M20 20c2 0 3-1 3-2-2-.5-3 .5-3 2Z" fill="#8fae8b" {...line} strokeWidth={0.5} />
      <circle cx="11.5" cy="9.5" r="5" fill="#e0573c" {...line} />
      <circle cx="19" cy="9" r="5" fill="#e86a45" {...line} />
      <circle cx="15" cy="13.5" r="5" fill="#d9472f" {...line} />
      <circle cx="15.2" cy="10.5" r="2" fill="#2b2622" />
      <path d="M13.8 10.5h2.8M15.2 9v3" stroke="#c9b9a0" strokeWidth={0.4} />
    </>
  ),
  bee: () => (
    <>
      {wing('M15 13c-3-6-9-6-9-2 0 3 5 4 9 2Z')}
      {wing('M17 13c3-6 9-6 9-2 0 3-5 4-9 2Z')}
      <ellipse cx="16" cy="18.5" rx="4.2" ry="6.5" fill="#f2b33d" {...line} />
      <path d="M12.2 16.5h7.6M12 19.5h8M12.6 22.5h6.8" stroke="#4a3622" strokeWidth={1.3} />
      <circle cx="16" cy="10.5" r="2.6" fill="#4a3622" {...line} />
      <path d="M15 8.2c-1-2-2.5-2.5-3.5-2.4M17 8.2c1-2 2.5-2.5 3.5-2.4" fill="none" {...line} />
    </>
  ),
  fern: () => (
    <>
      <path d="M8 30C10 18 16 8 26 4" fill="none" {...line} stroke="#2f6b4f" strokeWidth={1} />
      {[0.15, 0.3, 0.45, 0.6, 0.75].map((k, i) => {
        const x = 8 + k * 18 + k * k * 2;
        const y = 30 - k * 26 + k * k * 4;
        const size = 6 - i;
        return (
          <g key={k} fill="#7fae6e" {...line} strokeWidth={0.5}>
            <path
              d={`M${x} ${y}c-${size} -1 -${size + 1} -${size / 2} -${size} -${size / 1.4}c2 0 ${size / 2} 1 ${size} ${size / 1.4}Z`}
            />
            <path
              d={`M${x} ${y}c${size / 2} ${size / 1.5} ${size + 1} ${size / 2} ${size + 1} ${size / 3}c-1 -1 -${size / 2} -1 -${size + 1} -${size / 3}Z`}
            />
          </g>
        );
      })}
      <path d="M26 4c1.5 0 2 1.5 1 2.2-.8.5-1.6-.3-1-1" fill="none" {...line} stroke="#2f6b4f" />
    </>
  ),
  ladybird: () => (
    <>
      <path d="M8 20l-3 2M8 16H4.5M9 12.5 6 10M24 20l3 2M24 16h3.5M23 12.5l3-2.5" {...line} />
      <circle cx="16" cy="8.5" r="3.2" fill="#2b2622" {...line} />
      <circle cx="14.6" cy="7.6" r="0.8" fill="#fbf6ec" />
      <circle cx="17.4" cy="7.6" r="0.8" fill="#fbf6ec" />
      <path d="M16 10.5c-7 0-9 5-9 9 0 5 4 8 9 8s9-3 9-8c0-4-2-9-9-9Z" fill="#d9412f" {...line} />
      <path d="M16 10.5v17" {...line} />
      {[
        [12, 15],
        [20, 15],
        [11, 21],
        [21, 21],
        [13.5, 25],
        [18.5, 25],
      ].map(([x = 0, y = 0]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r="1.4" fill="#2b2622" />
      ))}
    </>
  ),
  bumblebee: () => (
    <>
      {wing('M13 12c-4-5-9-4-8 0 1 3 5 3 8 0Z')}
      {wing('M19 12c4-5 9-4 8 0-1 3-5 3-8 0Z')}
      <circle cx="16" cy="18" r="7.5" fill="#f3c449" {...line} />
      <path d="M9 16.5c4-1.6 10-1.6 14 0v3c-4 1.4-10 1.4-14 0Z" fill="#2b2622" />
      <path d="M11 24c3 1.4 7 1.4 10 0" stroke="#fbf6ec" strokeWidth={1.4} fill="none" />
      <circle cx="16" cy="9.5" r="3" fill="#2b2622" {...line} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path
          key={a}
          d="M16 10.3v-1"
          stroke="#f3c449"
          strokeWidth={0.4}
          transform={`rotate(${a} 16 18) translate(0 -1)`}
        />
      ))}
    </>
  ),
  sparrow: () => (
    <>
      <path d="M6 22c3-1 6-1 8 0l-3 4Z" fill="#7a5a3c" {...line} />
      <path
        d="M8 19c0-6 5-10 11-10 4 0 7 2 7 5 0 6-6 10-12 10-4 0-6-2-6-5Z"
        fill="#b48a5e"
        {...line}
      />
      <path d="M18 9.5c3-1 6 0 7 3-2 0-4-1-7-3Z" fill="#7a5a3c" />
      <path
        d="M12 16c3 2 7 2 10 0M11 19c3 1.6 6 1.6 9 .3"
        fill="none"
        stroke="#7a5a3c"
        strokeWidth={0.8}
      />
      <path d="M25.6 12.4 29 13l-3.2 1.2" fill="#3b2f25" {...line} strokeWidth={0.5} />
      <circle cx="22.6" cy="12.2" r="0.9" fill="#2b2622" />
      <path d="M14 24.5v3.5M17 24.3v3.7" {...line} />
    </>
  ),
  blueTit: () => (
    <>
      <path d="M7 21c2-.5 4 0 5 1l-3 4Z" fill="#5b8fc4" {...line} />
      <path d="M9 18c0-6 4-9 9-9 5 0 8 3 8 7 0 5-5 8-10 8-4 0-7-2-7-6Z" fill="#f3d24c" {...line} />
      <path d="M9.4 15.6c1-4 4-6.6 8.6-6.6 4 0 6.5 2 7.5 4.6-5-1.6-11-.4-16.1 2Z" fill="#5b8fc4" />
      <path
        d="M18 12.6c2-1.4 5-1.2 7.2.6-1.6 1.4-4.4 1.6-7.2-.6Z"
        fill="#fbf6ec"
        {...line}
        strokeWidth={0.5}
      />
      <circle cx="21.8" cy="13" r="0.9" fill="#2b2622" />
      <path d="M26 14.2 28.6 15l-2.6.8" fill="#2b2622" />
      <path d="M15 24v3.4M18 23.6v3.6" {...line} />
    </>
  ),
  brimstone: () => (
    <>
      <path d="M16 15C13 6 5 4 4 9c-1 5 5 9 12 7Z" fill="#f6e27a" {...line} />
      <path d="M16 15c3-9 11-11 12-6 1 5-5 9-12 7Z" fill="#f2da62" {...line} />
      <path d="M16 17c-5 1-9 5-7 9 2 3 6-1 7-9Z" fill="#eed45a" {...line} />
      <path d="M16 17c5 1 9 5 7 9-2 3-6-1-7-9Z" fill="#f6e27a" {...line} />
      <circle cx="10" cy="11" r="0.8" fill="#e8913b" />
      <circle cx="22" cy="11" r="0.8" fill="#e8913b" />
      <path d="M16 9v17M16 9c-1-3-3-4-4-4.5M16 9c1-3 3-4 4-4.5" fill="none" {...line} />
    </>
  ),
  frog: () => (
    <>
      <path
        d="M10 23c-4 1-6 3-6 5h5M22 23c4 1 6 3 6 5h-5M10 14c-3-1-5-3-5-5h3M22 14c3-1 5-3 5-5h-3"
        fill="none"
        {...line}
        stroke="#7d6a3a"
        strokeWidth={1.2}
      />
      <ellipse cx="16" cy="19" rx="7.5" ry="9" fill="#a8935a" {...line} />
      <path d="M12 13c2 1 6 1 8 0" fill="none" stroke="#6e5a2c" strokeWidth={0.6} />
      <circle cx="12.5" cy="11.5" r="2.2" fill="#c5b072" {...line} />
      <circle cx="19.5" cy="11.5" r="2.2" fill="#c5b072" {...line} />
      <circle cx="12.5" cy="11.3" r="1" fill="#2b2622" />
      <circle cx="19.5" cy="11.3" r="1" fill="#2b2622" />
      <path d="M13 20l1 1.4M18 22l1 1.4M15.6 25l.6 1.2" stroke="#6e5a2c" strokeWidth={0.8} />
    </>
  ),
  hedgehog: () => (
    <>
      <path d="M6 22c0-8 5-13 12-13 5 0 9 3 10 8l-2 1 2 1-2 1 1 2H6Z" fill="#8a6a4c" {...line} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (Math.PI * (i + 1)) / 10;
        const x = 16 - Math.cos(a) * 9;
        const y = 21 - Math.sin(a) * 10;
        return (
          <path
            key={i}
            d={`M${x} ${y}l${-Math.cos(a) * 2.4} ${-Math.sin(a) * 2.4}`}
            stroke="#5a4330"
            strokeWidth={0.9}
            strokeLinecap="round"
          />
        );
      })}
      <path d="M22 22c2-3 5-4 8-2-1 2-3 3-8 2Z" fill="#d9bf9a" {...line} />
      <circle cx="30" cy="20.4" r="0.9" fill="#2b2622" />
      <circle cx="25.4" cy="19.8" r="0.7" fill="#2b2622" />
      <path d="M10 22v3M15 22v3M20 22v3" {...line} />
    </>
  ),
  robin: () => (
    <>
      <path d="M5 20c2-1 5-1 7 0l-3 5Z" fill="#7a6248" {...line} />
      <circle cx="17" cy="16" r="9" fill="#9c7c58" {...line} />
      <path d="M12 12c2-3 7-4 11-1 2 3 2 8-2 11-3 2-7 1-9-2-1-3-1-6 0-8Z" fill="#e8783e" />
      <path d="M14 22c2 1.6 5 1.8 8 .4" fill="none" stroke="#fbf6ec" strokeWidth={1.2} />
      <circle cx="21" cy="12.4" r="1" fill="#2b2622" />
      <path d="M25.4 13.4 28.4 14l-3 .8" fill="#2b2622" />
      <path d="M15 25v3.4M19 25v3.4" {...line} />
    </>
  ),
  swift: () => (
    <>
      <path
        d="M16 15C11 9 6 8 2 9c4 1 8 4 12 8M16 15c5-6 10-7 14-6-4 1-8 4-12 8"
        fill="#3b3a3f"
        {...line}
      />
      <path d="M13 16c1-2 5-2 6 0 0 3-1 6-3 9-2-3-3-6-3-9Z" fill="#45444a" {...line} />
      <path d="M16 25l-2 3M16 25l2 3" {...line} />
      <circle cx="16" cy="15" r="2.2" fill="#45444a" {...line} />
      <circle cx="16" cy="16" r="0.9" fill="#e9e3d6" />
    </>
  ),
  glowWorm: () => (
    <>
      <circle cx="22" cy="21" r="7" fill="#f4e27a" opacity={0.35} />
      <circle cx="22" cy="21" r="4" fill="#f6ea8f" opacity={0.6} />
      {[
        [7, 12, 2],
        [10, 14, 2.4],
        [13.6, 16, 2.6],
        [17.2, 18, 2.6],
        [20.6, 20, 2.4],
        [23.6, 22, 2.2],
      ].map(([x = 0, y = 0, r = 0], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={i >= 4 ? '#e9e27a' : '#6b5a3c'}
          {...line}
          strokeWidth={0.5}
        />
      ))}
      <path d="M6 10.5 4 8M7.5 10.2 7 7.4" {...line} />
    </>
  ),
  bat: () => (
    <>
      <path
        d="M16 13c-3-3-8-4-13-2 2 1 3 3 3 5 2-1 4-1 5 1 1-2 3-2 5-1M16 13c3-3 8-4 13-2-2 1-3 3-3 5-2-1-4-1-5 1-1-2-3-2-5-1"
        fill="#5a4a52"
        {...line}
      />
      <ellipse cx="16" cy="16" rx="2.6" ry="4" fill="#6b5560" {...line} />
      <path d="M14.2 12.6 13.6 10l1.8 1.4M17.8 12.6l.6-2.6-1.8 1.4" fill="#6b5560" {...line} />
      <circle cx="15.2" cy="14" r="0.5" fill="#fbf6ec" />
      <circle cx="16.8" cy="14" r="0.5" fill="#fbf6ec" />
    </>
  ),
  kingfisher: () => (
    <>
      <path d="M5 23c2-1 4-1 6 0l-2 4Z" fill="#2a86a6" {...line} />
      <path
        d="M8 20c0-6 4-10 10-10 4 0 6 2 6 5 0 5-5 9-11 9-3 0-5-1-5-4Z"
        fill="#e7843e"
        {...line}
      />
      <path
        d="M8.4 18.5c1-5 4.6-8.5 9.6-8.5 3 0 5 1 5.8 3-5.6-.4-10.6 1.8-15.4 5.5Z"
        fill="#2a9ac0"
      />
      <path d="M12 16.4c2-.6 3.6-.4 5 .4" fill="none" stroke="#7fd0e6" strokeWidth={0.9} />
      <path d="M23.4 13.4 31 15l-7.6 1.2" fill="#2b2622" {...line} strokeWidth={0.5} />
      <circle cx="20.6" cy="13" r="0.9" fill="#2b2622" />
      <path d="M18.6 14.6c1 .6 2 .6 3 0" fill="none" stroke="#fbf6ec" strokeWidth={0.8} />
      <path d="M14 23.6v3M16.6 23.2v3" {...line} stroke="#d0563a" />
    </>
  ),
  orchid: () => (
    <>
      <path
        d="M16 30V13M16 26c-3-1-5-4-5-7 3 1 5 4 5 7ZM16 24c3-1 5-3 5-6-3 1-5 3-5 6Z"
        fill="#8fae8b"
        {...line}
        stroke="#5d8a5a"
      />
      {[
        [16, 5, 1.8],
        [14.2, 7.6, 2],
        [17.8, 7.6, 2],
        [16, 9.2, 2.1],
        [13.4, 10.8, 2.1],
        [18.6, 10.8, 2.1],
        [16, 12.6, 2.2],
      ].map(([x = 0, y = 0, r = 0], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#d77fb4" {...line} strokeWidth={0.4} />
          <circle cx={x} cy={y + 0.4} r={r / 3} fill="#f6d2e6" />
        </g>
      ))}
    </>
  ),
  stagBeetle: () => (
    <>
      <path d="M9 17 5 15M9 21l-4 1M10 25l-3 3M23 17l4-2M23 21l4 1M22 25l3 3" {...line} />
      <path
        d="M13.6 9.6C12 6 9 5 8 3c3 0 5 1 6.4 4M18.4 9.6C20 6 23 5 24 3c-3 0-5 1-6.4 4"
        fill="#7a4a2c"
        {...line}
      />
      <path d="M11.4 8.6h9.2l-.8 3.4h-7.6Z" fill="#4a3022" {...line} />
      <path d="M16 12c-5 0-7 4-7 9 0 5 3 8 7 8s7-3 7-8c0-5-2-9-7-9Z" fill="#5a3826" {...line} />
      <path d="M16 12.4v16.4" {...line} />
      <path d="M12.4 16c1-1.4 2-2 3-2.2" fill="none" stroke="#a87a54" strokeWidth={0.7} />
    </>
  ),
  owl: () => (
    <>
      <path d="M8 13c0-6 4-9 8-9s8 3 8 9v9c0 5-4 8-8 8s-8-3-8-8Z" fill="#9b7650" {...line} />
      <path d="M10 22c1 4 3 6 6 6s5-2 6-6c-1-3-3-4-6-4s-5 1-6 4Z" fill="#d8c09a" />
      {[
        [13, 22],
        [16, 23.5],
        [19, 22],
        [14.4, 25.5],
        [17.6, 25.5],
      ].map(([x = 0, y = 0]) => (
        <path
          key={`${x},${y}`}
          d={`M${x - 0.8} ${y}l0.8 1 0.8 -1`}
          fill="none"
          stroke="#7a5a3c"
          strokeWidth={0.6}
        />
      ))}
      <circle cx="12.6" cy="12.6" r="3.6" fill="#e8d6b4" {...line} />
      <circle cx="19.4" cy="12.6" r="3.6" fill="#e8d6b4" {...line} />
      <circle cx="12.6" cy="12.6" r="1.6" fill="#2b2622" />
      <circle cx="19.4" cy="12.6" r="1.6" fill="#2b2622" />
      <circle cx="13.1" cy="12.1" r="0.5" fill="#fbf6ec" />
      <circle cx="19.9" cy="12.1" r="0.5" fill="#fbf6ec" />
      <path d="M15.2 15.4 16 17.4l.8-2Z" fill="#c9a03e" {...line} strokeWidth={0.5} />
    </>
  ),
  otter: () => (
    <>
      <path d="M3 24q3-1.6 6 0t6 0 6 0 6 0 3 0" fill="none" stroke="#5fa8c4" strokeWidth={0.9} />
      <path
        d="M6 22c1-4 5-7 10-7 3 0 5-2 7-2 3 0 5 2 5 4s-2 3-4 3c-3 0-4 2-8 3-4 .6-8 .4-10-1Z"
        fill="#7a5638"
        {...line}
      />
      <path d="M6 22c-2 0-3.4-1-4-2.6 1.6.2 3 .8 4 2.6Z" fill="#7a5638" {...line} />
      <path d="M20 19c1.6 1 3.4 1.4 5.6 1" fill="none" stroke="#c9a77e" strokeWidth={0.9} />
      <circle cx="24.6" cy="15.6" r="0.8" fill="#2b2622" />
      <circle cx="27.6" cy="16.6" r="0.7" fill="#2b2622" />
      <path
        d="M27 18.2 30.6 17.4M27 18.8l3.6.4M23 14l.6-1.6 1 1.2"
        fill="none"
        {...line}
        strokeWidth={0.5}
      />
    </>
  ),
  salmon: () => (
    <>
      <path d="M4 27q3-1.6 6 0t6 0 6 0 6 0" fill="none" stroke="#5fa8c4" strokeWidth={0.9} />
      <path
        d="M6 21c3-7 9-11 16-11 2 0 4 1 5 2-1 2-3 3-5 4-5 3-10 5-16 5Z"
        fill="#c9cfd2"
        {...line}
      />
      <path d="M8 19.6c4-1 9-3.4 13-6.4 2.4-.4 4 0 5.2.8-5 3.6-11 5.6-18.2 5.6Z" fill="#e48a7c" />
      <path d="M6 21 2 23.6l1-4.4-2.4-3.4L6 18" fill="#aab4b8" {...line} />
      <path
        d="M14 12.6 15.6 9.6l2 2.4M13 19.6l1.4 3 1.4-2.6"
        fill="#aab4b8"
        {...line}
        strokeWidth={0.5}
      />
      <circle cx="23.6" cy="12.6" r="0.8" fill="#2b2622" />
      {[
        [12, 15.4],
        [15, 13.6],
        [18, 12.2],
      ].map(([x = 0, y = 0]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r="0.5" fill="#3b4a40" />
      ))}
    </>
  ),
  blackStork: () => (
    <>
      <path d="M14 22 12.6 30.6M17 22l1.4 8.6" {...line} stroke="#c8453a" strokeWidth={1} />
      <path
        d="M8 17c0-4 3-6 7-6 2-3 2-6 4-7.4 1.4-.6 2.6.2 2.6 1.4-1 2-2 4-2.2 7 2 1.2 2.6 3 2.6 5 0 3-3 5-7 5s-7-2-7-5Z"
        fill="#2f3438"
        {...line}
      />
      <path
        d="M11 19.6c1.4 1.4 3 2 5 2s3.6-.6 4.6-1.8c-1.6-.6-3.2-1-5-1-1.8 0-3.4.2-4.6.8Z"
        fill="#f1ede4"
      />
      <path d="M8 17 3.6 19.6 8.6 19" fill="#2f3438" {...line} />
      <path
        d="M21.6 5c2 .2 5 1.4 7.4 3.4-2.6-.6-5.2-1-7.6-.8Z"
        fill="#c8453a"
        {...line}
        strokeWidth={0.5}
      />
      <circle cx="20.4" cy="5.4" r="0.6" fill="#fbf6ec" />
      <path d="M11 14c2-.4 4-.2 6 .6" fill="none" stroke="#5f7a6a" strokeWidth={0.7} />
    </>
  ),
  // The species of the city's visits (§9.6, M18).
  skylark: () => (
    <>
      <path d="M12 24 10.6 29M16 24l.6 5" {...line} stroke="#9a7a55" />
      <path
        d="M5 17c1-4 5-6 9-6 1-2 3-4 6-4 2.4 0 4 1.6 4 3.4l3 1-3 .8c0 4-3 8-8 9.4-5 1.2-10 .4-11-4.6Z"
        fill="#b89468"
        {...line}
      />
      <path
        d="M19 7c0-2 1-3.4 2.4-4 0 1.4-.4 2.8-1.6 4"
        fill="#8a6a46"
        {...line}
        strokeWidth={0.5}
      />
      <path d="M5 17 1.6 15.4 3 19Z" fill="#8a6a46" {...line} />
      <path d="M9 15c3-1 6-1 9 .4" fill="none" stroke="#7a5a38" strokeWidth={0.7} />
      {[
        [11, 18],
        [14, 19],
        [17, 18.4],
        [20, 17],
      ].map(([x = 0, y = 0]) => (
        <path key={`${x},${y}`} d={`M${x} ${y}l.6 1.4`} stroke="#6a4c2e" strokeWidth={0.6} />
      ))}
      <circle cx="21.4" cy="10" r="0.7" fill="#2b2622" />
    </>
  ),
  swallow: () => (
    <>
      <path
        d="M16 12c-4-1-8-4-13-4 3 3 6 5 10 6.4M16 12c4-1 8-4 13-4-3 3-6 5-10 6.4"
        fill="#2c3d66"
        {...line}
      />
      <path d="M13 14c0 5 1 9 3 11 2-2 3-6 3-11-1-2-5-2-6 0Z" fill="#2c3d66" {...line} />
      <path
        d="M14.6 24 12 30.4M17.4 24l2.6 6.4"
        fill="none"
        {...line}
        stroke="#2c3d66"
        strokeWidth={1}
      />
      <circle cx="16" cy="10" r="3" fill="#2c3d66" {...line} />
      <path d="M14.4 12c1 1 2.2 1 3.2 0l-.4 2h-2.4Z" fill="#c8453a" />
      <path d="M14.6 16c.8 1.6 2 1.6 2.8 0" fill="none" stroke="#f1ede4" strokeWidth={0.8} />
      <circle cx="14.8" cy="9.4" r="0.5" fill="#fbf6ec" />
      <circle cx="17.2" cy="9.4" r="0.5" fill="#fbf6ec" />
    </>
  ),
  dragonfly: () => (
    <>
      {wing('M15 12C9 8 3 8 2 11c2 2.4 8 2.4 13 1Z', 'rgb(220 236 245 / 0.75)')}
      {wing('M17 12c6-4 12-4 13-1-2 2.4-8 2.4-13 1Z', 'rgb(220 236 245 / 0.75)')}
      {wing('M15 14c-5 0-10 2-10.6 4.6 2.6 1.2 7.6-.6 10.6-3.4Z', 'rgb(220 236 245 / 0.75)')}
      {wing('M17 14c5 0 10 2 10.6 4.6-2.6 1.2-7.6-.6-10.6-3.4Z', 'rgb(220 236 245 / 0.75)')}
      <circle cx="16" cy="8.6" r="2.4" fill="#5d7a4a" {...line} />
      <path d="M14.6 11h2.8l.6 3.4h-4Z" fill="#7a6a3a" {...line} />
      <path d="M13.6 14.6c-.4 4 .4 8.4 2.4 12.4 2-4 2.8-8.4 2.4-12.4Z" fill="#6f9fc8" {...line} />
      {[17.6, 20.4, 23.2].map((y) => (
        <path key={y} d={`M14.4 ${y}h3.2`} stroke="#d6b45a" strokeWidth={0.6} />
      ))}
    </>
  ),
  redstart: () => (
    <>
      <path d="M13 25 12 30M17 25l1 5" {...line} />
      <path
        d="M7 18c0-5 4-8 9-8 1-2 3-3 5-3 3 0 5 2 5 4.6l2.6.8-2.6.6c0 4-3 7-7 8-5 1.4-12 1-12-3Z"
        fill="#4a4f55"
        {...line}
      />
      <path
        d="M7 18c-2 .6-4.6 0-6-1.6 1 2.4 1.6 4.6 1 6.6 2-.4 4-2 5-5Z"
        fill="#d4623a"
        {...line}
      />
      <path d="M11 16c3-1 6-1 9 .2" fill="none" stroke="#e2e2de" strokeWidth={0.8} />
      <path d="M17 19c2 0 4-.6 6-2-1 2.4-3 3.4-6 2Z" fill="#2c2f33" />
      <circle cx="22.4" cy="10.6" r="0.7" fill="#fbf6ec" />
    </>
  ),
  greenWoodpecker: () => (
    <>
      <path d="M24 2v28" stroke="#8a6a48" strokeWidth={3.2} strokeLinecap="round" />
      <path
        d="M23 9c-1 1-1 3 0 4M25 20c1 1 1 2 0 3"
        fill="none"
        stroke="#6b5036"
        strokeWidth={0.5}
      />
      <path d="M21 10c-4-1-8 1-9 5-1 5 1 10 5 13l3 2 1-4c1-5 1-11 0-16Z" fill="#7da45a" {...line} />
      <path d="M21 27c-1-3-2-4-4-5 0 3 1 5 3 7Z" fill="#d6cf5a" {...line} strokeWidth={0.5} />
      <path d="M13 15c2 1 4 3 5 7" fill="none" stroke="#5a7d42" strokeWidth={0.6} />
      <circle cx="17" cy="9" r="4.2" fill="#9cbf72" {...line} />
      <path d="M13.4 7c1-3 5-4 7.4-2-1 1-3 2-7.4 2Z" fill="#d23a30" {...line} strokeWidth={0.5} />
      <path d="M13 9.4 6.4 10l6.8 1.2Z" fill="#5a5048" {...line} strokeWidth={0.5} />
      <path d="M13.6 10.6c1 1.6 2.6 1.8 3.6 1" fill="none" stroke="#2c2f33" strokeWidth={1} />
      <circle cx="15.6" cy="8.6" r="0.9" fill="#f3efe2" />
      <circle cx="15.6" cy="8.6" r="0.45" fill="#2b2622" />
      <path d="M21 28 23.6 26M21 22l2.6-1.4" stroke="#6b5036" strokeWidth={0.7} />
    </>
  ),
  newt: () => (
    <>
      <path
        d="M16 4c2 0 3 2 3 4 0 1-.4 2-1 3 1 2 1.4 5 1 8-.4 3-1.6 5-1.4 7 .2 2 2 3 4 4-3 0-5-1-6-3-1-2-.6-5-1-8-.4-3-1-6 0-8-.6-1-1-2-1-3 0-2 1-4 2.4-4Z"
        fill="#5a4a38"
        {...line}
      />
      <path d="M16 11v15" stroke="#3b3024" strokeWidth={1.2} strokeDasharray="1.2 0.8" />
      <path
        d="M14 12 9 10M18 12l5-2M14.6 20l-5 3M17.6 20l5 3"
        fill="none"
        {...line}
        stroke="#5a4a38"
        strokeWidth={1.4}
      />
      {[
        [15, 14],
        [17, 16],
        [15.4, 18.4],
        [17, 21],
        [15, 9],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="#f0a23c" />
      ))}
      <circle cx="14.6" cy="6" r="0.6" fill="#e7d9a8" />
      <circle cx="17.4" cy="6" r="0.6" fill="#e7d9a8" />
    </>
  ),
  snail: () => (
    <>
      {/* The Burgundy snail of the shower (§9.10): a cream body and a banded ochre shell. */}
      <path
        d="M4 25c2-2 5-3 9-3h10c3 0 5 1 6 3 0 1-1 2-3 2H6c-2 0-3-1-2-2Z"
        fill="#d8c8a8"
        {...line}
      />
      <path d="M6 22 4.4 16M8 22l-.4-6.4" fill="none" {...line} stroke="#b8a582" strokeWidth={1} />
      <circle cx="4.4" cy="15.6" r="0.9" fill="#5a4a38" />
      <circle cx="7.6" cy="15.4" r="0.9" fill="#5a4a38" />
      <circle cx="18" cy="16" r="8.4" fill="#c9954d" {...line} />
      <path
        d="M18 16c0-1.4 1.6-2 2.6-1 1.4 1.4.4 4-1.8 4.2-3 .3-4.8-2.6-3.8-5.2 1.2-3.2 5.4-4 8-1.8 3 2.6 2.4 7.6-1.2 9.4"
        fill="none"
        stroke="#7a5428"
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <path d="M12 12.4c2-2.6 6-3.4 9-1.8" fill="none" stroke="#e8c27f" strokeWidth={0.8} />
      {[
        [9, 27.6],
        [13, 28.2],
        [17, 28.4],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="0.5" fill="rgb(160 200 220 / 0.8)" />
      ))}
    </>
  ),
};
