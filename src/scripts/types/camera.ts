import { Size } from "./size";
import { Vector } from "./vector";

export type Camera = {
	viewport: Size;
	position: Vector;
	fractalSize: number;
	maxIterations: number;
	zoom: number;
	rotation: number;
};
