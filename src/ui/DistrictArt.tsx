// The neighbouring districts on the map (docs/game-design.md §6.4): a grey block of the outskirts
// that turns green for good, each with its own character, and the next one on offer outlined in
// gold with its sprout pin. Drawn in each district's own 182 × 124 box.
import { memo } from 'react';
import type { DistrictId } from '../game/districts';
import { t } from '../i18n';
import { DISTRICT_PLACES } from './districtMap';
import { Appear } from './Neighbourhood';
import { centre } from './neighbourhood';
import './districts.css';

const W = 182;
const H = 124;

function Tree({
  x,
  y,
  r = 7,
  blossom = false,
}: {
  x: number;
  y: number;
  r?: number;
  blossom?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="d-tree-shadow" cx={1.5} cy={2} r={r} />
      <circle className="d-tree" r={r} />
      <circle className="d-tree-light" cx={-r * 0.3} cy={-r * 0.3} r={r * 0.45} />
      {blossom && <circle className="d-fruit" cx={r * 0.35} cy={r * 0.1} r={r * 0.2} />}
    </g>
  );
}

/** Water gardens: three pools edged with reeds, stepping-stone paths between them. */
function Tanneries() {
  const pools: [number, number, number, number][] = [
    [34, 36, 26, 18],
    [96, 44, 34, 22],
    [62, 92, 40, 16],
    [148, 90, 20, 18],
  ];
  return (
    <>
      <path className="d-path" d="M8 64C40 60 60 70 92 68S150 56 176 64" />
      {pools.map(([x, y, rx, ry]) => (
        <g key={`${x},${y}`}>
          <ellipse className="d-water" cx={x} cy={y} rx={rx} ry={ry} />
          <ellipse
            className="d-water-light"
            cx={x - rx * 0.3}
            cy={y - ry * 0.3}
            rx={rx * 0.4}
            ry={ry * 0.25}
          />
          {[-0.8, -0.3, 0.4, 0.9].map((a) => (
            <path
              key={a}
              className="d-reed"
              d={`M${x + Math.cos(a * 3) * rx} ${y + Math.sin(a * 3) * ry}v-5`}
            />
          ))}
        </g>
      ))}
      <Tree x={160} y={30} r={9} />
      <Tree x={14} y={108} r={8} />
    </>
  );
}

/** Linear forest: the old tracks kept as paths through rows of trees. */
function Railyard() {
  return (
    <>
      {[30, 62, 94].map((y) => (
        <g key={y}>
          <path className="d-rail" d={`M4 ${y}H178`} />
          {Array.from({ length: 9 }, (_, i) => (
            <Tree key={i} x={14 + i * 20} y={y + (i % 2 ? 12 : -12)} r={7 + (i % 3)} />
          ))}
        </g>
      ))}
    </>
  );
}

/** Orchard: rows of fruit trees where the car park and the mall were. */
function Mall() {
  return (
    <>
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => (
          <Tree
            key={`${row},${col}`}
            x={18 + col * 24 + (row % 2) * 12}
            y={18 + row * 28}
            r={8}
            blossom
          />
        )),
      )}
    </>
  );
}

/** Farmers' halls: two long halls with striped awnings, stalls between them. */
function ParkAndRide() {
  return (
    <>
      {[16, 74].map((y) => (
        <g key={y}>
          <rect className="d-hall-shadow" x={12} y={y + 3} width={158} height={34} rx={4} />
          <rect className="d-hall" x={12} y={y} width={158} height={34} rx={4} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect
              key={i}
              className="d-awning"
              x={16 + i * 17.4}
              y={y + 2}
              width={8.7}
              height={30}
            />
          ))}
        </g>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} className="d-stall" x={20 + i * 26} y={56} width={14} height={9} rx={2} />
      ))}
    </>
  );
}

/** Hillside park: the old loops of the interchange become paths across the lawn. */
function Interchange() {
  return (
    <>
      <circle className="d-path-loop" cx={56} cy={62} r={36} />
      <circle className="d-path-loop" cx={126} cy={62} r={36} />
      <path className="d-path" d="M0 62H182" />
      <circle className="d-lawn" cx={56} cy={62} r={24} />
      <circle className="d-lawn" cx={126} cy={62} r={24} />
      <Tree x={56} y={62} r={11} />
      <Tree x={126} y={62} r={10} blossom />
      <Tree x={20} y={16} />
      <Tree x={162} y={108} />
      <Tree x={91} y={18} r={6} />
      <Tree x={91} y={106} r={6} />
    </>
  );
}

