import { AGestureHandler } from "../types/agesture-handler";
import { Camera } from "../types/camera";
import { Optional } from "../types/optional";
import { PointerState } from "../types/pointer-state";
import { VectorMath } from "../types/vector";
import { Log } from "../utils/log";

const TAP_DURATION = 100;
const TAP_INTERVAL = 250;
const TAP_DISTANCE = 10 * (window.devicePixelRatio ?? 1);

type Pointer = {
	state: PointerState,
	pressedTime: DOMHighResTimeStamp,
	releasedTime: DOMHighResTimeStamp;
};

export class FullscreenGestureHandler extends AGestureHandler {

	private pointerA: Optional<Pointer> = null;
	private pointerB: Optional<Pointer> = null;

	private reset() {
		this.pointerA = null;
		this.pointerB = null;
	}

	private handlePointerDown(pointer: PointerState) {
		if (this.pointerA === null) {
			this.pointerA = {
				state: pointer,
				pressedTime: performance.now(),
				releasedTime: -1
			};
		} else if (this.pointerB === null && this.pointerA.state.id !== pointer.id) {
			this.pointerB = {
				state: pointer,
				pressedTime: performance.now(),
				releasedTime: -1
			};

			// Check if interval between taps is too long
			if (this.pointerB.pressedTime - this.pointerA.releasedTime > TAP_INTERVAL) {
				// Restart gesture by swapping pointers
				this.pointerA = this.pointerB;
				this.pointerB = null;
			}
		}
	}

	private handlePointerUp(): boolean {
		if (this.pointerA !== null && this.pointerA.releasedTime === -1) {
			this.pointerA.releasedTime = performance.now();

			// Check if pointer A was pressed for too long
			if (this.pointerA.releasedTime - this.pointerA.pressedTime > TAP_DURATION) {
				this.reset();
			}
		} else if (this.pointerB !== null && this.pointerB.releasedTime === -1) {
			this.pointerB.releasedTime = performance.now();

			// Check if pointer B was pressed for too long
			if (this.pointerB.releasedTime - this.pointerB.pressedTime > TAP_DURATION) {
				this.reset();
			} else {
				// Detected double tap
				this.reset();
				return true;
			}
		}

		return false;
	}

	detectGesture(pointers: PointerState[], camera: Camera): boolean {
		if (pointers.length === 0) {
			return this.handlePointerUp();
		} else if (pointers.length === 1) {
			this.handlePointerDown(pointers[0]);
		} else {// Does not support multi-touch, cancel gesture
			this.reset();
		}

		return false;
	}

	async apply(pointers: PointerState[], camera: Camera) {
		try {
			const element = document.getElementsByTagName("canvas")[0];
			const fullscreenElement = document.fullscreenElement ?? document["webkitFullscreenElement"] ?? document["mozFullScreenElement"] ?? document["msFullscreenElement"];
			const fullscreenEnabled = document.fullscreenEnabled ?? document["webkitFullscreenEnabled"] ?? document["mozFullScreenEnabled"] ?? document["msFullscreenEnabled"];
			const requestFullscreen = element.requestFullscreen ?? element["webkitRequestFullscreen"] ?? element["mozRequestFullScreen"] ?? element["msRequestFullscreen"];
			const exitFullscreen = document.exitFullscreen ?? document["webkitExitFullscreen"] ?? document["mozCancelFullScreen"] ?? document["msExitFullscreen"];

			if (!fullscreenEnabled) {
				Log.error("Fullscreen", "Fullscreen is not enabled");
				return;
			}

			if (fullscreenElement) {
				await exitFullscreen.call(document);
			} else {
				await requestFullscreen.call(element);
			}
		} catch (error) {
			Log.error("Fullscreen", `Error while requesting fullscreen: ${error}`);
		}
	}

	update(deltaTime: number, pointers: PointerState[], camera: Camera) {

	}

}