// Where the alliances' golden threads run on the map (docs/game-design.md §9.9, M24), between the
// two places each alliance links, and where the grand bloom's flowers open. Pure data in world
// coordinates.
import type { AllianceId } from '../game/alliances';
import { DISTRICT_PLACES } from './districtMap';
import { centre, type Box } from './neighbourhood';
import { ORCHARD_PLACE } from './orchardMap';
import { WORK_PLACES } from './greatWorksMap';

type Point = [number, number];

const COURTYARD: Point = [311, 236];
const at = (box: Box): Point => centre(box);

export const THREADS: Record<AllianceId, [Point, Point]> = {
  orchardBees: [at(ORCHARD_PLACE), COURTYARD],
  tramMarket: [[300, -11], at(DISTRICT_PLACES.railyard)],
  nourishingRiver: [
    [415, 300],
    [1120, -200],
  ],
  travellingSeeds: [COURTYARD, [-620, 225]],
  villageFeast: [at(WORK_PLACES.hall), COURTYARD],
  deepRoots: [COURTYARD, [415, 720]],
};

/** A gentle curve between the two ends, bowed to one side. */
export function threadPath([[x1, y1], [x2, y2]]: [Point, Point]): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const bow = 0.18;
  const cx = mx - (y2 - y1) * bow;
  const cy = my + (x2 - x1) * bow;
  return `M${x1} ${y1}Q${Math.round(cx)} ${Math.round(cy)} ${x2} ${y2}`;
}

export interface BloomFlower {
  x: number;
  y: number;
  r: number;
  colour: number;
  /** Order of opening, from the city outwards, from 0 to 1. */
  delay: number;
}

/** The flowers of the grand bloom: scattered from the city to the hills, the nearest first. */
export const BLOOM_FLOWERS: BloomFlower[] = (() => {
  const flowers: BloomFlower[] = [];
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 220; i++) {
    const x = Math.round(-700 + next() * 2000);
    const y = Math.round(-540 + next() * 1530);
    const distance = Math.hypot(x - COURTYARD[0], y - COURTYARD[1]);
    flowers.push({
      x,
      y,
      r: Math.round(10 + next() * 10),
      colour: Math.floor(next() * 4),
      delay: Math.min(1, distance / 1100),
    });
  }
  return flowers;
})();
