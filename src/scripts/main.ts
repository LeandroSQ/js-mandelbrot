import "./extensions";
import { Log } from "./utils/log";
import { DensityCanvas } from "./components/density-canvas";
import { IFractal } from "./types/ifractal";
import { FractalWebGL } from "./renderer/webgl";
import { measure, measureOverTime } from "./decorators/measure";
import { Alert } from "./utils/alert";
import { Camera } from "./types/camera";
import { TouchCameraController } from "./controllers/touch-camera-controller";
import { DesktopCameraController } from "./controllers/desktop-camera-controller";
import { ICameraController } from "./types/icamera-controller";
import { FractalWASM } from "./renderer/wasm";
import { FractalWebGPU } from "./renderer/webgpu";
import { FractalCPU } from "./renderer/cpu";
import { FractalCPUMathJS } from "./renderer/cpu-mathjs";

export class Main {

	// Graphics
	public canvas!: DensityCanvas;

	private camera: Camera = {
		viewport: { width: 0, height: 0 },
		position: { x: -0.95, y: 0 },
		fractalSize: 2.0,
		maxIterations: 80,
		zoom: 1.0,
		rotation: 0
	};

	private cameraController: ICameraController = window.isMobile()
													? new TouchCameraController(this.camera)
													: new DesktopCameraController(this.camera);

	private fractal: IFractal = new FractalWebGL();

	private lastFrameTime: DOMHighResTimeStamp = 0;

	constructor() {
		Log.info("Main", "Starting up...");
		try {
			this.canvas = new DensityCanvas(this.fractal.getCanvasType(), "canvas");

			this.attachHooks();
		} catch (error) {
			console.trace(error);

			const message = error instanceof Error ? error.message : String(error);
			Alert.error(`Failed to initialize.\n\n${message}`, "Error!");
		}
	}

	private attachHooks() {
		Log.info("Main", "Attaching hooks...");
		window.addLoadEventListener(this.onLoad.bind(this));
		window.addEventListener("resize", this.onResize.bind(this));
		this.cameraController.attachHooks(this.canvas.element);
	}

	// #region Event listeners
	@measure("MAIN-LOAD")
	private async onLoad() {
		try {
			Log.debug("Main", "Window loaded");

			// Attach the canvas element to DOM
			this.canvas.attachToElement(document.body);

			// Setup canvas
			this.onResize();

			// Setup fractal
			await this.fractal.setup(this.canvas.context);

			// Render
			this.lastFrameTime = performance.now();
			setTimeout(() => {
				requestAnimationFrame(this.renderFrame.bind(this));
			}, 250);
		} catch (error) {
			console.trace(error);

			const message = error instanceof Error ? error.message : String(error);
			Alert.error(`Failed to initialize.\n\n${message}`, "Error!");
		}
	}

	private onResize() {
		const width = document.body.clientWidth;
		const height = document.body.clientHeight;
		const mcm = Math.maximumCommonDivisor(width, height);
		Log.debug("Main", `Window resized to ${width}x${height} (${width / mcm}:${height / mcm})`);

		if (window.isMobile()) {// Handle mobile devices
			const padding = 15 * this.canvas.drawRatio;

			this.canvas.setSize(width - padding, height - padding);
		} else {// Handle desktop devices
			const padding = 80 * this.canvas.drawRatio;
			const maximum = 1024;

			if (width >= maximum + padding && height >= maximum + padding) {// Clamp the canvas size to 1024x1024
				this.canvas.setSize(maximum, maximum);
			} else {
				this.canvas.setSize(width - padding, height - padding);
			}
		}

		this.camera.viewport = { width: this.canvas.width, height: this.canvas.height };
	}
	// #endregion

	@measureOverTime("MAIN-RENDER", 1000)
	private async renderFrame(time: DOMHighResTimeStamp) {
		const deltaTime = (time - this.lastFrameTime) / 1000.0;
		this.lastFrameTime = time;

		this.cameraController.update(deltaTime);

		await this.fractal.step(this.canvas.context, this.camera);

		requestAnimationFrame(this.renderFrame.bind(this));
	}

}

// Start the game
window._instance = new Main();