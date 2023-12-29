import "./extensions";
import { Log } from "./utils/log";
import { DensityCanvas } from "./components/density-canvas";
import { IRenderer } from "./types/irenderer";
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
import { FullscreenUtils } from "./utils/fullscreen";
import { UIUtils } from "./utils/ui";
import { Optional } from "./types/optional";
import { StatsUtils } from "./utils/stats";

export class Main {

	// Graphics
	public canvas: Optional<DensityCanvas> = null;

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

	public renderer: IRenderer = new FractalCPU();

	private lastFrameTime: DOMHighResTimeStamp = 0;
	private animationFrameHandle: number = -1;

	constructor() {
		Log.info("Main", "Starting up...");
		this.attachHooks();
	}

	public async setRenderer(renderer: IRenderer) {
		StatsUtils.reset();

		if (this.animationFrameHandle >= 0) {
			cancelAnimationFrame(this.animationFrameHandle);
			this.animationFrameHandle = -1;
		}

		if (this.renderer != null) {
			this.renderer.destroy(this.canvas!.context)
		}

		this.renderer = renderer;


		await UIUtils.transition(async () => {
			if (this.canvas !== null) {
				this.canvas.element.remove();
			}
			await this.setupCanvas();
		});
	}

	@measure("MAIN-LOAD")
	private async setupCanvas() {
		try {
			this.canvas = new DensityCanvas(this.renderer.getCanvasType(), "canvas");

			// Attach canvas
			const wrapper = document.getElementById("wrapper");
			if (!wrapper) throw new Error("Wrapper div element not found");
			this.canvas.attachToElement(wrapper);
			this.cameraController.attachHooks(this.canvas.element);

			// Setup fractal
			await this.renderer.setup(this.canvas.context);

			// Setup canvas
			this.onResize();

			// Update UI
			UIUtils.onRendererChange(this.renderer);

			// Render
			this.lastFrameTime = performance.now();
			this.animationFrameHandle = requestAnimationFrame(this.renderFrame.bind(this));
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
		UIUtils.attachHooks(this);
	}

	// #region Event listeners
	private async onLoad() {
		Log.debug("Main", "Window loaded");

		setTimeout(() => {
			this.setupCanvas();
		}, 250);
	}

	private onResize() {
		if (this.canvas === null) throw new Error("Canvas not initialized");

		const wrapper = document.getElementById("wrapper");
		if (!wrapper) throw new Error("Wrapper div element not found");

		const width = wrapper.clientWidth;
		const height = wrapper.clientHeight;
		const mcm = Math.maximumCommonDivisor(width, height);
		Log.debug("Main", `Window resized to ${width}x${height} (${width / mcm}:${height / mcm})`);

		this.canvas.setSize(width, height);
		this.camera.viewport = { width: this.canvas.width, height: this.canvas.height };
	}
	// #endregion

	@measureOverTime("MAIN-RENDER", 1000)
	private async renderFrame(time: DOMHighResTimeStamp) {
		if (this.animationFrameHandle < 0) return;
		if (this.canvas === null) throw new Error("Canvas not initialized");

		const deltaTime = (time - this.lastFrameTime) / 1000.0;
		this.lastFrameTime = time;

		this.cameraController.update(deltaTime);

		await this.renderer.step(this.canvas.context, this.camera);

		this.animationFrameHandle = requestAnimationFrame(this.renderFrame.bind(this));
	}

}

// Start the game
window._instance = new Main();