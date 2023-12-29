import { AGestureHandler } from "../types/agesture-handler";
import { Camera } from "../types/camera";
import { PointerState } from "../types/pointer-state";

export class RotateGestureHandler extends AGestureHandler {

	detectGesture(_pointers: PointerState[], _camera: Camera): boolean {
		return false;
	}

	apply(_pointers: PointerState[], _camera: Camera) {
		// Ignore
	}

	update(_deltaTime: number, _pointers: PointerState[], _camera: Camera) {
		// Ignore
	}

}