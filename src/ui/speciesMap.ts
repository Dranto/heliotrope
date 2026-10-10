// Where the species of the Herbier live on the top-down map (docs/game-design.md §9.5): near the
// parcel, building or project that brought them back. Pure data in world coordinates.
import type { SpeciesId } from '../game/species';
import { STREETS } from './neighbourhood';

const [NORTH, SOUTH] = STREETS.horizontal;
const [WEST, EAST] = STREETS.vertical;
const MID = STREETS.width / 2;

/** How a species moves: still on the ground, hopping, buzzing about, or flying across. */
export type SpeciesMotion = 'still' | 'hop' | 'buzz' | 'fly' | 'glow';

export interface SpeciesPlace {
  /** Each spot shows one individual. */
  spots: readonly [number, number][];
  motion: SpeciesMotion;
  /** Size of one individual in world units. */
  size: number;
}

export const SPECIES_PLACES: Record<SpeciesId, SpeciesPlace> = {
  // The garden street in front of home.
  poppy: {
    spots: [
      [246, NORTH + 5],
      [262, NORTH + 17],
      [372, NORTH + 6],
    ],
    motion: 'still',
    size: 14,
  },
  bee: {
    spots: [
      [296, 192],
      [338, 270],
    ],
    motion: 'buzz',
    size: 11,
  },
  // The rain gardens of the street behind home.
  fern: {
    spots: [
      [252, SOUTH + 6],
      [356, SOUTH + 15],
    ],
    motion: 'still',
    size: 18,
  },
  ladybird: { spots: [[236, 266]], motion: 'still', size: 9 },
  // The pollinator corridor.
  bumblebee: {
    spots: [
      [WEST + MID, 88],
      [WEST + MID, 392],
    ],
    motion: 'buzz',
    size: 12,
  },
  sparrow: {
    spots: [
      [284, 250],
      [292, 254],
    ],
    motion: 'hop',
    size: 12,
  },
  blueTit: {
    spots: [
      [150, NORTH + 6],
      [470, SOUTH + 4],
    ],
    motion: 'hop',
    size: 12,
  },
  brimstone: { spots: [[WEST + MID, 220]], motion: 'fly', size: 14 },
  // The river reborn.
  frog: {
    spots: [
      [EAST + MID, 118],
      [EAST + MID, 352],
    ],
    motion: 'still',
    size: 13,
  },
  // The car park turned park, and the warehouse orchard.
  hedgehog: { spots: [[548, 268]], motion: 'hop', size: 16 },
  robin: { spots: [[64, 420]], motion: 'hop', size: 13 },
  // Swifts and bats fly high over the roofs.
  swift: {
    spots: [
      [120, 58],
      [470, 84],
    ],
    motion: 'fly',
    size: 18,
  },
  glowWorm: {
    spots: [
      [326, SOUTH + MID],
      [300, NORTH + MID],
    ],
    motion: 'glow',
    size: 11,
  },
  bat: { spots: [[452, 36]], motion: 'fly', size: 18 },
  kingfisher: { spots: [[EAST + MID, 214]], motion: 'still', size: 16 },
  orchid: { spots: [[518, 198]], motion: 'still', size: 16 },
  stagBeetle: { spots: [[150, 414]], motion: 'still', size: 14 },
  owl: { spots: [[566, 118]], motion: 'still', size: 18 },
};
