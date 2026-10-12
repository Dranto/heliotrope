// Where the decor of the neighbourhood can stand on the map (docs/game-design.md §6.5): spots
// in the home courtyard and on the avenues in front of and behind it. Pure data in world
// coordinates, next to the plan in neighbourhood.ts.
import { isDecorId, type DecorId, type FlowerColour } from '../game/decor';

export const DECOR_PLACES: readonly (readonly [number, number])[] = [
  // The four corners of the courtyard, around the beds.
  [265, 219],
  [357, 219],
  [265, 253],
  [357, 253],
  // The avenue in front of home, then the one behind it.
  [244, 161],
  [378, 161],
  [244, 311],
  [378, 311],
];

/** The decor set, as one string so the map only redraws when a spot changes. */
export function encodeDecor(slots: readonly (DecorId | null)[]): string {
  return slots.map((piece) => piece ?? '').join(',');
}

export function decodeDecor(encoded: string): (DecorId | null)[] {
  return encoded.split(',').map((piece) => (isDecorId(piece) ? piece : null));
}

/**
 * The three shades of the flower heads in each colour the player can choose (§6.5): light,
 * middle and deep stops of their gradient.
 */
export const COROLLAS: Record<FlowerColour, readonly (readonly [string, string, string])[]> = {
  lilac: [
    ['#E6DAF5', '#B79AD6', '#8E6CBB'],
    ['#D9C6F0', '#A486CB', '#7A58A8'],
    ['#F0E6FA', '#C6ADE2', '#9B7CC6'],
  ],
  gold: [
    ['#FBEBC0', '#F2C25E', '#D99A2B'],
    ['#F8E2A8', '#E9B44A', '#C98A22'],
    ['#FDF2D4', '#F5CF7A', '#DDA640'],
  ],
  rose: [
    ['#FADDE6', '#E89AB5', '#C76A8E'],
    ['#F6CFDC', '#DE88A6', '#B85A7E'],
    ['#FCE8EF', '#EEB0C6', '#D07C9C'],
  ],
  blue: [
    ['#DCE9F7', '#93B6E0', '#5F86C2'],
    ['#CFE0F4', '#82A8D8', '#5277B4'],
    ['#E8F0FA', '#A9C6E8', '#6E93CB'],
  ],
  white: [
    ['#FFFFFF', '#F1EDF4', '#D2C8DC'],
    ['#FDFCFB', '#EAE4EE', '#C8BED4'],
    ['#FFFFFF', '#F6F2F8', '#DCD3E4'],
  ],
  // M37: the colours of the families of Milestones complete.
  sunny: [
    ['#FFF3C4', '#FFD24D', '#F0A818'],
    ['#FFEDB0', '#FBC93A', '#E59A10'],
    ['#FFF7D6', '#FFDB70', '#F3B32E'],
  ],
  moss: [
    ['#E4F0D4', '#A9CB86', '#6F9A4E'],
    ['#DAEBC6', '#9BC176', '#628D43'],
    ['#EDF5E2', '#BBD69C', '#80A85D'],
  ],
  saffron: [
    ['#FCE3C8', '#F3A65C', '#D9762A'],
    ['#FAD9B6', '#EE9848', '#CC6A20'],
    ['#FDEBD8', '#F6B676', '#E08638'],
  ],
  coral: [
    ['#FDDCD4', '#F49A86', '#DC6650'],
    ['#FBD0C5', '#EF8A74', '#D05944'],
    ['#FEE6E0', '#F7AE9D', '#E2775F'],
  ],
  indigo: [
    ['#DCDCF5', '#8F8FD6', '#5A58B0'],
    ['#D0D0F0', '#7F7ECB', '#4C4AA2'],
    ['#E6E6F8', '#A3A2DF', '#6866BC'],
  ],
  meadow: [
    ['#E6DAF5', '#B79AD6', '#8E6CBB'],
    ['#FBEBC0', '#F2C25E', '#D99A2B'],
    ['#FADDE6', '#E89AB5', '#C76A8E'],
  ],
  autumn: [
    ['#F6DCC6', '#D98A55', '#A9552C'],
    ['#F2D0B4', '#CF7C46', '#9C4A24'],
    ['#F9E4D2', '#E09C6A', '#B66336'],
  ],
  stream: [
    ['#D6F0EE', '#7CC6C0', '#3E918C'],
    ['#C8EAE7', '#6CBAB4', '#35837E'],
    ['#E2F5F3', '#93D2CC', '#4E9F99'],
  ],
};
