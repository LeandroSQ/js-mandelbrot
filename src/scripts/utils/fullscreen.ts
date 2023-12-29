import { Optional } from './../types/optional';
import { Log } from "./log";

export abstract class FullscreenUtils {

	private static getPrefixedProperty<T>(source: any, property: string | Array<string>, required: boolean = true): T {
		if (Array.isArray(property)) {
			for (const override of property) {
				if (override in source) {
					return source[override];
				}
			}
		} else {
			const prefixes = ["", "webkit", "moz", "ms"];
			const keys = Object.keys(source).map(x => x.toLowerCase());
			for (const prefix of prefixes) {
				let prefixedProperty = prefix;

				if (prefix.length > 0) prefixedProperty += property[0].toUpperCase() + property.substring(1);
				else prefixedProperty += property;

				if (prefixedProperty in source || keys.includes(prefixedProperty.toLowerCase())) {
					return source[prefixedProperty];
				}
			}
		}

		if (required) throw new Error(`Property ${property} not found`);
	}

	public static async toggle(): Promise<void> {
		try {
			const element = document.getElementsByTagName("canvas")[0];
			const fullscreenElement = this.getPrefixedProperty<Optional<HTMLElement>>(document, "fullscreenElement");
			const fullscreenEnabled = this.getPrefixedProperty<boolean>(document, "fullscreenEnabled");
			const requestFullscreen = this.getPrefixedProperty<VoidFunction>(element, "requestFullscreen");

			// Really firefox? You really had to be different?
			const exitFullscreen = this.getPrefixedProperty<VoidFunction>(document, ["exitFullscreen", "msExitFullscreen", "mozCancelFullScreen", "webkitExitFullscreen"]);


			if (!fullscreenEnabled) {
				Log.error("FullscreenUtils", "Fullscreen is not enabled");
				return;
			}

			if (fullscreenElement !== null) {
				await exitFullscreen.call(document);
			} else {
				await requestFullscreen.call(element);
			}

			// Just to add a flavor on Android devices, since safari ios doesn't support anything... no fullscreen, no vibration, no nothing
			const vibrate = this.getPrefixedProperty<(amount: number) => void | undefined>(navigator, "vibrate", false);
			if (vibrate) vibrate.call(navigator, 100);
		} catch (error) {
			Log.error("FullscreenUtils", `Error while requesting fullscreen: ${error}`);
		}
	}

}