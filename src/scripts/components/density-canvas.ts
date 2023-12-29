import { Log } from "../utils/log";
import { CanvasContextType } from "../types/canvas-context-type";
import { CanvasRenderingContext } from "../types/canvas-rendering-context";

export class DensityCanvas {

	public element: HTMLCanvasElement = document.createElement("canvas");

	public contextType: CanvasContextType;
	public context: CanvasRenderingContext;

	private virtualWidth = 0;
	private virtualHeight = 0;

	constructor(type: CanvasContextType, name: string | undefined = undefined) {
		if (name) this.element.id = name;
		else this.element.id = `canvas-${Math.floor(Math.random() * 100000)}`;

		this.contextType = type;
		const context = this.element.getContext(type);
		if (!context) throw new Error("Could not get context of canvas");

		// Check for errors
		if (type === CanvasContextType.WEBGL && (context as WebGL2RenderingContext).isContextLost()) throw new Error("WebGL context is lost");

		this.context = context;

		// Apply anti-aliasing
		if ("webkitImageSmoothingEnabled" in this.context) this.context.webkitImageSmoothingEnabled = false;
		if ("mozImageSmoothingEnabled" in this.context) this.context.mozImageSmoothingEnabled = false;
		if ("msImageSmoothingEnabled" in this.context) this.context.msImageSmoothingEnabled = false;
		if ("oImageSmoothingEnabled" in this.context) this.context.oImageSmoothingEnabled = false;
		if ("imageSmoothingEnabled" in this.context) this.context.imageSmoothingEnabled = false;
	}

	public get context2D(): CanvasRenderingContext2D {
		if (this.contextType !== CanvasContextType.CANVAS_2D) throw new Error("Context is not 2D");

		return this.context as CanvasRenderingContext2D;
	}

	public get contextWebGL(): WebGL2RenderingContext {
		if (this.contextType !== CanvasContextType.WEBGL) throw new Error("Context is not WebGL");

		return this.context as WebGL2RenderingContext;
	}

	public get contextWebGPU(): GPUCanvasContext {
		if (this.contextType !== CanvasContextType.WEBGPU) throw new Error("Context is not WebGPU");

		return this.context as GPUCanvasContext;
	}

	private get backingStoreRatio(): number {
		if ("webkitBackingStorePixelRatio" in this.context && this.context["webkitBackingStorePixelRatio"] !== undefined) return this.context.webkitBackingStorePixelRatio as number;
		if ("mozBackingStorePixelRatio" in this.context && this.context["mozBackingStorePixelRatio"] !== undefined) return this.context.mozBackingStorePixelRatio as number;
		if ("msBackingStorePixelRatio" in this.context && this.context["msBackingStorePixelRatio"] !== undefined) return this.context.msBackingStorePixelRatio as number;
		if ("oBackingStorePixelRatio" in this.context && this.context["oBackingStorePixelRatio"] !== undefined) return this.context.oBackingStorePixelRatio as number;
		if ("backingStorePixelRatio" in this.context && this.context["backingStorePixelRatio"] !== undefined) return this.context.backingStorePixelRatio as number;

		return 1;
	}

	get devicePixelRatio(): number {
		return window.devicePixelRatio || 1;
	}

	get drawRatio(): number {
		return this.devicePixelRatio / this.backingStoreRatio;
	}

	/**
	 * Sets the size of the canvas
	 *
	 * @param {number} width The width of the canvas, in pixels
	 * @param {number} height The width of the canvas, in pixels
	 */
	setSize(width: number, height: number) {
		Log.info("DensityCanvas", `Setting size to ${width}x${height}`);

		// Set the canvas size
		if (this.backingStoreRatio !== this.devicePixelRatio) {
			// Set the virtual canvas size to the real resolution
			this.element.width = width * this.drawRatio;
			this.element.height = height * this.drawRatio;

			// Set the presented canvas size to the visible resolution
			this.element.style.width = `${width}px`;
			// this.element.style.minWidth = `${width}px`;
			this.element.style.height = `${height}px`;
			// this.element.style.minHeight = `${height}px`;
		} else {
			// 1:1 ratio, just scale it
			this.element.width = width;
			this.element.height = height;

			this.element.style.width = "";
			this.element.style.height = "";
		}

		// Scale the canvas according to the ratio
		if (this.contextType === CanvasContextType.CANVAS_2D) this.context2D.scale(this.drawRatio, this.drawRatio);

		// Save the virtual size of the canvas
		this.virtualWidth = width;
		this.virtualHeight = height;

		const mcm = Math.maximumCommonDivisor(width, height);
		Log.debug("DensityCanvas", `Set size to ${this.element.width}x${this.element.height} with ratio ${this.drawRatio} virtual of ${width}x${height} aspect ratio ${width / mcm}:${height / mcm}`);
	}

	/**
	 * Attaches the canvas element as child to given {@link element}
	 *
	 * @param {HTMLElement} element The element to attach the canvas to
	 */
	attachToElement(element: HTMLElement) {
		element.appendChild(this.element);
	}

	// #region Getters
	get width(): number {
		return this.element.width;
	}

	get height(): number {
		return this.element.height;
	}
	// #endregion

}