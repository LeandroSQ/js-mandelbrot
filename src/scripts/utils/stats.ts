import { UIUtils } from "./ui";

export abstract class StatsUtils {

	private static fps = 0;
	private static frames = 0;
	private static frameTimeAccumulator = 0;
	private static frameTimeCount = 0;
	private static frameTimeMin = Number.MAX_SAFE_INTEGER;
	private static frameTimeMax = Number.MIN_SAFE_INTEGER;

	private static currentTime = 0;
	private static timer: DOMHighResTimeStamp = 0;
	private static resetTimer = 0;

	public static reset() {
		this.fps = 0;
		this.frames = 0;
		this.frameTimeAccumulator = 0;
		this.frameTimeCount = 0;
		this.frameTimeMin = Number.MAX_SAFE_INTEGER;
		this.frameTimeMax = Number.MIN_SAFE_INTEGER;

		UIUtils.updateStats(0, 0, 0, 0, 0);
	}

	public static startFrame() {
		this.currentTime = performance.now();
	}

	public static endFrame() {
		const now = performance.now();
		const frameTime = now - this.currentTime;

		this.frameTimeAccumulator += frameTime;
		this.frameTimeCount++;
		this.frameTimeMin = Math.min(this.frameTimeMin, frameTime);
		this.frameTimeMax = Math.max(this.frameTimeMax, frameTime);

		this.frames++;
		if (this.currentTime - this.timer >= 1000) {
			this.fps = this.frames;
			this.frames = 0;
			this.timer = this.currentTime;

			this.resetTimer++;
			if (this.resetTimer >= 10) {
				this.frameTimeMin = Number.MAX_SAFE_INTEGER;
				this.frameTimeMax = Number.MIN_SAFE_INTEGER;
				this.resetTimer = 0;
				this.frameTimeAccumulator = 0;
				this.frameTimeCount = 0;
			}

			const avgFrameTime = this.frameTimeAccumulator / this.frameTimeCount;
			UIUtils.updateStats(this.fps, 1000 / avgFrameTime, avgFrameTime, this.frameTimeMin, this.frameTimeMax);
		}

	}

}