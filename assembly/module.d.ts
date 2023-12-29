declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /** src/assembly/mandelbrot/offset */
  export const offset: {
    /** @type `usize` */
    get value(): number
  };
  /**
   * src/assembly/mandelbrot/render
   * @param width `i32`
   * @param height `i32`
   * @param cameraX `f32`
   * @param cameraY `f32`
   * @param fractalSize `f32`
   * @param maxIterations `i32`
   * @param zoom `f32`
   * @param rotation `f32`
   */
  export function render(width: number, height: number, cameraX: number, cameraY: number, fractalSize: number, maxIterations: number, zoom: number, rotation: number): void;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
}): Promise<typeof __AdaptedExports>;
