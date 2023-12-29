
type float = f32;

export const offset = __heap_base;

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

function calculateColor(mandelbrot: float, pixelOffset: usize, iteration: i32, maxIterations: i32): void {
	const color = hslToRgba(
		mandelbrot / <float>maxIterations * 255.0,
		1.0,
		iteration == maxIterations ? 0.0 : 0.5
	);

	store<u8>(pixelOffset, color[0]);
	store<u8>(pixelOffset + 1, color[1]);
	store<u8>(pixelOffset + 2, color[2]);
	store<u8>(pixelOffset + 3, 255);
}

export function render(width: i32, height: i32, cameraX: float, cameraY: float, fractalSize: float, maxIterations: i32, zoom: float, rotation: float): void {
	const aspectRatio: float = <float>width / <float>height;
	const zoomFactor: float = fractalSize / zoom;
	const stepX: float = 1.0 / <float>width;
	const stepY: float = 1.0 / <float>height;

	let complexReal: float = cameraX;
	let complexImaginary: float = cameraY;
	let tmpX: float = -0.5;
	let tmpY: float = -0.5;

	let tmp: float = 0.0;
	let re: float = 0.0;
	let im: float = 0.0;
	let iteration: i32 = 0;
	let color: float = 0.0;
	let index: usize = 0;

	for (let y: i32 = 0; y < height; y++) {
		tmpY += stepY;
		complexImaginary = (tmpY * zoomFactor + cameraY) / aspectRatio;

		for (let x: i32 = 0; x < width; x++) {
			tmpX += stepX;
			complexReal = (tmpX * zoomFactor + cameraX);

			re = 0.0;
			im = 0.0;

			for (iteration = 0; (re * re + im * im) <= 4.0 && iteration < maxIterations; iteration++) {
				tmp = re * re - im * im + complexReal;
				im = 2.0 * re * im + complexImaginary;
				re = tmp;
			}

			if (iteration === maxIterations) {
				color = <float>maxIterations;
			} else {
				color = <float>iteration + 1.0 - <float>Math.log2(Math.log(Math.sqrt(re * re + im * im)));
			}

			index = __heap_base + (x + y * width) * 4;
			calculateColor(color, index, iteration, maxIterations);
		}

		tmpX = -0.5;
	}
};