/** Third place: a planted plaza ringed by trees, the office blocks under green roofs. */
function Offices() {
  const roofs: [number, number][] = [
    [10, 10],
    [124, 10],
    [10, 80],
    [124, 80],
  ];
  return (
    <>
      {roofs.map(([x, y]) => (
        <g key={`${x},${y}`}>
          <rect className="d-roof-shadow" x={x + 2} y={y + 3} width={48} height={34} rx={3} />
          <rect className="d-green-roof" x={x} y={y} width={48} height={34} rx={3} />
          <rect className="d-roof-bed" x={x + 6} y={y + 6} width={36} height={22} rx={2} />
        </g>
      ))}
      <circle className="d-plaza" cx={91} cy={62} r={30} />
      <circle className="d-lawn" cx={91} cy={62} r={12} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Tree key={i} x={91 + Math.cos(a) * 24} y={62 + Math.sin(a) * 24} r={5} />;
      })}
    </>
  );
}

/** Solar workshops: sheds roofed with panels and planted strips. */
function IndustrialZone() {
  return (
    <>
      {[
        [10, 10],
        [96, 10],
        [10, 68],
        [96, 68],
      ].map(([x, y]) => (
        <g key={`${x},${y}`}>
          <rect className="d-roof-shadow" x={x! + 2} y={y! + 3} width={76} height={46} rx={3} />
          <rect className="d-shed" x={x} y={y} width={76} height={46} rx={3} />
          {Array.from({ length: 3 }, (_, i) => (
            <rect
              key={i}
              className="d-panel"
              x={x! + 5}
              y={y! + 5 + i * 13}
              width={46}
              height={9}
              rx={1}
            />
          ))}
          <rect className="d-green-roof" x={x! + 55} y={y! + 5} width={16} height={36} rx={2} />
        </g>
      ))}
    </>
  );
}

/** Living towers: towers with planted terraces, one old chimney wrapped in climbers. */
function Chimneys() {
  const towers: [number, number, number][] = [
    [40, 40, 30],
    [130, 36, 26],
    [86, 92, 24],
  ];
  return (
    <>
      {towers.map(([x, y, s]) => (
        <g key={`${x},${y}`}>
          <rect
            className="d-roof-shadow"
            x={x - s + 3}
            y={y - s + 4}
            width={s * 2}
            height={s * 2}
            rx={4}
          />
          {[s, s * 0.72, s * 0.44].map((size, i) => (
            <rect
              key={i}
              className={i % 2 ? 'd-terrace' : 'd-green-roof'}
              x={x - size}
              y={y - size}
              width={size * 2}
              height={size * 2}
              rx={3}
            />
          ))}
        </g>
      ))}
      <circle className="d-chimney" cx={156} cy={96} r={9} />
      <circle className="d-climber" cx={156} cy={96} r={9} />
      <Tree x={20} y={104} r={7} />
    </>
  );
}

const ART: Record<DistrictId, () => React.JSX.Element> = {
  tanneries: Tanneries,
  railyard: Railyard,
  mall: Mall,
  parkAndRide: ParkAndRide,
  interchange: Interchange,
  offices: Offices,
  industrialZone: IndustrialZone,
  chimneys: Chimneys,
};

/** The districts restored for good, each greening its block of the outskirts. */
export const DistrictGround = memo(function DistrictGround({
  districts,
}: {
  districts: readonly DistrictId[];
}) {
  return (
    <g className="districts" aria-hidden="true">
      {districts.map((id) => {
        const box = DISTRICT_PLACES[id];
        const [x, y] = box;
        const Art = ART[id];
        return (
          <Appear key={id} at={centre(box)} size={70}>
            <g className="district" data-district={id} transform={`translate(${x} ${y})`}>
              <title>{t.restoration.districtNames[id]}</title>
              <rect className="d-ground" width={W} height={H} rx={6} />
              <Art />
            </g>
          </Appear>
        );
      })}
    </g>
  );
});

/** The district on offer: a golden outline that breathes and a sprout pin to restore it. */
export const DistrictOffer = memo(function DistrictOffer({
  id,
  ready,
  onRestore,
}: {
  id: DistrictId | null;
  ready: boolean;
  onRestore: (id: DistrictId) => void;
}) {
  if (id === null) return null;
  const box = DISTRICT_PLACES[id];
  const [x, y, w, h] = box;
  const [px, py] = centre(box);
  return (
    <g className="offers" aria-hidden="true">
      <g className="offer" data-offer={id} data-ready={ready}>
        <rect x={x} y={y} width={w} height={h} rx="6" className="offer-outline" />
        <g
          className="pin district-pin"
          onClick={ready ? () => onRestore(id) : undefined}
          transform={`translate(${px} ${py}) scale(2)`}
        >
          <circle r="7" className="pin-halo" />
          <circle r="4.6" className="pin-disc" />
          <path
            d="M0 2.4 V-0.6 M0 0.4 C-2 0.2 -2.6 -1.2 -2.6 -2.4 C-1 -2.4 0 -1.4 0 0.4 M0 -0.6 C1.6 -0.8 2.4 -1.8 2.4 -2.8 C1 -2.8 0 -2 0 -0.6"
            className="pin-sprout"
          />
        </g>
      </g>
    </g>
  );
});
