import { Camera } from "../types/camera";
import { ICameraController } from "../types/icamera-controller";
import { Vector } from "../types/vector";
import { FullscreenUtils } from "../utils/fullscreen";

export class DesktopCameraController implements ICameraController {

	private panVelocity = { x: 0, y: 0 };
	private zoomVelocity = 0;

	private mouse: Vector = { x: 0, y: 0 };
	private lastMouse: Vector = { x: 0, y: 0 };
	private get mouseDelta(): Vector {
		return { x: this.mouse.x - this.lastMouse.x, y: this.mouse.y - this.lastMouse.y };
	}

	private isTrackPadPanning = false;
	private isMouseDown = false;
	private wasMouseDown = false;

	private wheelDelta = 0;
	private trackPadDelta: Vector = { x: 0, y: 0 };

	constructor(private camera: Camera) { }

	attachHooks(element: HTMLElement) {
		element.addEventListener("keyup", this.onKeyUp.bind(this));
		element.addEventListener("mousedown", this.onMouseDown.bind(this));
		element.addEventListener("mousemove", this.onMouseMove.bind(this));
		element.addEventListener("mouseup", this.onMouseUp.bind(this));
		element.addEventListener("mouseleave", this.onMouseUp.bind(this));
		element.addEventListener("mouseout", this.onMouseUp.bind(this));
		element.addEventListener("wheel", this.onMouseWheel.bind(this), { passive: false });
	}

	update(deltaTime: number) {
		// Update camera
		this.panCamera(deltaTime);
		this.zoomCamera(deltaTime);

		// Reset variables
		this.isTrackPadPanning = false;
		this.wasMouseDown = this.isMouseDown;
		this.lastMouse.x = this.mouse.x;
		this.lastMouse.y = this.mouse.y;
		this.wheelDelta = 0;
	}

	private panCamera(deltaTime: number) {
		const speed = 1.0;
		const inertia = 45;
		const friction = 0.925;
		const min = -1.25;
		const max = 0.65;

		if (this.wasMouseDown || this.isTrackPadPanning) {
			const delta = {
				x: this.mouseDelta.x * speed * this.camera.fractalSize / this.camera.viewport.width / this.camera.zoom,
				y: this.mouseDelta.y * speed * this.camera.fractalSize / this.camera.viewport.height / this.camera.zoom
			};

			if (this.isMouseDown || this.isTrackPadPanning) {
				this.camera.position.x -= delta.x;
				this.camera.position.y -= delta.y;
			}

			if (!this.isMouseDown || this.isTrackPadPanning) {
				this.panVelocity.x = delta.x * inertia;
				this.panVelocity.y = delta.y * inertia;
			}
		} else {
			this.camera.position.x -= this.panVelocity.x * deltaTime;
			this.camera.position.y -= this.panVelocity.y * deltaTime;
			this.panVelocity.x *= friction;
			this.panVelocity.y *= friction;
		}

		this.camera.position.x = Math.clamp(this.camera.position.x, min, max);
		this.camera.position.y = Math.clamp(this.camera.position.y, min, max);
	}

	private zoomCamera(deltaTime: number) {
		const speed = 0.005;
		const friction = 0.9;
		const minZoom = 0.5;
		const maxZoom = 318226.2513349596;
		const defaultIterations = 80;
		const minIterations = 1;
		const maxIterations = 20024;

		if (this.wheelDelta !== 0) {
			this.zoomVelocity += this.wheelDelta * speed;
		}

		const z = 1.0 - (this.zoomVelocity * deltaTime + (this.wheelDelta * speed));
		const oldZoom = this.camera.zoom;
		this.camera.zoom *= z;
		this.camera.zoom = Math.clamp(this.camera.zoom, minZoom, maxZoom);

		if (this.camera.zoom !== oldZoom) {
			// Adjust this.camera.position to keep the mouse position constant
			this.camera.position.x += (this.mouse.x / this.camera.viewport.width - 0.5) * this.camera.fractalSize / oldZoom * (1.0 - 1.0 / z);
			this.camera.position.y += (this.mouse.y / this.camera.viewport.height - 0.5) * this.camera.fractalSize / oldZoom * (1.0 - 1.0 / z);

			// Adjust the iteration count to keep the fractal constant
			this.camera.maxIterations = Math.floor(defaultIterations + this.camera.zoom * 0.2);
			this.camera.maxIterations = Math.clamp(this.camera.maxIterations, minIterations, maxIterations);
		}

		this.zoomVelocity *= friction;
	}

	// #region Event Handlers
	private onKeyUp(event: KeyboardEvent) {
		if (event.key === "F11") {
			event.preventDefault();

			FullscreenUtils.toggle();
		}
	}

	private onMouseDown(event: MouseEvent) {
		if (event.button === 0 || event.button === 1) { // Left-click or middle-click
			this.isMouseDown = true;
		}

		// Update mouse position
		this.onMouseMove(event);
	}

	private onMouseMove(event: MouseEvent) {
		if (!event.target) return;
		if (this.isTrackPadPanning) return;

		// event.preventDefault();

		const dpi = window.devicePixelRatio ?? 1;
		const x = event.layerX ?? (event.clientX ?? event.offsetX - event.target.offsetLeft);
		const y = event.layerY ?? (event.clientY ?? event.offsetY - event.target.offsetTop);

		this.mouse.x = x * dpi;
		this.mouse.y = y * dpi;
	}

	private onMouseUp(event: MouseEvent) {
		if (event.button === 0 || event.button === 1) { // Left-click or middle-click
			this.isMouseDown = false;
		}

		// Update mouse position
		this.onMouseMove(event);
	}

	private normalizeWheelDelta(event: WheelEvent): Vector {
		let x = event.deltaX;
		let y = event.deltaY;

		if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
			x *= 8;
			y *= 8;
		} else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
			x *= 24;
			y *= 24;
		}

		return { x, y };
	}

	private onMouseWheel(event: WheelEvent) {
		event.preventDefault();

		this.onMouseMove(event);

		// In some browsers, when using trackpads the ctrlKey is set to true when scrolling
		let delta = this.normalizeWheelDelta(event);
		if (event.ctrlKey) {
			// Reset mouse coordinates
			this.wheelDelta = delta.y;
		} else {
			// Use trackpad panning
			this.isTrackPadPanning = true;
			this.lastMouse = { x: this.mouse.x, y: this.mouse.y };// Since we updated the mouse position, reset it so the only moved pixels considered are the scroll delta

			if (event.shiftKey && delta.x === 0) {
				this.mouse.x -= delta.y;
			} else {
				this.mouse.x -= delta.x;
				this.mouse.y -= delta.y;
			}
		}
	}
	// #endregion

}
