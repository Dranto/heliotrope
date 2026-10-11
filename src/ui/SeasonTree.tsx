import { useState, type CSSProperties } from 'react';
import { formatNumber } from '../game/format';
import {
  availableSeeds,
  CANOPY_LIST,
  canopyLevels,
  canRaiseCanopy,
  isCanopyOpen,
  nextCanopyCost,
  raiseCanopy,
  canLearnTalent,
  hasTalent,
  isTalentReachable,
  learnTalent,
  TALENT_BRANCHES,
  TALENT_LIST,
  TALENTS,
  type CanopyId,
  type TalentDef,
  type TalentId,
} from '../game/talents';
import type { GameState } from '../game/state';
import { t } from '../i18n';
import { canopyEffectText, canopyName, talentEffectText, talentName } from '../i18n/talents';
import { Dialog } from './Dialog';
import {
  BRANCH_ORIGINS,
  GROUND_Y,
  TALENT_SPOTS,
  TREE_VIEW,
  canopyLeafSpots,
  talentBranch,
  treeGrowth,
} from './seasonTree';
import { useGameState, useGameStore } from './useGame';
import './tree.css';

type NodeState = 'learnt' | 'ready' | 'reachable' | 'locked';

function nodeState(state: GameState, id: TalentId): NodeState {
  if (hasTalent(state, id)) return 'learnt';
  if (canLearnTalent(state, id)) return 'ready';
  if (isTalentReachable(state, id)) return 'reachable';
  return 'locked';
}

/** Soft masses of the canopy: x, y, radii, and a tone (1 deeper, 2 lighter). */
const FOLIAGE: [number, number, number, number, 1 | 2][] = [
  [92, 84, 84, 62, 1],
  [266, 74, 88, 60, 1],
  [180, 60, 72, 50, 1],
  [60, 52, 46, 34, 2],
  [138, 34, 52, 30, 2],
  [228, 30, 56, 28, 2],
  [312, 44, 44, 32, 2],
  [150, 112, 48, 30, 2],
  [222, 110, 50, 30, 2],
];

/** Tufts of grass along the soil line. */
const GRASS = [14, 38, 70, 104, 136, 226, 256, 290, 318, 344];

/**
 * The trunk, `width` wide at the base: it flares into the soil, narrows, then forks into the
 * two branches of the canopy.
 */
function trunkPath(width: number): string {
  const [lx, ly] = BRANCH_ORIGINS.pollinators;
  const [rx, ry] = BRANCH_ORIGINS.memory;
  const w = width;
  const neck = w * 0.55;
  return [
    `M${180 - w - 10} ${GROUND_Y + 8}`,
    `C${180 - w - 2} ${GROUND_Y + 2} ${180 - neck} ${GROUND_Y - 8} ${180 - neck} ${GROUND_Y - 24}`,
    `C${180 - neck} ${ly + 30} ${lx - 2} ${ly + 14} ${lx - 8} ${ly - 2}`,
    `Q180 ${ly + 10} ${rx + 8} ${ry - 2}`,
    `C${rx + 2} ${ry + 14} ${180 + neck} ${ry + 30} ${180 + neck} ${GROUND_Y - 24}`,
    `C${180 + neck} ${GROUND_Y - 8} ${180 + w + 2} ${GROUND_Y + 2} ${180 + w + 10} ${GROUND_Y + 8}`,
    'Z',
  ].join(' ');
}

/** Five petals for a learnt talent, a closed bud otherwise. */
function Blossom({ x, y, open }: { x: number; y: number; open: boolean }) {
  if (!open) return <circle className="tree-bud" cx={x} cy={y} r="5" />;
  return (
    <g className="tree-blossom" transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          className="petal"
          cx="0"
          cy="-6"
          rx="4"
          ry="6.5"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle className="heart" r="3.4" />
    </g>
  );
}

/**
 * The drawing: a trunk rising from the soil, roots for the Racines under it, and a canopy shared
 * by the Pollinisateurs (left) and the Mémoire (right). The trunk thickens and the foliage fills
 * in as talents are learnt; a newly learnt one sends a golden sap along its branch, then opens.
 */
