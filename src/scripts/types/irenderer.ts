import { CanvasRenderingContext } from "./canvas-rendering-context";
import { CanvasContextType } from "./canvas-context-type";
import { Camera } from "./camera";
import { RendererType } from "./renderer-type";

export interface IRenderer {

	getCanvasType(): CanvasContextType;

	getType(): RendererType;

	setup(ctx: CanvasRenderingContext): Promise<void>;

	destroy(ctx: CanvasRenderingContext): Promise<void>;

	step(ctx: CanvasRenderingContext, camera: Camera): Promise<void>;

}
