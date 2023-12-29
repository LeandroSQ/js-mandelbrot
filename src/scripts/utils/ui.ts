import { Main } from "../main";
import { FractalCPU } from "../renderer/cpu";
import { FractalCPUMathJS } from "../renderer/cpu-mathjs";
import { FractalWASM } from "../renderer/wasm";
import { FractalWebGL } from "../renderer/webgl";
import { FractalWebGPU } from "../renderer/webgpu";
import { IRenderer } from "../types/irenderer";
import { Optional } from "../types/optional";
import { RendererType } from "../types/renderer-type";
import { Log } from "./log";

export abstract class UIUtils {

	private static elementFPS: Optional<HTMLElement> = null;
	private static elementAvgFrameTime: Optional<HTMLElement> = null;
	private static elementMinFrameTime: Optional<HTMLElement> = null;
	private static elementMaxFrameTime: Optional<HTMLElement> = null;
	private static elementMemory: Optional<HTMLElement> = null;

	public static setActiveButton(id: string) {
		document.querySelectorAll("footer button.active").forEach(x => x.classList.remove("active"));
		document.getElementById(id)?.classList.add("active");
	}

	public static onRendererChange(renderer: IRenderer) {
		this.setActiveButton(renderer.getType());
    }

	public static attachHooks(main: Main) {
		this.elementFPS = document.getElementById("fps");
		this.elementAvgFrameTime = document.getElementById("avg-frametime");
		this.elementMinFrameTime = document.getElementById("min-frametime");
		this.elementMaxFrameTime = document.getElementById("max-frametime");
		this.elementMemory = document.getElementById("memory");

        document.querySelectorAll("footer button").forEach((button) => {
            if (button instanceof HTMLButtonElement)
                button.addEventListener("click", UIUtils.onButtonClick.bind(this, main, button));
		});
    }

    private static onButtonClick(main: Main, button: HTMLButtonElement, event: MouseEvent) {
		const id = button.id as RendererType;
		Log.debug("UIUtils", `Button ${id} clicked`);
		switch (id) {
			case RendererType.CPU:
				main.setRenderer(new FractalCPU());
				break;
			case RendererType.CPUMathJS:
				main.setRenderer(new FractalCPUMathJS());
				break;
			case RendererType.WebGL:
				main.setRenderer(new FractalWebGL());
				break;
			case RendererType.WebGPU:
				main.setRenderer(new FractalWebGPU());
				break;
			case RendererType.WASM:
				main.setRenderer(new FractalWASM());
				break;
			default:
				Log.warn("UIUtils", `Unknown button click ${button}`);
                break;
        }
	}

	private static setButtonsEnabled(enabled: boolean) {
		document.querySelectorAll("footer button").forEach((button) => {
			if (button instanceof HTMLButtonElement) button.disabled = !enabled;
		});
	}

	public static transition(action: () => Promise<void>): Promise<void> {
		return new Promise(async (resolve, reject) => {
			try {
				const startViewTransition = window.getPrefixedProperty<Optional<(action) => void>>(document, "startViewTransition", false);

				const wrapper = document.getElementById("wrapper");
				if (wrapper === null) return reject("Wrapper not found");

				wrapper.classList.add("loading");
				this.setButtonsEnabled(false);

				if (startViewTransition !== null) {
					startViewTransition.call(document, async () => {
						try {
							await action();

							await Promise.delay(250);
							wrapper.classList.remove("loading");
							this.setButtonsEnabled(true);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				} else {
					await action();
					wrapper.classList.remove("loading");
					this.setButtonsEnabled(true);
					resolve();
				}
			} catch (error) {
				reject(error);
			}
		});

	}

	public static updateStats(fps: number, estimatedFPS: number, avgFrameTime: number, minFrameTime: number, maxFrameTime: number) {
		if (this.elementFPS) this.elementFPS.textContent = `${fps} real | ${Math.round(estimatedFPS)} (est.)`;
		if (this.elementAvgFrameTime) this.elementAvgFrameTime.textContent = Math.prettifyElapsedTime(avgFrameTime);
		if (this.elementMinFrameTime) this.elementMinFrameTime.textContent = Math.prettifyElapsedTime(minFrameTime);
		if (this.elementMaxFrameTime) this.elementMaxFrameTime.textContent = Math.prettifyElapsedTime(maxFrameTime);
		if (this.elementMemory && "memory" in performance) this.elementMemory.textContent = Math.prettifySize(performance.memory?.usedJSHeapSize ?? 0);
	}

}