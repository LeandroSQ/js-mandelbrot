import { RGB } from "../types/rgb";

export class Color {

	static hslToRgba(h: number, s: number, l: number): RGB {
		const c = (1.0 - Math.abs(2.0 * l - 1.0)) * s;
		const x = c * (1.0 - Math.abs((h / 60.0) % 2.0 - 1.0));
		const m = l - c / 2.0;

		let rgb = [0.0, 0.0, 0.0];
		if (h < 60.0) {
			rgb = [c, x, 0.0];
		} else if (h < 120.0) {
			rgb = [x, c, 0.0];
		} else if (h < 180.0) {
			rgb = [0.0, c, x];
		} else if (h < 240.0) {
			rgb = [0.0, x, c];
		} else if (h < 300.0) {
			rgb = [x, 0.0, c];
		} else {
			rgb = [c, 0.0, x];
		}

		return [
			Math.floor((rgb[0] + m) * 255.0),
			Math.floor((rgb[1] + m) * 255.0),
			Math.floor((rgb[2] + m) * 255.0),
		];
	}

	static calculateMandelbrotColor(mandelbrot: number, maxIterations: number): [number, number, number] {
		const hue = mandelbrot / maxIterations;
		const saturation = 1.0;
		const lightness = mandelbrot >= maxIterations ? 0.0 : 0.5;

		return Color.hslToRgba(hue * 360.0, saturation, lightness);
	}

}