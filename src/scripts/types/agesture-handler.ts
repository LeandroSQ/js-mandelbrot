import { Camera } from "./camera";
import { PointerState } from "./pointer-state";

export abstract class AGestureHandler {

	public isInteracting = false;

	abstract detectGesture(pointers: Array<PointerState>, camera: Camera): boolean;
	abstract apply(pointers: Array<PointerState>, camera: Camera);
	abstract update(deltaTime: number, pointers: Array<PointerState>, camera: Camera);

}
