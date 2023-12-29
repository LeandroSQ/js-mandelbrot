import { Log } from "../utils/log";
import { StatsUtils } from "../utils/stats";

/**
 * A dummy function that returns the value of the original function.
 *
 * @param _target - The target object.
 * @param _propertyKey - The name of the property.
 * @param descriptor - The property descriptor.
 * @returns The value of the original function.
 */
function dummy(_target: object, _propertyKey: string, descriptor: PropertyDescriptor) {
	return descriptor.value;
};

/**
 * A decorator function that measures the execution time of a method and logs it to the console.
 *
 * @param tag A string that identifies the measurement.
 * @returns A decorator function that can be applied to a method.
 */
export function measure(tag: string) {
	if (!DEBUG) return dummy;

	return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
		const original = descriptor.value;
		if (!original) return original;

		descriptor.value = function (...args) {
			Log.measure(tag);
			const result = original.apply(this, args);
			Log.measure(tag);

			return result;
		};
	};
}

/**
 * Decorator that measures the average execution time of a method over a number of samples.
 *
 * @param tag A string tag to identify the measurement.
 * @param samples The number of samples to take for the average. Defaults to 100.
 * @returns A decorator function.
 */
export function measureAverage(tag: string, samples = 100) {
	if (!DEBUG) return dummy;

	return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
		const original = descriptor.value;
		if (!original) return original;

		target[`_${propertyKey}Info`] = {
			samples: samples,
			count: 0,
			sum: 0,
			minimum: Number.MAX_SAFE_INTEGER,
			maximum: Number.MIN_SAFE_INTEGER
		};

		descriptor.value = function (...args) {
			const start = performance.now();
			const result = original.apply(this, args);
			const elapsed = performance.now() - start;

			// Update average
			const info = this[`_${propertyKey}Info`];
			info.sum += elapsed;
			info.count++;
			info.minimum = Math.min(info.minimum, elapsed);
			info.maximum = Math.max(info.maximum, elapsed);

			// Log average
			if (info.count >= info.samples) {
				Log.measure(tag, info.sum / info.count, info.minimum, info.maximum);
				info.count = 0;
				info.sum = 0;
				info.minimum = Number.MAX_SAFE_INTEGER;
				info.maximum = Number.MIN_SAFE_INTEGER;
			}

			return result;
		};
	};
}

/**
 * A decorator that measures the execution time of a method over time.
 *
 * @param tag A string to identify the measurement.
 * @param interval The interval in milliseconds to log the average execution time.
 * @returns A function that decorates the target method.
 */
export function measureOverTime(tag: string, interval = 1000) {
	if (!DEBUG) return dummy;

	return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
		const original = descriptor.value;
		if (!original) return;

		target[`_${propertyKey}Info`] = {
			interval: interval,
			start: performance.now(),
			count: 0,
			sum: 0,
			minimum: Number.MAX_SAFE_INTEGER,
			maximum: Number.MIN_SAFE_INTEGER
		};

		descriptor.value = function (...args) {
			const start = performance.now();
			const result = original.apply(this, args);
			const elapsed = performance.now() - start;

			// Update average
			const info = this[`_${propertyKey}Info`];
			info.sum += elapsed;
			info.count++;
			info.minimum = Math.min(info.minimum, elapsed);
			info.maximum = Math.max(info.maximum, elapsed);

			// Log average
			if (performance.now() - info.start >= info.interval) {
				Log.measure(tag, info.sum / info.count, info.minimum, info.maximum, info.count, info.interval);
				info.start = performance.now();
				info.count = 0;
				info.sum = 0;
				info.minimum = Number.MAX_SAFE_INTEGER;
				info.maximum = Number.MIN_SAFE_INTEGER;
			}

			return result;
		};
	};
}

export function gatherStats() {
	return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
		const original = descriptor.value;
		if (!original) return;

		descriptor.value = function (...args) {
			StatsUtils.startFrame();
			const result = original.apply(this, args);

			if (result instanceof Promise) {
				result.then(() => StatsUtils.endFrame());
			} else {
				StatsUtils.endFrame();
			}

			return result;
		};
	};
}