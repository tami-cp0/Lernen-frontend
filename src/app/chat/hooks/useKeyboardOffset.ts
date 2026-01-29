'use client';
import { useEffect, useState } from 'react';

export function useKeyboardOffset() {
	const [offset, setOffset] = useState(0);

	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;

		const update = () => {
			const keyboardHeight =
				window.innerHeight - vv.height - vv.offsetTop;
			setOffset(Math.max(keyboardHeight, 0));
		};

		update();
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);

		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
		};
	}, []);

	return offset;
}
