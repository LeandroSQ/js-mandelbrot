struct VertexOutputs {
	@builtin(position) position: vec4f
}

struct Dimensions {
	width: f32,
	height: f32
}

struct Complex {
	real: f32,
	imaginary: f32
}

struct ComplexPlane {
	center: vec2f,
	size: f32,
	zoom: f32,
	maxIterations: f32
}

// Uniforms
@group(0) @binding(0) var<uniform> dimensions: Dimensions;
@group(0) @binding(1) var<uniform> complexPlane: ComplexPlane;

// Utilities
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

@vertex
fn vertexMain(@location(0) position: vec4f) -> VertexOutputs {
	return VertexOutputs(position);
}

@fragment
fn fragmentMain(input: VertexOutputs) -> @location(0) vec4f {
	let aspectRatio = dimensions.width / dimensions.height;
	let c = Complex(
		(input.position.x / dimensions.width - 0.5) * complexPlane.size / complexPlane.zoom + complexPlane.center.x,
		((input.position.y / dimensions.height - 0.5) * complexPlane.size / complexPlane.zoom + complexPlane.center.y) / aspectRatio
	);

	var temp: f32 = 0.0;
	var z = Complex(0.0, 0.0);
	var iterations: i32 = 0;

	// Mandelbrot
	for (; (z.real * z.real + z.imaginary * z.imaginary) <= 4.0 && iterations < i32(complexPlane.maxIterations); iterations++) {
		temp = z.real * z.real - z.imaginary * z.imaginary + c.real;
		z.imaginary = 2.0 * z.real * z.imaginary + c.imaginary;
		z.real = temp;
	}
	if (iterations == i32(complexPlane.maxIterations)) {
		temp = complexPlane.maxIterations;
	} else {
		temp = f32(iterations) + 1.0 - log2(log(sqrt(z.real * z.real + z.imaginary * z.imaginary)));
	}

	// Color mapping

	/* // Teal and orange
	return vec4f(temp / f32(complexPlane.maxIterations), 0.5, 0.5, 1.0); */

	/* // Black and white
	temp = temp / f32(complexPlane.maxIterations);
	return vec4f(temp, temp, temp, 1.0); */

	// Heatmap?
	return hslToRgba(
		vec3f(
			(temp / complexPlane.maxIterations) * 360.0,
			1.0,
			select(0.5, 0.0, iterations == i32(complexPlane.maxIterations))
		)
	);

	/*
	// Psychedelic
	return hslToRgba(
		vec3f(
			pow((temp / complexPlane.maxIterations) * 360, 1.5) % 360,
			1.0,
			select(0.5, 0.0, iterations == i32(complexPlane.maxIterations))
		)
	); */
}