export abstract class Input {

	public static isMouseDown = false;
	public static wasMouseDown = false;
	private static lastMousePosition = { x: 0, y: 0 };
	public static mousePosition = { x: 0, y: 0 };
	public static mouseDelta = { x: 0, y: 0 };
	public static wheelDelta = 0;

	static setup(element: HTMLElement) {
		element.addEventListener("mousedown", this.onMouseDown.bind(this));
		element.addEventListener("mouseup", this.onMouseUp.bind(this));
		element.addEventListener("mousemove", this.onMouseMove.bind(this));
		element.addEventListener("mouseout", this.onMouseUp.bind(this));
		element.addEventListener("wheel", this.onMouseWheel.bind(this), { passive: true });
	}

	static update() {
		this.wasMouseDown = this.isMouseDown;
		this.lastMousePosition = this.mousePosition;
		this.wheelDelta = 0;
		this.mouseDelta = { x: 0, y: 0 };
	}

	private static updateMousePosition(e: MouseEvent) {
		if (!e.target) return;
		const x = e.layerX ?? (e.clientX ?? e.offsetX - e.target.offsetLeft);
		const y = e.layerY ?? (e.clientY ?? e.offsetY - e.target.offsetTop);

		this.mouseDelta.x = x - this.lastMousePosition.x;
		this.mouseDelta.y = y - this.lastMousePosition.y;
		this.mousePosition.x = x;
		this.mousePosition.y = y;
	}

	private static onMouseDown(e: MouseEvent) {
		this.isMouseDown = true;
		this.updateMousePosition(e);
	}

	private static onMouseUp(e: MouseEvent) {
		this.isMouseDown = false;
		this.updateMousePosition(e);
	}

	private static onMouseMove(e: MouseEvent) {
		this.updateMousePosition(e);
	}

	private static onMouseWheel(e: WheelEvent) {
		this.wheelDelta = e.deltaY;
	}

}