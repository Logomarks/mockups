import type { Mockup } from '../types.js';
import type { VinylOptions } from './vinyl.js';

/** Each object's options, by name. */
export interface ObjectOptions {
	vinyl: VinylOptions;
}
/** The objects' names. */
export type ObjectName = keyof ObjectOptions;

/** The objects, by name. */
export const OBJECTS: Readonly<{ [K in ObjectName]: (options: ObjectOptions[K]) => Mockup }>;
/** A mockup by the object's name. Throws a TypeError for an unknown name. */
export function mockup<K extends ObjectName>(name: K, options: ObjectOptions[K]): Mockup;
