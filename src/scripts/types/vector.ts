/**
 * A class containing static methods for vector math operations.
 */
export abstract class VectorMath {

	/**
	 * Calculates the angle between two vectors.
	 *
	 * @param {Vector} a - The first vector.
	 * @param {Vector} b - The second vector.
	 * @returns The angle between the two vectors in radians.
	 */
	public static angle(a: Vector, b: Vector): number {
		return Math.atan2(b.y - a.y, b.x - a.x);
	}

	/**
	 * Calculates the distance between two vectors.
	 *
	 * @param a - The first vector.
	 * @param b - The second vector.
	 * @returns The distance between the two vectors.
	 */
	public static distance(a: Vector, b: Vector): number {
		return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
	}

	/**
	 * Rotates a vector around a center point by a given angle.
	 *
	 * @param point - The vector to rotate.
	 * @param center - The center point to rotate around.
	 * @param angle - The angle to rotate by, in radians.
	 * @returns The rotated vector.
	 */
	public static rotateAround(point: Vector, center: Vector, angle: number): Vector {
		const s = Math.sin(angle);
		const c = Math.cos(angle);

		const x = point.x - center.x;
		const y = point.y - center.y;

		const xnew = x * c - y * s;
		const ynew = x * s + y * c;

		return { x: xnew + center.x, y: ynew + center.y };
	}

	/**
	 * Scales a vector around a center point by a given factor.
	 *
	 * @param point - The vector to scale.
	 * @param center - The center point to scale around.
	 * @param scale - The factor to scale by.
	 * @returns The scaled vector.
	 */
	public static scaleAround(point: Vector, center: Vector, scale: number): Vector {
		const x = point.x - center.x;
		const y = point.y - center.y;

		const xnew = x * scale;
		const ynew = y * scale;

		return { x: xnew + center.x, y: ynew + center.y };
	}

	/**
	 * Translates a vector by a given delta.
	 *
	 * @param point - The vector to translate.
	 * @param delta - The delta to translate by.
	 * @returns The translated vector.
	 */
	public static translate(point: Vector, delta: Vector): Vector {
		return { x: point.x + delta.x, y: point.y + delta.y };
	}

	/**
	 * Scales a vector by a given scalar.
	 *
	 * @param point - The vector to scale.
	 * @param scalar - The scalar to scale by.
	 * @returns The scaled vector.
	 */
	public static scale(point: Vector, scalar: number): Vector {
		return { x: point.x * scalar, y: point.y * scalar };
	}

	/**
	 * Calculates the center point between two vectors.
	 *
	 * @param a - The first vector.
	 * @param b - The second vector.
	 * @returns The center point between the two vectors.
	 */
	public static center(a: Vector, b: Vector): Vector {
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	}

	/**
	 * Calculates the delta between two vectors.
	 * @param a - The first vector.
	 * @param b - The second vector.
	 * @returns The delta between the two vectors.
	 */
	public static difference(a: Vector, b: Vector): Vector {
		return { x: a.x - b.x, y: a.y - b.y };
	}

}

export type Vector = { x: number, y: number };