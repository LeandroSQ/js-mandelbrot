export async function instantiate(module, imports = {}) {
  const { exports } = await WebAssembly.instantiate(module, imports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    offset: {
      // src/assembly/mandelbrot/offset: usize
      valueOf() { return this.value; },
      get value() {
        return exports.offset.value >>> 0;
      }
    },
  }, exports);
  return adaptedExports;
}
