/**
 * @module @arraypress/mockups/three/loop
 *
 * Frames for a scene that moves (a camera drifting, a live screen): drawn
 * at a steady rate, only while the canvas is on screen and the page is
 * shown, and not at all for a reader who asks for reduced motion (the
 * scene keeps its one still frame).
 */

/**
 * Whether the reader asks for reduced motion.
 *
 * @returns {boolean} True when they do (false outside a browser).
 */
export function reducedMotion() {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Draws frames until stopped.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas (watched, when it's in a page, so frames stop off screen).
 * @param {(t: number) => void} frame Draws the frame at `t` seconds since the loop began.
 * @param {{ fps?: number }} [o] Frames a second (30).
 * @returns {{ stop: () => void }} How to stop it.
 */
export function loop(canvas, frame, { fps = 30 } = {}) {
	const page = typeof document === 'object' && typeof requestAnimationFrame === 'function';
	if (!page || reducedMotion()) return { stop() {} };
	const gap = 1000 / Math.max(1, fps) - 2;
	const t0 = performance.now();
	let raf = 0;
	let last = -Infinity;
	let visible = true;
	const tick = (now) => {
		raf = 0;
		if (!visible || document.hidden) return;
		raf = requestAnimationFrame(tick);
		if (now - last < gap) return;
		last = now;
		frame((now - t0) / 1000);
	};
	const go = () => {
		if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
	};
	const watch = typeof IntersectionObserver === 'function' && 'isConnected' in canvas ? new IntersectionObserver(([e]) => ((visible = e.isIntersecting), go())) : null;
	watch?.observe(/** @type {HTMLCanvasElement} */ (canvas));
	document.addEventListener('visibilitychange', go);
	go();
	return {
		stop() {
			cancelAnimationFrame(raf);
			raf = 0;
			watch?.disconnect();
			document.removeEventListener('visibilitychange', go);
		},
	};
}

/**
 * The view a drifting camera has at a moment: a slow wander round the view it was given, never repeating exactly.
 *
 * @param {import('./view.js').View} view The view it wanders round.
 * @param {number} t Seconds.
 * @param {number} amount How far it wanders, 0–1 (1: a few degrees).
 * @returns {import('./view.js').View} The view now.
 */
export function drifted(view, t, amount) {
	return {
		...view,
		turn: (view.turn ?? 0) + amount * 4 * Math.sin(t * 0.21) + amount * 1.2 * Math.sin(t * 0.53 + 1),
		tilt: (view.tilt ?? 0) + amount * 2.5 * Math.sin(t * 0.17 + 2),
		distance: (view.distance ?? 1) * (1 + amount * 0.02 * Math.sin(t * 0.13 + 0.5)),
	};
}
