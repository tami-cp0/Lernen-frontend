'use client';

/**
 * Hook that previously calculated keyboard offset.
 * Now returns 0 to prevent layout shifts when keyboard appears.
 * The MessageComposer stays fixed at the bottom regardless of keyboard state.
 */
export function useKeyboardOffset() {
	return 0;
}
