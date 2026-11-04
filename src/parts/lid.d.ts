/** Where the lid is for an amount of opening: a mailer's hinge angle (degrees); a lid box's lift and slide (mm) and tilt (degrees). */
export function lidPose(kind: 'mailer' | 'lid', open: number): { hinge: number; lift: number; tilt: number; slide: number };
/** How open (0–1), from a boolean or a number 0–1; throws a TypeError naming `object` for anything else. */
export function openAmount(v: unknown, object: string): number;
