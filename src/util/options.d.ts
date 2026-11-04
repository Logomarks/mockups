/** A number option, or its default. Throws a TypeError naming the object and option when it isn't a finite number. */
export function num(object: string, v: unknown, fallback: number, name: string): number;
/** One of a few names, or its default. Throws a TypeError when it isn't one of them. */
export function oneOf<T extends string>(object: string, name: string, v: unknown, names: readonly T[], fallback: T): T;
/** A view: a named one, or `{ tilt, turn }` (each defaulting to the default view's). Throws a TypeError for an unknown name or a bad angle. */
export function viewOf(object: string, v: unknown, named: Readonly<Record<string, Readonly<{ tilt: number; turn: number }>>>, fallback: string): { tilt: number; turn: number };
