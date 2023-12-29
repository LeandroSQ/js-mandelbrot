import { Optional } from './../types/optional';
import { PointerState } from './../types/pointer-state';
import { AGestureHandler } from "../types/agesture-handler";
import { Camera } from "../types/camera";
import { Vector } from '../types/vector';

export class ScaleGestureHandler extends AGestureHandler {

	private threshold = 10;
	private lastDistance = 0;
	private zoomVelocity = 0;
	private lastMidPoint: Vector = { x: 0, y: 0 };
	private element: Optional<HTMLElement> = null;

	detectGesture(pointers: PointerState[], camera: Camera): boolean {
		return pointers.length === 2;
	}

	private calculateDistance(pointers: PointerState[]): number {
		const pointerA = pointers[0];
		const pointerB = pointers[1];

		return Math.sqrt(Math.pow(pointerA.position.x - pointerB.position.x, 2) + Math.pow(pointerA.position.y - pointerB.position.y, 2));
	}

	private calculateMidPoint(pointers: PointerState[]): Vector {
		const pointerA = pointers[0];
		const pointerB = pointers[1];

		return {
			x: (pointerA.position.x + pointerB.position.x) / 2,
			y: (pointerA.position.y + pointerB.position.y) / 2,
		};

	}

	apply(pointers: PointerState[], camera: Camera) {
		this.lastDistance = this.calculateDistance(pointers);
		this.lastMidPoint = this.calculateMidPoint(pointers);
	}

	update(deltaTime: number, pointers: PointerState[], camera: Camera) {
		const speed = 0.005;
		const zoomFriction = 0.9;
		const minZoom = 0.5;
		const maxZoom = 318226.2513349596;
		const defaultIterations = 80;
		const minIterations = 1;
		const maxIterations = 20024;

		if (this.isInteracting) {
			if (this.element === null) {
				this.element = document.createElement("div");
				this.element!.style.setProperty("background-color", "blue");
				this.element!.style.setProperty("width", "50px");
				this.element!.style.setProperty("height", "50px");
				this.element!.style.setProperty("position", "absolute");
				this.element!.style.setProperty("top", "0px");
				this.element!.style.setProperty("left", "0px");
				this.element!.style.setProperty("z-index", "1000");
				this.element!.style.setProperty("pointer-events", "none");
				this.element!.style.setProperty("border-radius", "50%");
				document.body.appendChild(this.element!);
			}

			const pointerA = pointers[0];
			const pointerB = pointers[1];

			const dpi = window.devicePixelRatio ?? 1;

			// Calculate maximum distance between pointers, using the viewport diagonal
			const distance = this.calculateDistance(pointers);
			// const maxDistance = Math.sqrt(Math.pow(camera.viewport.width, 2) + Math.pow(camera.viewport.height, 2)) / dpi;

			if (distance - this.lastDistance !== 0.0) {
				this.zoomVelocity += (distance - this.lastDistance) * speed;
			}

			const zoomDelta = 1.0 - (this.zoomVelocity * deltaTime +  this.lastDistance - distance) * speed;
			this.lastDistance = distance;

			const oldZoom = camera.zoom;
			camera.zoom *= zoomDelta;
			camera.zoom = Math.clamp(camera.zoom, minZoom, maxZoom);

			// Pan camera
			const center = this.calculateMidPoint(pointers);
			const delta = {
				x: ((center.x) / camera.viewport.width - 0.5) * camera.fractalSize / oldZoom * (1.0 - 1.0 / zoomDelta),
				y: ((center.y) / camera.viewport.height - 0.5) * camera.fractalSize / oldZoom * (1.0 - 1.0 / zoomDelta),
			};
			this.lastMidPoint = center;

			camera.position.x += delta.x;
			camera.position.y += delta.y;

			this.element!.style.setProperty("transform", `translate(${center.x}px, ${center.y}px)`);
		}
	}

}