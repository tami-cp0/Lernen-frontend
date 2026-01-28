'use client';
import React, { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { clientEnv } from '../../../env.client';
import StepOne from './components/stepOne';
import StepTwo from './components/stepTwo';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { setAuthTokens } from '@/lib/api-client';
import { Loader2Icon } from 'lucide-react';

const OnboardingPage = () => {
	const [isLoading, setIsLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const router = useRouter();
	const searchParams = useSearchParams();

	const [step, setStep] = useState<number>(1);

	// step one
	const [field, setField] = useState({
		firstName: '',
		lastName: '',
		educationLevel: '',
	});

	// step two
	const [preferences, setPreferences] = useState<string[]>([]);

	const [isVerifying, setIsVerifying] = useState(true); // Only verify if token exists

	const [id, setId] = useState<string | null>(null);
	const [provider, setProvider] = useState<string | null>(null);

	const [token, setToken] = useState<string>(searchParams.get('token') || '');

	// prevent double execution of useEffect in Strict Mode
	const didRun = useRef(false);
	useEffect(() => {
		if (didRun.current) return;
		didRun.current = true;

		async function verifyToken() {
			// Check if already logged in via HTTP-only cookies
			const res = await fetch('/api/auth/get-tokens');
			const { hasTokens } = await res.json();

			if (hasTokens) {
				console.log('Already signed in, redirecting to home...');
				router.replace('/chat');
				return;
			}
			try {
				if (!token) {
					router.replace('/sign-in');
					return;
				}

				console.log('Verifying token...');
				const response: {
					message: string;
					data: {
						accessToken?: string;
						refreshToken?: string;
						provider?: 'google' | 'email';
						token?: string;
						onboarded?: boolean;
						id?: string;
						names?: { firstName: string; lastName: string };
					};
				} = (
					await axios.post(
						`${clientEnv.apiUrl}/api/v1/auth/verify-token`,
						{ token }
					)
				).data;

				if (!response.data.onboarded) {
					setField({
						firstName: response.data.names?.firstName || '',
						lastName: response.data.names?.lastName || '',
						educationLevel: '',
					});
					setId(response.data.id || null);
					setProvider(response.data.provider!);
					setToken(response.data.token!);
					setIsVerifying(false);
					return;
				}

				// If already onboarded, log in and redirect to home
				await setAuthTokens(
					response.data.accessToken!,
					response.data.refreshToken!
				);
				console.log(
					'Token verified successfully, redirecting to home...'
				);
				router.replace('/chat');
				return;
			} catch (error) {
				console.error('Token verification failed:', error);

				if (axios.isAxiosError(error)) {
					console.log(
						'Invalid/expired/used token, redirecting to sign-in...'
					);
					router.replace('/sign-in');
					return;
				}

				// For other errors, stay on onboarding page
				setIsVerifying(false);
				setError('Token verification failed. Please try again.');
			}
		}

		verifyToken();
	}, [router, token]);

	if (isVerifying) {
		return (
			<div className="w-screen h-screen bg-secondary flex items-center justify-center">
				<Loader2Icon className="h-4 w-4 animate-spin" />
			</div>
		);
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setIsLoading(true);
		setError(null);
		setMessage(null);

		try {
			const response: {
				message: string;
				data: { accessToken: string; refreshToken: string };
			} = (
				await axios.put(
					`${clientEnv.apiUrl}/api/v1/auth/onboard?provider=${provider}`,
					{ ...field, preferences, id, token }
				)
			).data;

			await setAuthTokens(
				response.data.accessToken,
				response.data.refreshToken
			);
			setIsLoading(false);

			router.replace('/chat');
			return;
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				setError(
					error.response?.data?.message ||
						error.message ||
						'Something went wrong'
				);
			} else {
				setError('Something went wrong');
			}
			setIsLoading(false);
			console.error('Magic link request failed:', error);
		}
	}

	return (
		<main className="relative w-full min-h-screen [@media(min-height:768px)]:h-screen flex justify-end bg-secondary md:bg-[url('/Abstract-Ripple-Effect.png')] md:bg-cover md:bg-center">
			<section className="z-2">
				<div className="absolute top-5 left-5 md:top-10 md:left-10 flex items-center gap-3">
					<Image
						src="/lernen-logo.svg"
						alt="Lernen logo"
						className="w-4 md:w-6"
						width={24}
						height={24}
					/>
					<p className="text-xl">Lernen</p>
				</div>
				<p className="absolute hidden left-10 bottom-10 md:block">
					Lernen (ler‧nen) The Intelligent Learning Tech
				</p>
			</section>
			<section className="z-1 relative bg-secondary w-full h-full pb-10 [@media(min-height:768px)]:p-0 md:w-[45%] flex flex-col items-center gap-10">
				<div className="absolute top-5 right-5  md:top-10 md:right-20 flex flex-row gap-4">
					<a href="https://github.com/tami-cp0">
						<Image
							src="/github-logo.svg"
							alt=""
							className="w-4 md:w-[26px]"
							width={26}
							height={26}
						/>
					</a>
					<a href="https://x.com/tami_cp0">
						<Image
							src="/twitter-logo.svg"
							alt=""
							className="w-4 md:w-[26px]"
							width={26}
							height={26}
						/>
					</a>
					<a href="https://www.linkedin.com/in/tami-cp0">
						<Image
							src="/linkedin-logo.svg"
							alt=""
							className="w-4 md:w-[26px]"
							width={26}
							height={26}
						/>
					</a>
					<a href="https://www.instagram.com/tami_cp0">
						<Image
							src="/instagram-logo.svg"
							alt=""
							className="w-4 md:w-[26px]"
							width={26}
							height={26}
						/>
					</a>
				</div>
				<section className="mt-25 [@media(min-height:768px)]:mt-40 w-[85%] md:w-[70%] flex flex-col gap-4 items-start">
					<h1 className="text-foreground text-2xl font-semibold mb-[-10]">
						{step === 1
							? 'Short Onboarding'
							: 'What interests you most?'}
					</h1>
					<p className="text-[#9e9e9e] mb-4">
						{step === 1
							? 'Tell us about yourself. Takes only a few seconds'
							: 'Select what you would rather use Lernen for.'}
					</p>
					<div className="w-full h-2 bg-background rounded-full flex flex-row">
						<div className="w-[50%] h-full bg-primary rounded-l-full"></div>
						{step > 1 ? (
							<div className="w-[50%] h-full rounded-r-full bg-primary"></div>
						) : (
							<div></div>
						)}
					</div>
					<p className="w-full text-center text-sm">
						Step {step} of 2
					</p>
					<form action="" className="w-full" onSubmit={handleSubmit}>
						{step === 1 && (
							<StepOne
								setStep={setStep}
								setField={setField}
								field={field}
							/>
						)}
						{step === 2 && (
							<StepTwo
								setStep={setStep}
								preferences={preferences}
								setPreferences={setPreferences}
								isLoading={isLoading}
								id={id}
							/>
						)}
						{message && (
							<p className="text-center mt-10 text-sm bg-primary/4 text-foreground w-full border-1 p-2 rounded-md border-primary">
								{message}
							</p>
						)}
						{error && (
							<p className="text-center text-sm mt-10 bg-red-700/4 text-foreground w-full border-1 p-2 rounded-md border-red-600">
								{error}
							</p>
						)}
					</form>
				</section>
			</section>
		</main>
	);
};

export default function Page() {
	return (
		<Suspense fallback={<p></p>}>
			<OnboardingPage />
		</Suspense>
	);
}
