/* eslint-disable max-statements */
import { CanvasContextType } from "../types/canvas-context-type";
import { IFractal } from "../types/ifractal";
import { Optional } from "../types/optional";
import { Log } from "../utils/log";
import { measure, measureOverTime } from "../decorators/measure";
import { Camera } from "../types/camera";
import { FileUtils } from "../utils/file";

export class FractalWebGPU implements IFractal {

	private adapter: Optional<GPUAdapter> = null;
	private device: Optional<GPUDevice> = null;
	private shaderModule: Optional<GPUShaderModule> = null;
	private pipeline: Optional<GPURenderPipeline> = null;
	private bindGroup: Optional<GPUBindGroup> = null;

	// Buffers
	private vertexBuffer: Optional<GPUBuffer> = null;
	private vertices = new Float32Array([
		// X, Y,
		-1, -1, // Triangle 1
		1, -1,
		1, 1,
		-1, -1, // Triangle 2
		1, 1,
		-1, 1
	]);

	private dimensionBuffer: Optional<GPUBuffer> = null;
	private dimensions = new Float32Array([
		0, 0
	]);

	private complexPlaneBuffer: Optional<GPUBuffer> = null;
	private complexPlane = new Float32Array([
		0, 0, 0, 0, 0, 0
	]);

	getCanvasType(): CanvasContextType {
		return CanvasContextType.WEBGPU;
	}

