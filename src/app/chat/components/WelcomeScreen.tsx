import { useUser } from '../context/UserContext';

/**
 * WelcomeScreen Component
 *
 * Displays the initial welcome screen when a chat is empty (no messages yet).
 * Shows a personalized greeting and provides example hint questions that users
 * can click to quickly start a conversation.
 *
 * Features:
 * - Personalized welcome message with user's first name
 * - Animated gradient background effect
 * - Four clickable hint question buttons with example prompts
 * - Responsive design (some hints hidden on mobile)
 */

// Pre-defined hint questions to help users get started
const hintQuestions = [
	'Summarize the discussion of [topic]',
	'Define [term from document]',
	'Highlight insights regarding [topic] in [section]',
	'Compare outcomes for [concept A] and [concept B]',
];

type WelcomeScreenProps = {
	// Callback when user clicks a hint question button
	onHintClick: (hint: string) => void;
};

export const WelcomeScreen = ({ onHintClick }: WelcomeScreenProps) => {
	const { user } = useUser();

	return (
		<div className="h-full flex flex-col  items-center relative ">
			<div className="absolute bottom-1/2 h-[100%] w-[100%] blur-lg rounded-full bg-[radial-gradient(circle_at_center,rgba(153,225,29,0.30),transparent_65%)]"></div>
			<p className="font-sans text-3xl mt-[20%] mb-5 text-center font-medium">{`Welcome ${
				user?.firstName ?? ''
			}!`}</p>
			{/* hint questions as buttons */}
			<div className="font-mono flex flex-col gap-3">
				<div className="flex flex-row gap-3 justify-center">
					<button
						type="button"
						className="hidden md:block h-fit w-fit cursor-pointer hover:py-2 hover:px-4 hover:text-md transition-all delay-100 py-1 px-3 text-sm text-secondary-lighter rounded-full border-1 border-secondary/2 bg-white/2 backdrop-blur-md"
						onClick={() => onHintClick(hintQuestions[0])}
					>
						Summarize the discussion of{' '}
						<span className="text-primary">[</span>
						topic
						<span className="text-primary">]</span>
					</button>
					<button
						type="button"
						className="h-fit w-fit cursor-pointer hover:py-2 hover:px-4 transition-all delay-100 py-1 px-3 text-xs md:text-sm text-secondary-lighter rounded-full border-1 border-secondary/2 bg-white/2 backdrop-blur-md"
						onClick={() => onHintClick(hintQuestions[1])}
					>
						Define <span className="text-primary">[</span>
						term from document
						<span className="text-primary">]</span>
					</button>
				</div>
				<div className="flex flex-row gap-3 justify-center">
					<button
						type="button"
						className="hidden md:block h-fit w-fit cursor-pointer hover:py-2 hover:px-4 transition-all delay-100 py-1 px-3 text-sm text-secondary-lighter rounded-full border-1 border-secondary/2 bg-white/2 backdrop-blur-md"
						onClick={() => onHintClick(hintQuestions[2])}
					>
						Highlight insights regarding{' '}
						<span className="text-primary">[</span>
						topic
						<span className="text-primary">]</span> in{' '}
						<span className="text-primary">[</span>
						section
						<span className="text-primary">]</span>
					</button>
					<button
						type="button"
						className="h-fit w-fit cursor-pointer hover:py-2 hover:px-4 transition-all delay-100 py-1 px-3 text-xs md:text-sm text-secondary-lighter rounded-full border-1 border-secondary/2 bg-white/2 backdrop-blur-md"
						onClick={() => onHintClick(hintQuestions[3])}
					>
						Compare outcomes for{' '}
						<span className="text-primary">[</span>
						concept A<span className="text-primary">
							]
						</span> and <span className="text-primary">[</span>
						concept B<span className="text-primary">]</span>
					</button>
				</div>
			</div>
		</div>
	);
};
