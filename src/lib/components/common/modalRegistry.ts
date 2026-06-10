class ModalRegistry {
	private stack: string[] = [];

	push(id: string) {
		if (!this.stack.includes(id)) {
			this.stack.push(id);
		}
	}

	remove(id: string) {
		this.stack = this.stack.filter((item) => item !== id);
	}

	isTop(id: string): boolean {
		return this.stack[this.stack.length - 1] === id;
	}
}

export const modalRegistry = new ModalRegistry();
