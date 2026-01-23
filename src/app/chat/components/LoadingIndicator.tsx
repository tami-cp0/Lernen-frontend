import { useState, useEffect, forwardRef } from 'react';

/**
 * LoadingIndicator Component
 *
 * Displays an animated loading indicator while the AI is processing a message.
 * Shows a spinning pinwheel animation with cycling text that updates at intervals
 * to give users feedback on the processing stages.
 *
 * Features:
 * - Animated pinwheel spinner (CSS animation)
 * - Text changes over time: "Thinking" → "Retrieving context" → "Curating response" → "Checking the time"
 * - Pulsing text animation for visual interest
 * - Returns null when not loading (unmounts from DOM)
 * - Accepts ref for scroll targeting
 */

type LoadingIndicatorProps = {
	isLoading: boolean; // Controls visibility and animation
};

export const LoadingIndicator = forwardRef<
	HTMLDivElement,
	LoadingIndicatorProps
>(({ isLoading }, ref) => {
	// State for the cycling loading text
	const [text, setText] = useState('Thinking');

	// Set up timers to change loading text at intervals
	useEffect(() => {
		if (!isLoading) {
			// Reset text to default when loading stops
			setText('Thinking');
			return;
		}

		// Define text changes at specific time intervals (milliseconds)
		const steps = [
			{ t: 4000, text: 'Retrieving context' }, // After 4 seconds
			{ t: 8000, text: 'Curating response' }, // After 8 seconds
			{ t: 12000, text: 'Checking the time' }, // After 12 seconds
		];

		const timers = steps.map(({ t, text }) =>
			setTimeout(() => setText(text), t)
		);

		return () => timers.forEach(clearTimeout);
	}, [isLoading]);

	if (!isLoading) return null;

	return (
		<div ref={ref} className="max-w-[78%] self-start">
			<div className="p-3 rounded-lg flex items-center gap-2">
				{/* From Uiverse.io by elijahgummer */}
				<div className="pinwheel">
					<div className="pinwheel__line"></div>
					<div className="pinwheel__line"></div>
					<div className="pinwheel__line"></div>
					<div className="pinwheel__line"></div>
					<div className="pinwheel__line"></div>
					<div className="pinwheel__line"></div>
				</div>

				<span className="text-sm text-secondary-lighter animate-[pulse_2s_ease-in-out_infinite]">
					{text}
				</span>
				{/* Keyframes defined inline via a style tag */}
				<style jsx>{`
					@keyframes pulse {
						0%,
						100% {
							opacity: 0.5;
						}
						50% {
							opacity: 1;
						}
					}
				`}</style>
			</div>
		</div>
	);
});

LoadingIndicator.displayName = 'LoadingIndicator';
