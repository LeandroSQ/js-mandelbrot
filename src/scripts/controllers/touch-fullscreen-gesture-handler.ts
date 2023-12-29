import { AGestureHandler } from "../types/agesture-handler";
import { Camera } from "../types/camera";
import { Optional } from "../types/optional";
import { PointerState } from "../types/pointer-state";
import { VectorMath } from "../types/vector";
import { FullscreenUtils } from "../utils/fullscreen";
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

	apply(pointers: PointerState[], camera: Camera) {
		FullscreenUtils.toggle();
	}

	update(deltaTime: number, pointers: PointerState[], camera: Camera) {

	}

}