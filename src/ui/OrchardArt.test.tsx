import { render } from '@testing-library/react';
import { OrchardLayer } from './OrchardArt';
import { HIVE_SPOTS, MEADOW, MOWN_HALF_WIDTH, ORCHARD_PLACE, TREE_SPOTS } from './orchardMap';

const [X, Y, W, H] = ORCHARD_PLACE;

function draw(orchard: string) {
  const { container } = render(
    <svg>
      <OrchardLayer orchard={orchard} open onPick={() => {}} />
    </svg>,
  );
  return container;
}

/** The base point of every grass tuft, from its middle blade. */
function tuftBases(): [number, number][] {
  return [...MEADOW.tufts.matchAll(/M([\d.]+) ([\d.]+)v/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
}

describe('the orchard ground', () => {
  it('is a meadow inside a hedge, with wildflowers', () => {
    const svg = draw('none,none,none,none;0');
    expect(svg.querySelectorAll('.orchard-hedge')).toHaveLength(2);
    expect(svg.querySelector('.orchard-tufts')?.getAttribute('d')).toBe(MEADOW.tufts);
    expect(tuftBases().length).toBeGreaterThan(60);
    expect(svg.querySelectorAll('.orchard-flower').length).toBe(MEADOW.flowers.length);
    expect(new Set(MEADOW.flowers.map(([, , tint]) => tint))).toEqual(new Set([0, 1, 2]));
  });

  it('keeps the grass inside the block and off the mown paths of the trees and hives', () => {
    const treeRow = Object.values(TREE_SPOTS)[0]![1];
    const hiveRow = HIVE_SPOTS[0]![1] + 2;
    for (const [x, y] of tuftBases()) {
      expect(x).toBeGreaterThanOrEqual(X + 9);
      expect(x).toBeLessThanOrEqual(X + W - 9);
      expect(y).toBeGreaterThan(Y);
      expect(y).toBeLessThan(Y + H);
      expect(Math.abs(y - treeRow)).toBeGreaterThanOrEqual(MOWN_HALF_WIDTH);
      expect(Math.abs(y - hiveRow)).toBeGreaterThanOrEqual(MOWN_HALF_WIDTH);
    }
  });

  it('readies each empty spot with a mulched planting hole and a tied stake', () => {
    const svg = draw('none,sapling,none,none;0');
    const pits = svg.querySelectorAll('.orchard-pit');
    expect(pits).toHaveLength(3);
    for (const pit of pits) {
      for (const part of [
        '.orchard-mulch',
        '.orchard-straw',
        '.orchard-soil',
        '.orchard-stake',
        '.orchard-tie',
      ]) {
        expect(pit.querySelector(part)).not.toBeNull();
      }
    }
  });
});

describe('the orchard trees', () => {
  it('give a grown tree a lobed crown in shade, leaf and sun above a flared trunk', () => {
    const svg = draw('flowering,fruiting,ripe,sapling;0');
    for (const id of ['apple', 'pear', 'cherry']) {
      const tree = svg.querySelector(`[data-tree="${id}"] .orchard-tree`)!;
      const crown = tree.querySelector('.orchard-crown')!;
      const lobes = crown.querySelectorAll('.leaf').length;
      expect(lobes).toBeGreaterThan(4);
      expect(crown.querySelectorAll('.shade')).toHaveLength(lobes);
      expect(crown.querySelectorAll('.lit')).toHaveLength(lobes);
      expect(tree.querySelector('.orchard-trunk-flare')).not.toBeNull();
    }
  });

  it('plant a sapling in mulch, tied to its stake, with a few leaf clusters', () => {
    const sapling = draw('sapling,none,none,none;0').querySelector('.orchard-sapling')!;
    expect(sapling.querySelector('.orchard-mulch')).not.toBeNull();
    expect(sapling.querySelector('.orchard-tie')).not.toBeNull();
    expect(sapling.querySelectorAll('.orchard-crown .leaf').length).toBeGreaterThan(1);
  });
});

describe('the orchard hives', () => {
  it('stand two boxes under a gabled lid, with winged bees around them', () => {
    const svg = draw('none,none,none,none;2');
    const hives = svg.querySelectorAll('.orchard-hive');
    expect(hives).toHaveLength(2);
    for (const hive of hives) {
      expect(hive.querySelectorAll('.orchard-hive-box')).toHaveLength(2);
      expect(hive.querySelector('.orchard-hive-stand')).not.toBeNull();
      expect(hive.querySelector('.orchard-hive-board')).not.toBeNull();
      const bees = hive.querySelectorAll('.orchard-bee');
      expect(bees.length).toBeGreaterThan(1);
      for (const bee of bees) expect(bee.querySelectorAll('.orchard-bee-wing')).toHaveLength(2);
    }
  });
});
