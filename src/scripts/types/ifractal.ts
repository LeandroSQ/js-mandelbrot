import { CanvasRenderingContext } from "./canvas-rendering-context";
import { CanvasContextType } from "./canvas-context-type";
import { Camera } from "./camera";

export interface IFractal {

	getCanvasType(): CanvasContextType;

	setup(ctx: CanvasRenderingContext): Promise<void>;

	step(ctx: CanvasRenderingContext, camera: Camera): Promise<void>;

}