	private createVertexBuffer() {
		if (!this.device) throw new Error("Device not initialized");

		this.vertexBuffer = this.device.createBuffer({
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		});
		this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices, 0, this.vertices.length);
	}

	private createDimensionBuffer() {
		if (!this.device) throw new Error("Device not initialized");

		this.dimensionBuffer = this.device.createBuffer({
			label: "Dimension uniforms",
			size: this.dimensions.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});
		this.device.queue.writeBuffer(this.dimensionBuffer, 0, this.dimensions, 0, this.dimensions.length);
	}

	private createComplexPlaneBuffer() {
		if (!this.device) throw new Error("Device not initialized");

		this.complexPlaneBuffer = this.device.createBuffer({
			label: "Complex plane uniforms",
			size: this.complexPlane.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});
		this.device.queue.writeBuffer(this.complexPlaneBuffer, 0, this.complexPlane, 0, this.complexPlane.length);
	}

	private async setupShaders() {
		if (!this.device) throw new Error("Device not initialized");

		const shaderFileName = "shaders/webgpu/mandelbrot.wgsl";
		Log.info("FractalWebGPU", `Loading shader ${shaderFileName}...`);
		const shaderSource = await FileUtils.load(shaderFileName);
		Log.debug("FractalWebGPU", `Shader source is ${shaderSource.length} characters long`);

		this.shaderModule = this.device.createShaderModule({ code: shaderSource });
		if (!this.shaderModule) throw new Error("Could not create shader module");
		this.shaderModule.label = shaderFileName;
	}

	private createRenderingPipeline(colorFormat: GPUTextureFormat) {
		if (!this.device) throw new Error("Device not initialized");
		if (!this.shaderModule) throw new Error("Shader module not initialized");

		const vertexBuffers: Array<GPUVertexBufferLayout> = [
			{
				attributes: [
					{
						shaderLocation: 0, // position
						offset: 0,
						format: "float32x2",
					}
				],
				arrayStride: 8
			}
		];
		const pipelineDescriptor: GPURenderPipelineDescriptor = {
			vertex: {
				module: this.shaderModule,
				entryPoint: "vertexMain",
				buffers: vertexBuffers,
			},
			fragment: {
				module: this.shaderModule,
				entryPoint: "fragmentMain",
				targets: [
					{
						format: colorFormat,
					}
				]
			},
			layout: "auto",
		};
		this.pipeline = this.device.createRenderPipeline(pipelineDescriptor);
	}

	private createBindingGroups() {
		if (!this.device) throw new Error("Device not initialized");
		if (!this.pipeline) throw new Error("Pipeline not initialized");
		if (!this.dimensionBuffer) throw new Error("Dimension buffer not initialized");
		if (!this.complexPlaneBuffer) throw new Error("Complex plane buffer not initialized");

		this.bindGroup = this.device.createBindGroup({
			label: "Main bind group",
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				// Dimensions
				{
					binding: 0,
					resource: {
						buffer: this.dimensionBuffer
					}
				},
				// Complex plane
				{
					binding: 1,
					resource: {
						buffer: this.complexPlaneBuffer
					}
				}
			]
		});
	}

	@measure("WEB-GPU setup")
	async setup(ctx: GPUCanvasContext) {
		if (!("gpu" in navigator) && !("webgpu" in navigator)) {
			throw new Error("WebGPU not supported");
		}

		this.adapter = await navigator.gpu.requestAdapter();
		if (!this.adapter) throw new Error("Could not get adapter");

		this.device = await this.adapter.requestDevice();
		if (!this.device) throw new Error("Could not get device");

		await this.setupShaders();
		if (!this.shaderModule) throw new Error("Shader module not initialized");

		const colorFormat = navigator.gpu.getPreferredCanvasFormat();
		Log.info("FractalWebGPU", `Preferred canvas format: ${colorFormat}`);

		ctx.configure({
			device: this.device,
			format: colorFormat,
			alphaMode: "premultiplied"
		});

		// Create buffers
		this.createVertexBuffer();
		if (!this.vertexBuffer) throw new Error("Vertex buffer not initialized");
		this.createDimensionBuffer();
		if (!this.dimensionBuffer) throw new Error("Dimension buffer not initialized");
		this.createComplexPlaneBuffer();
		if (!this.complexPlaneBuffer) throw new Error("Complex plane buffer not initialized");

		// Create pipeline
		this.createRenderingPipeline(colorFormat);
		if (!this.pipeline) throw new Error("Pipeline not initialized");

		this.createBindingGroups();
	}

	private writeBuffers(camera: Camera) {
		if (!this.device) throw new Error("Device not initialized");
		if (!this.dimensionBuffer || !this.complexPlaneBuffer) throw new Error("Buffers not initialized");

		// Update dimensions
		if (this.dimensions[0] !== camera.viewport.width || this.dimensions[1] !== camera.viewport.height) {
			this.dimensions[0] = camera.viewport.width;
			this.dimensions[1] = camera.viewport.height;
			this.device.queue.writeBuffer(this.dimensionBuffer, 0, this.dimensions, 0, this.dimensions.length);
		}

		// Update complex plane
		if (this.complexPlane[0] !== camera.position.x || this.complexPlane[1] !== camera.position.y || this.complexPlane[2] !== camera.fractalSize || this.complexPlane[3] !== camera.zoom || this.complexPlane[4] !== camera.maxIterations) {
			this.complexPlane[0] = camera.position.x;
			this.complexPlane[1] = camera.position.y;
			this.complexPlane[2] = camera.fractalSize;
			this.complexPlane[3] = camera.zoom;
			this.complexPlane[4] = camera.maxIterations;
			this.device.queue.writeBuffer(this.complexPlaneBuffer, 0, this.complexPlane, 0, this.complexPlane.length);
		}
	}

	@measureOverTime("WEB-GPU step")
	async step(ctx: GPUCanvasContext, camera: Camera) {
		if (!this.device) throw new Error("Device not initialized");
		if (!this.pipeline) throw new Error("Pipeline not initialized");

		const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
		const commandEncoder = this.device.createCommandEncoder();
		const passEncoder = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					clearValue: clearColor,
					loadOp: "clear",
					storeOp: "store",
					view: ctx.getCurrentTexture().createView()
				}
			],
		});

		this.writeBuffers(camera);

		passEncoder.setPipeline(this.pipeline);
		passEncoder.setVertexBuffer(0, this.vertexBuffer);
		passEncoder.setBindGroup(0, this.bindGroup);
		passEncoder.draw(this.vertices.length / 2, 1, 0, 0);

		passEncoder.end();
		this.device.queue.submit([commandEncoder.finish()]);
	}

}