function TreeArt({ state, fresh }: { state: GameState; fresh: ReadonlySet<TalentId> }) {
  const growth = treeGrowth(state.talents);
  const trunk = 8 + growth * 8;
  const { width, height } = TREE_VIEW;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="tree-art"
      aria-hidden="true"
      style={{ '--growth': growth } as CSSProperties}
    >
      <defs>
        <radialGradient id="tree-sun" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#F6D58F" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FBF6EC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tree-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9C7A6" />
          <stop offset="100%" stopColor="#B99C74" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width={width} height={GROUND_Y} fill="url(#tree-sun)" />
      <path
        className="tree-soil"
        d={`M0 ${GROUND_Y} Q180 ${GROUND_Y - 8} 360 ${GROUND_Y} V330 H0Z`}
      />
      <g className="tree-foliage">
        {FOLIAGE.map(([cx, cy, rx, ry, tone], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} data-tone={tone} />
        ))}
      </g>
      <path className="tree-trunk" d={trunkPath(trunk)} />
      <path className="tree-bark" d="M178 200c-2-14 1-30-3-46M184 196c1-12-1-22 2-34" />
      <g className="tree-grass">
        {GRASS.map((x) => (
          <path key={x} d={`M${x} ${GROUND_Y + 1}q1-5 3-7M${x + 4} ${GROUND_Y + 1}q0-4-2-6`} />
        ))}
      </g>
      <g className="tree-canopy-leaves">
        {canopyLeafSpots(canopyLevels(state)).map(([x, y, angle], i) => (
          <ellipse key={i} cx={x} cy={y} rx="7" ry="3.2" transform={`rotate(${angle} ${x} ${y})`} />
        ))}
      </g>
      {TALENT_LIST.map(({ id, branch }) => (
        <path
          key={id}
          className={`tree-branch${fresh.has(id) ? ' fresh' : ''}`}
          data-branch={branch}
          data-state={nodeState(state, id)}
          d={talentBranch(id)}
          pathLength={1}
        />
      ))}
      {TALENT_LIST.map(({ id, branch }) => {
        const [x, y] = TALENT_SPOTS[id];
        return (
          <g
            key={id}
            className={`tree-node${fresh.has(id) ? ' fresh' : ''}`}
            data-branch={branch}
            data-state={nodeState(state, id)}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <Blossom x={x} y={y} open={hasTalent(state, id)} />
          </g>
        );
      })}
    </svg>
  );
}

function Detail({
  talent,
  state,
  onLearn,
}: {
  talent: TalentDef;
  state: GameState;
  onLearn: () => void;
}) {
  const name = talentName(talent);
  const cost = t.tree.cost(talent.cost);
  const status = nodeState(state, talent.id);
  return (
    <div className="tree-detail" data-branch={talent.branch} aria-live="polite">
      <div>
        <span className="tree-branch-tag">{t.tree.branches[talent.branch]}</span>
        <h3>{name}</h3>
        <p className="tree-effect">{talentEffectText(talent)}</p>
      </div>
      {status === 'learnt' ? (
        <span className="tree-learnt-tag">{t.tree.learntTag}</span>
      ) : status === 'locked' && talent.parent ? (
        <span className="tree-locked-tag">
          {t.tree.lockedTag(talentName(TALENTS[talent.parent]))}
        </span>
      ) : (
        <button
          type="button"
          className="buy tree-learn"
          disabled={status !== 'ready'}
          aria-label={t.tree.learnLabel(name, cost)}
          onClick={onLearn}
        >
          <span className="buy-verb">{t.tree.learn}</span>
          <span className="buy-cost">{cost}</span>
        </button>
      )}
    </div>
  );
}

/**
 * The Canopy (§7.1, M13): levelled talents above the crown, shown once the 17 talents are learnt;
 * before that, a line saying when it opens.
 */
