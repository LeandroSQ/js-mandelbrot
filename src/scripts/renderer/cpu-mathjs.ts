/* eslint-disable max-statements */
import { CanvasContextType } from "../types/canvas-context-type";
import { IFractal } from "../types/ifractal";
import { complex, Complex, add, pow, abs, smallerEq, log, log2 } from "mathjs";
import { Log } from "../utils/log";
import { Color } from "../utils/color";
import { Camera } from "../types/camera";

export class FractalCPUMathJS implements IFractal {

	private buffer: Uint8ClampedArray = new Uint8ClampedArray(0);
	private imageData: ImageData | null = null;

	private x = 0;
	private y = 0;
	private timer = 0;

	getCanvasType(): CanvasContextType {
		return CanvasContextType.CANVAS_2D;
	}

	async setup(ctx: CanvasRenderingContext2D) {
		this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
	}

	private mandelbrot(c: Complex, maxIterations: number) {
		let z: Complex = complex(0, 0);
		let n = 0;

		while (smallerEq(abs(z), 2) && n < maxIterations) {
			z = add(pow(z, 2) as Complex, c);
			n++;
		}

		if (n === maxIterations) return maxIterations;

		// Smooth coloring
		z = log(log2(abs(z)));

		return n + 1.0 - (z as unknown as number);
	}

	async step(ctx: CanvasRenderingContext2D, camera: Camera): Promise<void> {
		if (this.buffer.length !== camera.viewport.width * camera.viewport.height * 4 || !this.imageData) {
			this.buffer = new Uint8ClampedArray(camera.viewport.width * camera.viewport.height * 4);
			this.imageData = new ImageData(this.buffer, camera.viewport.width, camera.viewport.height);
			this.x = 0;
			this.y = 0;
			this.timer = 0;
		}

		const start = performance.now();
		const aspectRatio = camera.viewport.width / camera.viewport.height;

		for (let i = 0; i < camera.viewport.height; i++) {
			this.y++;
			if (this.y >= camera.viewport.height) {
				this.y = 0;
				this.x++;
			}
			if (this.x >= camera.viewport.width) {
				this.y = 0;
				this.x = 0;
				Log.measure("CPU-MathJS", this.timer);
				this.timer = 0;
			}

			// Convert pixel coordinate to complex number
			const c = complex(
				(this.x / camera.viewport.width - 0.5) * camera.fractalSize / camera.zoom + camera.position.x,
				((this.y / camera.viewport.height - 0.5) * camera.fractalSize / camera.zoom + camera.position.y) / aspectRatio
			);

			// Compute the number of iterations
			const m = this.mandelbrot(c, camera.maxIterations);

			// Convert a number in the range of 0-1 to a color
			const color = Color.calculateMandelbrotColor(m, camera.maxIterations);

			// Plot the point - raw image data
			const pixelOffset = (this.x + this.y * camera.viewport.width) * 4;
			this.buffer[pixelOffset] = color[0];
			this.buffer[pixelOffset + 1] = color[1];
			this.buffer[pixelOffset + 2] = color[2];
			this.buffer[pixelOffset + 3] = 255;
		}

		this.timer += performance.now() - start;

		ctx.putImageData(this.imageData, 0, 0);
	}

}