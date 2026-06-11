let stack: any[] = [];

export const modalStack = {
	push(id: any) {
		if (!stack.includes(id)) {
			stack.push(id);
		}
	},
	pop(id: any) {
		stack = stack.filter((x) => x !== id);
	},
	isTop(id: any) {
		return stack[stack.length - 1] === id;
	},
	getStack() {
		return stack;
	}
};
