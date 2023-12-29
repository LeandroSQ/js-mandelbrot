import { Optional } from './../types/optional';
import { PointerState } from './../types/pointer-state';
import { AGestureHandler } from "../types/agesture-handler";
import { Camera } from "../types/camera";
import { Vector } from '../types/vector';

export class ScaleGestureHandler extends AGestureHandler {

	private lastDistance = 0;
	private zoomVelocity = 0;

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
	}

	update(deltaTime: number, pointers: PointerState[], camera: Camera) {
		const dpi = window.devicePixelRatio ?? 1;
		const speed = 0.005 / dpi;
		const zoomFriction = 0.9;
		const minZoom = 0.5;
		const maxZoom = 318226.2513349596;
		const defaultIterations = 80;
		const minIterations = 1;
		const maxIterations = 20024;

		if (this.isInteracting) {
			// Calculate maximum distance between pointers, using the viewport diagonal
			const distance = this.calculateDistance(pointers);
			if (distance - this.lastDistance !== 0.0) {
				this.zoomVelocity += (distance - this.lastDistance) * speed;
			}
			const zoomDelta = 1.0 - (this.zoomVelocity * deltaTime +  this.lastDistance - distance) * speed;
			this.lastDistance = distance;

			// Apply zoom
			const oldZoom = camera.zoom;
			camera.zoom *= zoomDelta;
			camera.zoom = Math.clamp(camera.zoom, minZoom, maxZoom);

			// Pan camera
			const center = this.calculateMidPoint(pointers);
			const delta = {
				x: ((center.x) / camera.viewport.width - 0.5) * camera.fractalSize / oldZoom * (1.0 - 1.0 / zoomDelta),
				y: ((center.y) / camera.viewport.height - 0.5) * camera.fractalSize / oldZoom * (1.0 - 1.0 / zoomDelta),
			};
			camera.position.x += delta.x;
			camera.position.y += delta.y;

			// Adjust the iteration count to keep the fractal constant
		 	camera.maxIterations = Math.floor(defaultIterations + camera.zoom * 0.2);
		 	camera.maxIterations = Math.clamp(camera.maxIterations, minIterations, maxIterations);
		}
	}

}