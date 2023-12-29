precision highp float;

struct ComplexPlane {
	vec2 center;
	float size;
	float zoom;
	float maxIterations;
};

uniform vec2 u_resolution;

uniform ComplexPlane u_complexPlane;

const int MAX_ITERATIONS = 20048;

vec4 hslToRgba(vec3 hsl) {
	float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
	float x = c * (1.0 - abs(mod(hsl.x / 60.0, 2.0) - 1.0));
	float m = hsl.z - c / 2.0;

	vec3 rgb = vec3(0.0, 0.0, 0.0);
	if (hsl.x < 60.0) {
		rgb = vec3(c, x, 0.0);
	} else if (hsl.x < 120.0) {
		rgb = vec3(x, c, 0.0);
	} else if (hsl.x < 180.0) {
		rgb = vec3(0.0, c, x);
	} else if (hsl.x < 240.0) {
		rgb = vec3(0.0, x, c);
	} else if (hsl.x < 300.0) {
		rgb = vec3(x, 0.0, c);
	} else {
		rgb = vec3(c, 0.0, x);
	}

	return vec4(rgb.x + m, rgb.y + m, rgb.z + m, 1.0);
}

void main() {
	float aspectratio = u_resolution.x / u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x / u_resolution.x, 1.0 - gl_FragCoord.y / u_resolution.y);
	vec2 c = (uv - vec2(0.5)) * u_complexPlane.size / u_complexPlane.zoom + u_complexPlane.center;
	c.y /= aspectratio;

	float temp = 0.0;
	float re = 0.0;
	float im = 0.0;
	int iterations = 0;

	for (int n = 0; n < MAX_ITERATIONS; n++) {
		if ((re * re + im * im) <= 4.0 && n < int(u_complexPlane.maxIterations)) {
			temp = re * re - im * im + c.x;
			im = 2.0 * re * im + c.y;
			re = temp;
			iterations++;
		} else {
			break;
		}
	}

	if (iterations == int(u_complexPlane.maxIterations)) {
		temp = u_complexPlane.maxIterations;
	} else {
		temp = float(iterations) + 1.0 - log(log(sqrt(re * re + im * im))) / log(2.0);
	}

	// Color mapping

	/* // Teal and orange
	gl_FragColor = vec4(temp / u_complexPlane.maxIterations, 0.5, 0.5, 1.0); */

	/* // Black and white
	temp = temp / u_complexPlane.maxIterations;
	gl_FragColor = vec4(temp, temp, temp, 1.0); */

	gl_FragColor = hslToRgba(
		vec3(
			(temp / u_complexPlane.maxIterations) * 360.0,
			1.0,
			iterations == int(u_complexPlane.maxIterations) ? 0.0 : 0.5
		)
	);

	// Heatmap?
	/* gl_FragColor = hslToRgba(
		vec3(
			temp / u_complexPlane.maxIterations * 255.0,
			1.0,
			iterations == int(u_complexPlane.maxIterations) ? 0.0 : 0.5
		)
	); */
}