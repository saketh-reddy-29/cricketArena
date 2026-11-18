/**
 * Single source of truth for the 2D field-map -> 3D world mapping and ground dimensions.
 *
 * The 2D map (600 x 600 px, centre 300,300) puts the batting crease at y=190 and the bowling crease
 * at y=410 (220 px for the 17.68 m between popping creases) => 12.44 px per metre near the pitch.
 * The 2D boundary is 268 px from the centre; in 3D it is a full-size 66 m. Between the two the map
 * stretches radially, so the pitch area is true scale while the outfield is a proper big ground.
 *
 * World axes: +z is the striker's end (batter's stumps at z = +PITCH_HALF), -z the bowler's end.
 * +x is the OFF side of a right-handed striker (his right when he faces the bowler at -z). The 2D map is drawn
 * from behind the bowler, where a right-hander's off side is on the left, so 2D x is mirrored into world x.
 */
export const PITCH_HALF = 10.06;          // stumps to centre (20.12 m pitch)
export const CREASE_Z = 8.84;             // popping crease = stumps - 1.22 m
export const BOUNDARY_M = 66;             // rope radius (m)
export const OUTFIELD_M = 74;             // grass radius (m)
export const PX_PER_M = 12.44;
export const BOUNDARY_PX = 268;
// The inner zone up to 175 px (~27.5m, representing the 30-yard circle, pitch, and slip cordon)
// stays at true cricket scale (12.44 px/m) so wicketkeeper, slips, and ring fielders occupy
// authentic cricketing positions without being blown into the deep outfield.
const NEAR_PX = 175;
const NEAR_M = NEAR_PX / PX_PER_M;
const FAR_SLOPE = (BOUNDARY_M - NEAR_M) / (BOUNDARY_PX - NEAR_PX);

export function radiusToMetres(rPx: number): number {
  return rPx <= NEAR_PX ? rPx / PX_PER_M : NEAR_M + (rPx - NEAR_PX) * FAR_SLOPE;
}

export function toWorld(point: { x: number; y: number }): [number, number] {
  const dx = point.x - 300;
  const dz = 300 - point.y;
  const r = Math.hypot(dx, dz);
  if (r < 1e-6) return [0, 0];
  const k = radiusToMetres(r) / r;
  return [-dx * k, dz * k];
}
