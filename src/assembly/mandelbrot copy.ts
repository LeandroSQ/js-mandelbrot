/* eslint-disable max-params */
/* eslint-disable max-statements */
type float = f32;

// Define the Camera type
export class Camera {
	width: i32 = 0;
	height: i32 = 0;
	x: f32 = 0.0;
	y: f32 = 0.0;
	fractalSize: f32 = 0.0;
	maxIterations: i32 = 0;
	zoom: f32 = 0.0;
	rotation: f32 = 0.0;
}

// export const offset = __heap_base;

function hslToRgba(h: float, s: float, l: float): Array<u8> {
	const c: float = <float>(1.0 - Math.abs(2.0 * l - 1.0)) * s;
	const x: float = c * <float>(1.0 - Math.abs((h / 60.0) % 2.0 - 1.0));
	const m: float = l - c / 2.0;

	let rgb: Array<float> = [0.0, 0.0, 0.0];
	if (h < <float>60.0) {
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
		<u8>((rgb[0] + m) * 255.0),
		<u8>((rgb[1] + m) * 255.0),
		<u8>((rgb[2] + m) * 255.0),
	];
}

// @inline
function calculateColor(mandelbrot: float, pixelOffset: i32, maxIterations: i32): void {
	const hue: float = mandelbrot / <float>maxIterations;
	const saturation: float = 1.0;
	const lightness: float = mandelbrot >= <float>maxIterations ? 0.0 : 0.5;

	const color = hslToRgba(hue * 360.0, saturation, lightness);

	const output = color[0] << 24 | color[1] << 16 | color[2] << 8 | 255;
	store<u32>(pixelOffset, output);

	/* store<u8>(pixelOffset, color[0]);
	store<u8>(pixelOffset + 1, color[1]);
	store<u8>(pixelOffset + 2, color[2]);
	store<u8>(pixelOffset + 3, 255); */
}

export function render(camera: Camera): void {
	// let size = camera.width * camera.height * 4;
	// for (let i = 0; i < size; i += 4) {
	// 	store<u8>(i, 0);
	// 	store<u8>(i + 1, 0);
	// 	store<u8>(i + 2, 0);
	// 	store<u8>(i + 3, 255);
	// }
	// return;

	// TODO: Implement SIMD
	// TODO: Implement multithreading
	let x: i32 = 0;
	let y: i32 = 0;
	let tmp: float = 0.0;
	let re: float = 0.0;
	let im: float = 0.0;
	let iteration: i32 = 0;
	let index: i32 = 0;
	let color: float = 0;
	const aspectRatio: float = <float>camera.width / <float>camera.height;
	const zoomFactor: float = camera.fractalSize / camera.zoom;
	const stepX: float = 1.0 / <float>camera.width;
	const stepY: float = 1.0 / <float>camera.height;
	let complexReal: float = camera.x;
	let complexImaginary: float = camera.y;
	let tmpX: float = -0.5;
	let tmpY: float = -0.5;

	for (y = 0; y < <i32>camera.height; y++) {
		tmpY += stepY;
		complexImaginary = (tmpY * zoomFactor + camera.y) / aspectRatio;
		for (x = 0; x < <i32>camera.width; x++) {
			tmpX += stepX;
			complexReal = (tmpX * zoomFactor + camera.x);

			re = 0.0;
			im = 0.0;

			for (iteration = 0; (re * re + im * im) <= 4.0 && iteration < <i32>camera.maxIterations; iteration++) {
				tmp = re * re - im * im + complexReal;
				im = 2.0 * re * im + complexImaginary;
				re = tmp;
			}

			if (iteration === <i32>camera.maxIterations) {
				color = <float>camera.maxIterations;
			} else {
				color = <float>iteration + <float>(1.0 - Math.log2(Math.log(Math.sqrt(re * re + im * im))));
			}

			// index = (x + y * <i32>camera.width) * 4;
			index += 4;
			calculateColor(color, index, <i32>camera.maxIterations);
		}
		tmpX = -0.5;
	}
}