import { Optional } from './../types/optional';
import { Log } from "./log";

export abstract class FullscreenUtils {

	public static async toggle(): Promise<void> {
		try {
			const element = document.getElementsByTagName("canvas")[0];
			const fullscreenEnabled = window.getPrefixedProperty<boolean>(document, "fullscreenEnabled", true);
			const requestFullscreen = window.getPrefixedProperty<VoidFunction>(element, "requestFullscreen", true);

			// Really firefox? You really had to be different?
			const exitFullscreen = window.getPrefixedProperty<VoidFunction>(document, ["exitFullscreen", "msExitFullscreen", "mozCancelFullScreen", "webkitExitFullscreen"], true);


			if (!fullscreenEnabled) {
				Log.error("FullscreenUtils", "Fullscreen is not enabled");
				return;
			}

			if (this.isFullscreen()) {
				await exitFullscreen.call(document);
			} else {
				await requestFullscreen.call(element);
			}

			// Just to add a flavor on Android devices, since safari ios doesn't support anything... no fullscreen, no vibration, no nothing
			const vibrate = window.getPrefixedProperty<(amount: number) => void | undefined>(navigator, "vibrate", false);
			if (vibrate) vibrate.call(navigator, 100);
		} catch (error) {
			Log.error("FullscreenUtils", `Error while requesting fullscreen: ${error}`);
		}
	}

	public static isFullscreen(): boolean {
		const fullscreenElement = window.getPrefixedProperty<Optional<HTMLElement>>(document, "fullscreenElement", true);
		return fullscreenElement !== null;
	}

}