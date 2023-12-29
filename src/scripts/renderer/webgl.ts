import { CanvasContextType } from "../types/canvas-context-type";
import { IFractal } from "../types/ifractal";
import { FileUtils } from "../utils/file";
import { Optional } from "../types/optional";
import { Log } from "../utils/log";
import { measure, measureOverTime } from "../decorators/measure";
import { Camera } from "../types/camera";

export class FractalWebGL implements IFractal {

	private shaderProgram: Optional<WebGLProgram> = null;

	// Attributes
	private attributePositionLocation = -1;

	// Uniforms
	private uniformResolutionLocation: Optional<WebGLUniformLocation> = null;
	private uniformComplexPlaneCenterLocation: Optional<WebGLUniformLocation> = null;
	private uniformComplexPlaneSizeLocation: Optional<WebGLUniformLocation> = null;
	private uniformComplexPlaneZoomLocation: Optional<WebGLUniformLocation> = null;
	private uniformComplexPlaneMaxIterationsLocation: Optional<WebGLUniformLocation> = null;

	// Buffers
	private positionBuffer: WebGLBuffer | null = null;

	getCanvasType(): CanvasContextType {
		return CanvasContextType.WEBGL;
	}

	private async loadShader(gl: WebGL2RenderingContext, filename: string, type: number): Promise<WebGLShader> {
		Log.info("FractalWebGL", `Loading shader ${filename}...`);

		const source = await FileUtils.load(filename);
		const shader = gl.createShader(type);
		if (!shader) throw new Error("Failed to create shader");

		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(`Failed to compile shader: ${info}`);
		}

		return shader;
	}

	private setupBuffers(gl: WebGL2RenderingContext) {
		Log.debug("FractalWebGL", "Setting up buffers...");
		if (!this.shaderProgram) throw new Error("Shader program not initialized");

		// Position
		this.attributePositionLocation = gl.getAttribLocation(this.shaderProgram, "a_position");
		this.positionBuffer = gl.createBuffer();
		if (!this.positionBuffer) {
			gl.deleteBuffer(this.positionBuffer);
			throw new Error("Failed to create position buffer");
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		const vertices = new Float32Array([1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		// Resolution
		this.uniformResolutionLocation = gl.getUniformLocation(this.shaderProgram, "u_resolution");

		// Complex plane
		this.uniformComplexPlaneCenterLocation = gl.getUniformLocation(this.shaderProgram, "u_complexPlane.center");
		this.uniformComplexPlaneSizeLocation = gl.getUniformLocation(this.shaderProgram, "u_complexPlane.size");
		this.uniformComplexPlaneZoomLocation = gl.getUniformLocation(this.shaderProgram, "u_complexPlane.zoom");
		this.uniformComplexPlaneMaxIterationsLocation = gl.getUniformLocation(this.shaderProgram, "u_complexPlane.maxIterations");
	}

	private async loadShaders(gl: WebGL2RenderingContext) {
		if (!this.shaderProgram) throw new Error("Shader program not initialized");

		const vertexShader = await this.loadShader(gl, "/shaders/webgl/vertex.glsl", gl.VERTEX_SHADER);
		const fragmentShader = await this.loadShader(gl, "/shaders/webgl/fragment.glsl", gl.FRAGMENT_SHADER);
		gl.attachShader(this.shaderProgram, vertexShader);
		gl.attachShader(this.shaderProgram, fragmentShader);
	}

	@measure("WEBGL-SETUP")
	async setup(gl: WebGL2RenderingContext) {
		this.shaderProgram = gl.createProgram();
		if (!this.shaderProgram) throw new Error(`Failed to create shader program ${gl.getError()}`);

		await this.loadShaders(gl);

		gl.linkProgram(this.shaderProgram);
		gl.validateProgram(this.shaderProgram);
		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(this.shaderProgram);
			gl.deleteProgram(this.shaderProgram);
			throw new Error(`Failed to link shader program: ${info}`);
		}

		this.setupBuffers(gl);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

	private writeBuffers(gl: WebGL2RenderingContext, camera: Camera) {
		if (!this.positionBuffer) throw new Error("Position buffer not initialized");
		if (this.attributePositionLocation < 0) throw new Error("Position attribute not initialized");
		if (!this.uniformResolutionLocation) throw new Error("Resolution uniform not initialized");
		if (!this.uniformComplexPlaneCenterLocation) throw new Error("Complex plane center uniform not initialized");
		if (!this.uniformComplexPlaneSizeLocation) throw new Error("Complex plane size uniform not initialized");
		if (!this.uniformComplexPlaneSizeLocation) throw new Error("Complex plane zoom uniform not initialized");
		if (!this.uniformComplexPlaneZoomLocation) throw new Error("Complex plane max iterations uniform not initialized");
		if (!this.uniformComplexPlaneMaxIterationsLocation) throw new Error("Complex plane max iterations uniform not initialized");

		// Position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(this.attributePositionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.attributePositionLocation);

		// Uniforms
		gl.uniform2f(this.uniformResolutionLocation, camera.viewport.width, camera.viewport.height);
		gl.uniform2fv(this.uniformComplexPlaneCenterLocation, [camera.position.x, camera.position.y]);
		gl.uniform1f(this.uniformComplexPlaneSizeLocation, camera.fractalSize);
		gl.uniform1f(this.uniformComplexPlaneZoomLocation, camera.zoom);
		gl.uniform1f(this.uniformComplexPlaneMaxIterationsLocation, camera.maxIterations);
	}

	@measureOverTime("WEBGL-STEP")
	async step(gl: WebGL2RenderingContext, camera: Camera) {
		if (!this.shaderProgram) throw new Error("Shader program not initialized");

		// Resize viewport if necessary
		const currentViewport: Int32Array = gl.getParameter(gl.VIEWPORT);
		if (currentViewport[2] !== camera.viewport.width || currentViewport[3] !== camera.viewport.height) {
			gl.viewport(0, 0, camera.viewport.width, camera.viewport.height);
		}

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(this.shaderProgram);

		this.writeBuffers(gl, camera);

		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}

}