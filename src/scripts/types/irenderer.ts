import { CanvasRenderingContext } from "./canvas-rendering-context";
import { CanvasContextType } from "./canvas-context-type";
import { Camera } from "./camera";

export interface IRenderer {

	getCanvasType(): CanvasContextType;

	setup(ctx: CanvasRenderingContext): Promise<void>;

	destroy(ctx: CanvasRenderingContext): Promise<void>;

	step(ctx: CanvasRenderingContext, camera: Camera): Promise<void>;

}
