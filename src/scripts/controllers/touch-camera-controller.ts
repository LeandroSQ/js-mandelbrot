import { Camera } from "../types/camera";
import { Log } from "../utils/log";
import { AGestureHandler } from "../types/agesture-handler";
import { ICameraController } from "../types/icamera-controller";
import { PointerState } from "../types/pointer-state";
import { MoveGestureHandler } from "./touch-move-gesture-handler";
import { ScaleGestureHandler } from "./touch-scale-gesture-handler";
import { Vector } from "../types/vector";
import { FullscreenGestureHandler } from "./touch-fullscreen-gesture-handler";

export class TouchCameraController implements ICameraController {

	private target!: HTMLElement;

	private activePointers: Map<number, PointerState> = new Map();

	private gestures: Array<AGestureHandler> = [
		new MoveGestureHandler(),
		new ScaleGestureHandler(),
		new FullscreenGestureHandler()
	];

	constructor(private camera: Camera) { }

	attachHooks(element: HTMLElement) {
		this.target = element;

		element.addEventListener("pointerdown", this.onPointerDown.bind(this));
		element.addEventListener("pointermove", this.onPointerMove.bind(this));
		element.addEventListener("pointerup", this.onPointerUp.bind(this));
		element.addEventListener("pointercancel", this.onPointerUp.bind(this));
		element.addEventListener("pointerout", this.onPointerUp.bind(this));
		element.addEventListener("pointerleave", this.onPointerUp.bind(this));
	}

	update(deltaTime: number) {
		const pointers = Array.from(this.activePointers.values());

		for (const gesture of this.gestures) {
			const wasInteracting = gesture.isInteracting;

			// Detect if gesture is interacting or not
			gesture.isInteracting = gesture.detectGesture(pointers, this.camera);

			// Log start of gesture
			if (!wasInteracting && gesture.isInteracting) Log.debug("CameraController", `Started ${gesture.constructor.name} gesture`);
			else if (wasInteracting && !gesture.isInteracting) Log.debug("CameraController", `Stopped ${gesture.constructor.name} gesture`);

			// Apply gesture
			if (!wasInteracting && gesture.isInteracting) gesture.apply(pointers, this.camera);

			gesture.update(deltaTime, pointers, this.camera);
		}

		for (const pointer of this.activePointers.values()) {
			pointer.lastPosition.x = pointer.position.x;
			pointer.lastPosition.y = pointer.position.y;
		}
	}

	private updatePointerPosition(event: PointerEvent) {
		const position = this.getPositionFromEvent(event);

		const pointer = this.activePointers.get(event.pointerId);
		if (!pointer) return;

		// pointer.lastPosition.x = pointer.position.x;
		// pointer.lastPosition.y = pointer.position.y;

		pointer.position.x = position.x;
		pointer.position.y = position.y;
	}

	private getPositionFromEvent(event: PointerEvent): Vector {
		const dpi = window.devicePixelRatio ?? 1;

		return {
			x: (event.layerX ?? (event.clientX ?? event.offsetX - (event.target?.offsetLeft ?? 0))) * dpi,
			y: (event.layerY ?? (event.clientY ?? event.offsetY - (event.target?.offsetTop ?? 0))) * dpi,
		};
	}

	private checkIfInsideElement(event: PointerEvent): boolean {
		const dpi = window.devicePixelRatio ?? 1;
		const position = this.getPositionFromEvent(event);

		const element = event.target as HTMLElement;

		if (position.x < 0 || position.x > element.clientWidth * dpi || position.y < 0 || position.y > element.clientHeight * dpi) {
			Log.error("CameraController", `Pointer ${event.pointerId} is outside of element`);

			return false;
		}

		return true;
	}

	private onPointerDown(event: PointerEvent) {
		if (!this.checkIfInsideElement(event)) return this.onPointerUp(event);

		// Request pointer capture
		if (!this.target.hasPointerCapture(event.pointerId)) this.target.setPointerCapture(event.pointerId);

		if (this.activePointers.has(event.pointerId)) {
			this.updatePointerPosition(event);
		} else {
			const position = this.getPositionFromEvent(event);

			this.activePointers.set(event.pointerId, {
				id: event.pointerId,
				position: { ...position },
				lastPosition: { ...position }
			});
		}
	}

	private onPointerMove(event: PointerEvent) {
		if (!this.checkIfInsideElement(event)) return this.onPointerUp(event);
		if (!this.activePointers.has(event.pointerId)) return;

		this.updatePointerPosition(event);
	}

	private onPointerUp(event: PointerEvent) {
		if (!this.activePointers.has(event.pointerId)) return;
		this.activePointers.delete(event.pointerId);
	}

}
