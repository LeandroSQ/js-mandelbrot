import { AGestureHandler } from "../types/agesture-handler";
import { Camera } from "../types/camera";
import { PointerState } from "../types/pointer-state";
import { Vector, VectorMath } from "../types/vector";
import { Log } from "../utils/log";
import { Optional } from "./../types/optional";

const speed = 1.0;
const inertia = 45.0;
const friction = 0.93;

export class MoveGestureHandler extends AGestureHandler {

	private lastPointer: Optional<PointerState> = null;

	private velocity: Vector = { x: 0, y: 0 };

	detectGesture(pointers: PointerState[], camera: Camera): boolean {
		if (pointers.length === 0 && this.lastPointer !== null) {
			// Detected end of gesture, apply inertia to camera
			const dpi = window.devicePixelRatio ?? 1;
			const delta = {
				x: (this.lastPointer.position.x - this.lastPointer.lastPosition.x) * speed * camera.fractalSize / camera.viewport.width / camera.zoom * dpi,
				y: (this.lastPointer.position.y - this.lastPointer.lastPosition.y) * speed * camera.fractalSize / camera.viewport.height / camera.zoom * dpi,
			};

			this.velocity.x += delta.x * inertia;
			this.velocity.y += delta.y * inertia;

			this.lastPointer = null;

			return false;
		} else {
			return pointers.length === 1;
		}
	}

	apply(pointers: PointerState[], camera: Camera) {
		this.lastPointer = null;
		this.velocity.x = 0;
		this.velocity.y = 0;
	}

	update(deltaTime: number, pointers: PointerState[], camera: Camera) {
		if (this.isInteracting) {
			const pointer = pointers[0];

			this.lastPointer = { ...pointer };
			const dpi = window.devicePixelRatio ?? 1;
			const delta = {
				x: (pointer.position.x - pointer.lastPosition.x) * speed * camera.fractalSize / camera.viewport.width / camera.zoom * dpi,
				y: (pointer.position.y - pointer.lastPosition.y) * speed * camera.fractalSize / camera.viewport.height / camera.zoom * dpi,
			};

			camera.position.x -= delta.x;
			camera.position.y -= delta.y;
		} else {
			camera.position.x -= this.velocity.x * deltaTime;
			camera.position.y -= this.velocity.y * deltaTime;

			this.velocity.x *= friction;
			this.velocity.y *= friction;
		}
	}

}