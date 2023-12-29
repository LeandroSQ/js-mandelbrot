export abstract class StorageUtils {

	public static get<T>(key: string, defaultValue: T): T {
		const value = localStorage.getItem(key);

		if (value) {
			return JSON.parse(value);
		}

		return defaultValue;
	}

	public static set<T>(key: string, value: T) {
		if (value !== null) {
			const json = JSON.stringify(value);
			localStorage.setItem(key, json);
		} else {
			localStorage.removeItem(key);
		}
	}

}