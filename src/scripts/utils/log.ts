import { Dictionary } from "../types/dictionary";

export class Log {

	private static measureMap: Dictionary<string, number> = { };

	private static logColoredText(level: keyof Console, tag: string, tagColor: string, ...args: string[]) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const func = console[level] as (...args: any) => void;
		func.call(
			console,
			`%c${level.toUpperCase()} %c[${tag}]`,
			`font-weight: bold; color: ${tagColor};`,
			"font-weight: bold; color: gray",
			...args
		);
	}

	// eslint-disable-next-line max-params
	public static measure(tag: string, elapsed: number | undefined = undefined, min: number | undefined = undefined, max: number | undefined = undefined, count: number | undefined = undefined, interval: number | undefined = undefined) {
		if (!DEBUG) return;

		if (elapsed !== undefined) {
			let message = `${tag} took: ${Math.prettifyElapsedTime(elapsed)}`;
			if (min !== undefined) message += ` | min: ${Math.prettifyElapsedTime(min)}`;
			if (max !== undefined) message += ` | max: ${Math.prettifyElapsedTime(max)}`;
			if (count !== undefined && interval !== undefined) message += ` | ${count} in ${Math.prettifyElapsedTime(interval)}`;

			this.logColoredText("debug", "measure", "lime", message);
		} else if (this.measureMap.hasOwnProperty(tag)) {
			const time = performance.now() - this.measureMap[tag];
			this.logColoredText("debug", "measure", "lime", `${tag} took: ${Math.prettifyElapsedTime(time)}`);
			delete this.measureMap[tag];
		} else {
			this.measureMap[tag] = performance.now();
		}
	}

	public static info(tag: string, ...args: string[]) {
		this.logColoredText("info", tag, "turquoise", ...args);
	}

	public static warn(tag: string, ...args: string[]) {
		this.logColoredText("warn", tag, "yellow", ...args);
	}

	public static error(tag: string, ...args: string[]) {
		this.logColoredText("error", tag, "red", ...args);
	}

	public static debug(tag: string, ...args: string[]) {
		if (!DEBUG) return;

		this.logColoredText("debug", tag, "magenta", ...args);
	}

};