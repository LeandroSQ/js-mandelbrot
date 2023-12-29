struct VertexOutputs {
	@builtin(position) position: vec4f
}

struct Dimensions {
	width: f32,
	height: f32,
	time: f32
}

struct Complex {
	real: f32,
	imaginary: f32
}

fn addComplex(a: Complex, b: Complex) -> Complex {
	return Complex(a.real + b.real, a.imaginary + b.imaginary);
}

fn multiplyComplex(a: Complex, b: Complex) -> Complex {
	return Complex(a.real * b.real - a.imaginary * b.imaginary, a.real * b.imaginary + a.imaginary * b.real);
}

fn absComplex(a: Complex) -> f32 {
	return sqrt(a.real * a.real + a.imaginary * a.imaginary);
}

fn logComplex(a: Complex) -> Complex {
	let r: f32 = absComplex(a);
    let theta: f32 = atan2(a.imaginary, a.real);
    let log_r: f32 = log(r);
    return Complex(log_r, theta);
}

fn log2Complex(a: Complex) -> Complex {
	let r: f32 = absComplex(a);
	let theta: f32 = atan2(a.imaginary, a.real);
	let log_r: f32 = log2(r);
	return Complex(log_r, theta);
}

fn squareComplex(a: Complex) -> Complex {
	return multiplyComplex(a, a);
}

fn lessOrEqualsComplex(a: Complex, b: f32) -> bool {
	return a.real <= b;
}

fn hslToRgba(hsl: vec3f) -> vec4f {
	var c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
	var x = c * (1.0 - abs((hsl.x / 60.0) % 2.0 - 1.0));
	var m = hsl.z - c / 2.0;

	var rgb = vec3f(0.0, 0.0, 0.0);
	if (hsl.x < 60.0) {
		rgb = vec3f(c, x, 0.0);
	} else if (hsl.x < 120.0) {
		rgb = vec3f(x, c, 0.0);
	} else if (hsl.x < 180.0) {
		rgb = vec3f(0.0, c, x);
	} else if (hsl.x < 240.0) {
		rgb = vec3f(0.0, x, c);
	} else if (hsl.x < 300.0) {
		rgb = vec3f(x, 0.0, c);
	} else {
		rgb = vec3f(c, 0.0, x);
	}

	return vec4f(rgb.x + m, rgb.y + m, rgb.z + m, 1.0);
}

fn calculateColor(mandelbrot: f32) -> vec4f {
	var hue = mandelbrot / f32(MAX_ITERATIONS);
	var saturation = 1.0;
	var lightness = 0.5;
	if (mandelbrot >= f32(MAX_ITERATIONS)) {
		lightness = 0.0;
	}
	var hsl = vec3f(hue * 360.0, saturation, lightness);

	return hslToRgba(hsl);
}

fn mandelbrot(complex: Complex) -> f32 {
	var accumulated = Complex(0, 0);
	var iteration: i32 = 0;
	var max = i32(f32(MAX_ITERATIONS) * (1.0 + pow(dimensions.time, 2.0) / ZOOM));
	while (absComplex(accumulated) <= 2.0 && iteration < max) {
		accumulated = addComplex(squareComplex(accumulated), complex);
		iteration += 1;
	}

	if (iteration == max) {
		return f32(max);
	}

	return f32(iteration) + 1.0 - log2(log(absComplex(accumulated)));
}

@group(0) @binding(0) var<uniform> dimensions: Dimensions;

@vertex
fn vertexMain(@location(0) position: vec4f) -> VertexOutputs {
	var out: VertexOutputs;
	out.position = vec4f(position.x, position.y, 0.0, 1.0);// (x, y, z, w)
	return out;
}

const MAX_ITERATIONS: i32 = 259;

const ZOOM: f32 = 50.1;
const complexPlaneCenter = vec2f(-0.95, 0.0);
const complexPlaneSize = 2.0;

@fragment
fn fragmentMain(input: VertexOutputs) -> @location(0) vec4f {
	// return vec4f(dimensions.time, 0.0, 0.0, 1.0);

  	// Map screen coordinates to complex plane using zoom towards the center and dimensions
	var a = 1.0 + pow(dimensions.time, 2.0) / ZOOM;
	var complexCoord = vec2f(
		(input.position.x / dimensions.width - 0.5) * complexPlaneSize / a + complexPlaneCenter.x,
		(input.position.y / dimensions.height - 0.5) * complexPlaneSize / a + (complexPlaneCenter.y + pow(dimensions.time, 0.75) / (ZOOM))
	);

	var complex = Complex(complexCoord.x, complexCoord.y);

	var mandelbrotValue = mandelbrot(complex);

	return calculateColor(mandelbrotValue);
}

// TODO: Add zooming based on the mouse position
// TODO: Restrict the zooming to the center of the screen