// A hook between the photo mode (photo.ts) and the WebGL map, which is downloaded apart: the map
// registers how to draw its canvas right now, so the picture is read before the frame is cleared.
export const mapPicture: { renderNow: (() => void) | null } = { renderNow: null };