function Canopy({ state, onRaise }: { state: GameState; onRaise: (id: CanopyId) => void }) {
  if (!isCanopyOpen(state)) {
    return <p className="hint canopy-locked">{t.tree.canopy.locked(TALENT_LIST.length)}</p>;
  }
  return (
    <section className="canopy" aria-labelledby="canopy-title">
      <h3 id="canopy-title">{t.tree.canopy.title}</h3>
      <p className="hint">{t.tree.canopy.hint}</p>
      <ul className="canopy-list">
        {CANOPY_LIST.map(({ id, maxLevel }) => {
          const level = state.canopy.levels[id];
          const cost = nextCanopyCost(state, id);
          const name = canopyName(id);
          return (
            <li key={id} className="canopy-item" data-canopy={id} data-level={level}>
              <div>
                <h4>{name}</h4>
                {maxLevel > 1 && (
                  <span className="canopy-level">
                    <span className="canopy-pips" aria-hidden="true">
                      {Array.from({ length: maxLevel }, (_, i) => (
                        <span key={i} data-on={i < level} />
                      ))}
                    </span>
                    {t.tree.canopy.level(level, maxLevel)}
                  </span>
                )}
                {level > 0 && maxLevel > 1 && (
                  <p className="tree-effect">{t.tree.canopy.now(canopyEffectText(id, level))}</p>
                )}
                {cost !== null && (
                  <p className="tree-effect">
                    {maxLevel > 1
                      ? t.tree.canopy.next(canopyEffectText(id, level + 1))
                      : canopyEffectText(id, 1)}
                  </p>
                )}
              </div>
              {cost === null ? (
                <span className="tree-learnt-tag">
                  {maxLevel > 1 ? t.tree.canopy.maxed : t.tree.learntTag}
                </span>
              ) : (
                <button
                  type="button"
                  className="buy tree-learn"
                  disabled={!canRaiseCanopy(state, id)}
                  aria-label={t.tree.canopy.raiseLabel(name, t.tree.cost(cost))}
                  onClick={() => onRaise(id)}
                >
                  <span className="buy-verb">{t.tree.learn}</span>
                  <span className="buy-cost">{t.tree.cost(cost)}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The Tree of Seasons screen (docs/game-design.md §7.1, §10.2): spend Seeds on talents. */
export function SeasonTree({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const state = useGameState();
  // Talents learnt while the screen is open play their entrance; the others are simply there.
  const [known] = useState(() => new Set(state.talents));
  const fresh = new Set(state.talents.filter((id) => !known.has(id)));
  const [selectedId, setSelectedId] = useState<TalentId>(
    () =>
      (
        TALENT_LIST.find((talent) => canLearnTalent(state, talent.id)) ??
        TALENT_LIST.find((talent) => isTalentReachable(state, talent.id)) ??
        TALENT_LIST[0]!
      ).id,
  );
  const selected = TALENTS[selectedId];
  const seeds = availableSeeds(state);

  return (
    <Dialog
      title={t.tree.title}
      closeLabel={t.tree.close}
      onClose={onClose}
      className="tree-dialog"
    >
      <dl className="seed-tiles tree-tiles">
        <div className="seed-tile gain">
          <dt>{t.tree.available}</dt>
          <dd>
            <strong data-testid="seeds-available">{formatNumber(seeds)}</strong>
            <span>{t.tree.availableHint}</span>
          </dd>
        </div>
        <div className="seed-tile">
          <dt>{t.tree.learnt}</dt>
          <dd>
            <strong>
              {state.talents.length} / {TALENT_LIST.length}
            </strong>
            <span className="tree-legend">
              {TALENT_BRANCHES.map((branch) => (
                <span key={branch} data-branch={branch}>
                  {t.tree.branches[branch]}
                </span>
              ))}
            </span>
          </dd>
        </div>
      </dl>

      <div className="tree-stage" role="group" aria-label={t.tree.label}>
        <TreeArt state={state} fresh={fresh} />
        {TALENT_LIST.map((talent) => {
          const [x, y] = TALENT_SPOTS[talent.id];
          const status = nodeState(state, talent.id);
          return (
            <button
              key={talent.id}
              type="button"
              className="tree-spot"
              data-state={status}
              data-branch={talent.branch}
              aria-pressed={talent.id === selectedId}
              aria-label={t.tree.nodeLabel(talentName(talent), t.tree.state[status])}
              style={{
                left: `${(x / TREE_VIEW.width) * 100}%`,
                top: `${(y / TREE_VIEW.height) * 100}%`,
              }}
              onClick={() => setSelectedId(talent.id)}
            />
          );
        })}
      </div>

      {state.seeds === 0 && <p className="hint">{t.tree.noSeed}</p>}

      <Detail
        key={selected.id}
        talent={selected}
        state={state}
        onLearn={() => store.dispatch((s) => learnTalent(s, selected.id))}
      />

      <Canopy state={state} onRaise={(id) => store.dispatch((s) => raiseCanopy(s, id))} />
    </Dialog>
  );
}
