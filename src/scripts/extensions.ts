import { Main } from "./main";

// Signatures
declare global {

	interface Window {
		_instance: Main;
		addLoadEventListener: (listener: () => void) => void;
		isMobile: () => boolean;
	}

	interface HTMLCanvasElement {
		screenshot: () => void;
	}

	interface Math {
		clamp: (value: number, min: number, max: number) => number;
		toDegrees: (radians: number) => number;
		toRadians: (degrees: number) => number;
		maximumCommonDivisor: (a: number, b: number) => number;
		prettifyElapsedTime: (ms: number) => string;
	}

	interface PromiseConstructor {
		delay: (ms: number) => Promise<void>;
	}

	interface MouseEvent {
		layerX: number | undefined;
		layerY: number | undefined;
	}

	interface EventTarget {
		offsetLeft: number;
		offsetTop: number;
		setPointerCapture: (pointerId: number) => void;
	}

	interface Array<T> {
		remove: (item: T) => void;
	}

	const DEBUG: boolean;

}

// Definitions
window.addLoadEventListener = function (listener) {
	let fired = false;

	const _func = () => {
		if (fired) return;
		fired = true;

		listener();
	};

	window.addEventListener("DOMContentLoaded", _func);
	window.addEventListener("load", _func);
	document.addEventListener("load", _func);
	window.addEventListener("ready", _func);
	setTimeout(_func, 1000);
};

window.isMobile = function () {
	return window.matchMedia("(any-pointer: coarse)").matches;
};

Promise.delay = function(amount) {
	return new Promise((resolve, _) => {
		setTimeout(resolve, amount);
	});
};

Math.clamp = function(value, min, max) {
	return Math.min(Math.max(value, min), max);
};

Math.toDegrees = function (rad) {
	let deg = rad * (180 / Math.PI);
	if (deg < 0) deg += 360;
	else if (deg > 360) deg -= 360;

	return deg;
};

Math.toRadians = function (deg) {
	let rad = deg * (Math.PI / 180);
	if (rad < 0) rad += 2 * Math.PI;
	else if (rad > 2 * Math.PI) rad -= 2 * Math.PI;

	return rad;
};

Math.maximumCommonDivisor = function (a, b) {
	if (b === 0) return a;

	return Math.maximumCommonDivisor(b, a % b);
};

Math.prettifyElapsedTime = function (ms) {
	const toFixed = (value, digits) => {
		if (value % 1 === 0) return Math.floor(value);
		else return value.toFixed(digits);
	};

	if (ms < 1) return `${Math.floor(ms * 1000)}μs`;
	if (ms < 1000) return `${toFixed(ms, 2)}ms`;
	if (ms < 60000) return `${toFixed((ms / 1000), 2)}s`;
	if (ms < 3600000) return `${toFixed((ms / 60000), 2)}m`;
	else return `${toFixed((ms / 3600000), 2)}h`;
};

HTMLCanvasElement.prototype.screenshot = async function (filename = "download.png") {
	// Create anchor element
	const a = document.createElement("a");
	a.download = filename;
	a.href = this.toDataURL("image/png;base64");
	a.style.visibility = "hidden";
	a.style.display = "none";

	// Append it to the DOM
	document.body.appendChild(a);

	// Simulate click
	await Promise.delay(1);
	a.click();

	// Remove it from the DOM
	await Promise.delay(100);
	document.body.removeChild(a);
};

export { };