import type { Finish } from './light.js';

/** A device shell: its colour and how it takes light. */
export interface Body {
	readonly color: string;
	readonly finish: Finish;
}
/** The named shells. */
export type BodyName = 'graphite' | 'silver' | 'white' | 'black';

/** The named shells. */
export const BODIES: Readonly<Record<BodyName, Body>>;
/** A shell from a name or a hex colour (painted metal). Throws a TypeError for anything else. */
export function resolveBody(v: unknown, object?: string): Body;
