export abstract class FileUtils {

	static async load(filename: string) {
		const request = await fetch(filename);

		return await request.text();
	}

}