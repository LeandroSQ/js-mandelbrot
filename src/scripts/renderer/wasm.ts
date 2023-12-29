import { measure, measureOverTime } from '../decorators/measure';
import { CanvasContextType } from '../types/canvas-context-type';
import { IFractal } from '../types/ifractal';
import { Optional } from '../types/optional';
import { Size } from '../types/size';
import { Log } from '../utils/log';

import * as binding from "../../assembly/module";
import type { __AdaptedExports as WASMModule } from "../../assembly/module.d.ts";
import { Camera } from '../types/camera';

const WASM_MODULE_PATH = `${window.location.origin}/assembly/module.wasm`;
const PAGE_SIZE = 64 * 1024;

export class FractalWASM implements IFractal {

	private instance: Optional<typeof WASMModule> = null;
	private memory: Optional<WebAssembly.Memory> = null;
	private imageData: Optional<ImageData> = null;

	private heapBase: number = 0;

	getCanvasType(): CanvasContextType {
		return CanvasContextType.CANVAS_2D;
	}

	private growMemory(size: Size) {
		if (this.memory === null) throw new Error("Memory not initialized");
		const oldSize = this.memory.buffer.byteLength - this.heapBase;
		const newSize = size.width * size.height * 4;

		const pagesToGrow = Math.ceil((newSize - oldSize) / PAGE_SIZE);
		if (pagesToGrow <= 0) {
			Log.warn("FractalWASM", "Memory already large enough");
			return;
		}

		Log.info("FractalWASM", `Growing memory by ${pagesToGrow} pages. From ${oldSize} bytes to ${newSize} bytes. (${PAGE_SIZE * pagesToGrow} bytes in total)`);
		this.memory.grow(pagesToGrow);

		const buffer = new Uint8ClampedArray(this.memory.buffer, this.heapBase, newSize);
		this.imageData = new ImageData(buffer, size.width, size.height);
	}

	@measure("CPU-WASM-SETUP")
	async setup(ctx: CanvasRenderingContext2D) {
		const memory = new WebAssembly.Memory({ initial: 1 });
		this.memory = memory;

		const module = fetch(WASM_MODULE_PATH);
		const compiled = await WebAssembly.compileStreaming(module);
		this.instance = await binding.instantiate(compiled, { env: { memory } });

		this.heapBase = this.instance.offset.value;
		Log.info("FractalWASM", `Heap base: 0x${this.heapBase.toString(16)}`);
	}

	@measureOverTime("CPU-WASM")
	async step(ctx: CanvasRenderingContext2D, camera: Camera) {
		const byteSize = camera.viewport.width * camera.viewport.height * 4;
		if (this.memory === null || this.memory.buffer.byteLength - this.heapBase < byteSize || this.imageData === null) {
			this.growMemory(camera.viewport);
		}

		if (this.imageData === null) throw new Error("Image data not initialized");
		if (this.memory === null) throw new Error("Memory not initialized");
		if (this.instance === null) throw new Error("Instance not initialized");

		this.instance.render(
			camera.viewport.width,
			camera.viewport.height,
			camera.position.x,
			camera.position.y,
			camera.fractalSize,
			camera.maxIterations,
			camera.zoom,
			camera.rotation,
		);

		ctx.putImageData(this.imageData, 0, 0);
	}

}