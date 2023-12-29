/* eslint-disable max-statements */
import { CanvasContextType } from "../types/canvas-context-type";
import { IRenderer } from "../types/irenderer";
import { Color } from "../utils/color";
import { gatherStats, measure, measureOverTime } from "../decorators/measure";
import { Camera } from "../types/camera";
import { CanvasRenderingContext } from "../types/canvas-rendering-context";
import { Log } from "../utils/log";
import { StatsUtils } from "../utils/stats";

export class FractalCPU implements IRenderer {

	private buffer: Uint8ClampedArray = new Uint8ClampedArray(0);
	private imageData: ImageData | null = null;

	getCanvasType(): CanvasContextType {
		return CanvasContextType.CANVAS_2D;
	}

	async setup(_: CanvasRenderingContext2D) {
		// Ignore
	}

	private calculateColor(mandelbrot: number, pixelOffset: number, maxIterations: number) {
		const color = Color.calculateMandelbrotColor(mandelbrot, maxIterations);

		this.buffer[pixelOffset] = color[0];
		this.buffer[pixelOffset + 1] = color[1];
		this.buffer[pixelOffset + 2] = color[2];
		this.buffer[pixelOffset + 3] = 255;
	}

	@measureOverTime("CPU-JS")
	async step(ctx: CanvasRenderingContext2D, camera: Camera) {
		StatsUtils.startFrame();

		if (this.buffer.length !== camera.viewport.width * camera.viewport.height * 4 || !this.imageData) {
			this.buffer = new Uint8ClampedArray(camera.viewport.width * camera.viewport.height * 4);
			this.imageData = new ImageData(this.buffer, camera.viewport.width, camera.viewport.height);
		}

		let x = 0;
		let y = 0;
		let tmp = 0.0;
		let re = 0.0;
		let im = 0.0;
		let iteration = 0;
		let index = 0;
		let color = 0;
		const aspectRatio = camera.viewport.width / camera.viewport.height;
		const zoomFactor = camera.fractalSize / camera.zoom;
		const stepX = 1.0 / camera.viewport.width;
		const stepY = 1.0 / camera.viewport.height;
		let complexReal = camera.position.x;
		let complexImaginary = camera.position.y;
		let tmpX = -0.5;
		let tmpY = -0.5;

		for (y = 0; y < camera.viewport.height; y++) {
			tmpY += stepY;
			complexImaginary = (tmpY * zoomFactor + camera.position.y) / aspectRatio;
			for (x = 0; x < camera.viewport.width; x++) {
				tmpX += stepX;
				complexReal = (tmpX * zoomFactor + camera.position.x);

				re = 0.0;
				im = 0.0;

				for (iteration = 0; (re * re + im * im) <= 4.0 && iteration < camera.maxIterations; iteration++) {
					tmp = re * re - im * im + complexReal;
					im = 2.0 * re * im + complexImaginary;
					re = tmp;
				}

				if (iteration === camera.maxIterations) {
					color = camera.maxIterations;
				} else {
					color = iteration + 1.0 - Math.log2(Math.log(Math.sqrt(re * re + im * im)));
				}

				index = (x + y * camera.viewport.width) * 4;
				this.calculateColor(color, index, camera.maxIterations);
			}

			tmpX = -0.5;
		}

		ctx.putImageData(this.imageData, 0, 0);

		StatsUtils.endFrame();
	}

	@measure("CPU-JS-DESTROY")
	async destroy(ctx: CanvasRenderingContext) {
		Log.info("FractalCPU", "Destroying...");
		this.imageData = null;
		this.buffer = null;
	}

}