
/** Define the float precision */
type float = f32;

export const offset = __heap_base;

/**
 * Calculates the color for a given pixel in the Mandelbrot set.
 * It also converts HSL to RGB inside the function, the reason for this is that having another function to do this conversion would require passing arrays around, which for some reason generates a memory leak and slows down the program as it runs.
 *
 * @param mandelbrot - The value of the Mandelbrot set for the pixel.
 * @param pixelOffset - The offset of the pixel in the image buffer.
 * @param iteration - The current iteration count for the pixel.
 * @param maxIterations - The maximum number of iterations for the Mandelbrot set.
 */
@inline
function calculateColor(mandelbrot: float, pixelOffset: usize, iteration: i32, maxIterations: i32): void {
	// Calculate the color in HSL
	const hue: f32 = <f32>mandelbrot / <f32>maxIterations * 255.0;
	const saturation: f32 = 1.0;
	const lightness: f32 = iteration == maxIterations ? 0.0 : 0.5;

	// Convert HSL to RGB
	const chroma: f32 = (1.0 - <f32>Math.abs(2.0 * lightness - 1.0)) * saturation;
	const x: f32 = chroma * (1.0 - <f32>Math.abs((hue / 60.0) % 2.0 - 1.0));
	const m: f32 = lightness - chroma / 2.0;

	let r: f32 = 0.0;
	let g: f32 = 0.0;
	let b: f32 = 0.0;
	if (hue < 60.0) {
		r = chroma;
		g = x;
	} else if (hue < 120.0) {
		r = x;
		g = chroma;
	} else if (hue < 180.0) {
		g = chroma;
		b = x;
	} else if (hue < 240.0) {
		g = x;
		b = chroma;
	} else if (hue < 300.0) {
		r = x;
		b = chroma;
	} else {
		r = chroma;
		b = x;
	}

	r = (r + m) * 255.0;
	g = (g + m) * 255.0;
	b = (b + m) * 255.0;

	// Store the color in the image buffer
	store<u8>(pixelOffset, <u8>r);
	store<u8>(pixelOffset + 1, <u8>g);
	store<u8>(pixelOffset + 2, <u8>b);
	store<u8>(pixelOffset + 3, 255);
}

export function render(width: i32, height: i32, cameraX: f32, cameraY: f32, fractalSize: f32, maxIterations: i32, zoom: f32, rotation: f32): void {
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
				tmp = <float>maxIterations;
			} else {
				tmp = <float>iteration + 1.0 - <float>Math.log2(Math.log(Math.sqrt(re * re + im * im)));
			}

			index = __heap_base + (x + y * width) * 4;
			calculateColor(tmp, index, iteration, maxIterations);
		}

		tmpX = -0.5;
	}
};