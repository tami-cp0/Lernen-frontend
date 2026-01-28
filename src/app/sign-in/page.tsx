'use client';
import React, { FormEvent, useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import axios from 'axios';
import { clientEnv } from '../../../env.client';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { setAuthTokens } from '@/lib/api-client';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
	interface Window {
		google: any;
	}
}

const Page = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	const [value, setValue] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setIsLoading(true);
		setError(null);
		setMessage(null);

		const email = new FormData(event.target as HTMLFormElement).get(
			'email'
		) as string;

		try {
			await axios.post(
				`${clientEnv.apiUrl}/api/v1/auth/magic-link?provider=email`,
				{ email }
			);
			setMessage('Magic link sent! Please check your email.');
			setIsLoading(false);
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

	const googleCodeClient = useRef<any>(null);

	const initGoogle = useCallback(() => {
		if (!window.google?.accounts?.oauth2) return;
		googleCodeClient.current = window.google.accounts.oauth2.initCodeClient(
			{
				client_id: clientEnv.googleClientId || '',
				scope: 'openid email profile',
				ux_mode: 'popup',
				redirect_uri: 'postmessage',
				callback: async (res: { code?: string; error?: string }) => {
					try {
						console.log(res);
						const response: {
							message: string;
							data: {
								onboarded: boolean;
								accessToken?: string;
								refreshToken?: string;
								token?: string;
							};
						} = (
							await axios.post(
								`${clientEnv.apiUrl}/api/v1/auth/google/callback`,
								{ code: res.code }
							)
						).data;

						// Set loading state after receiving response
						setIsGoogleLoading(true);

						if (response.data?.onboarded) {
							await setAuthTokens(
								response.data.accessToken!,
								response.data.refreshToken!
							);

							router.replace('/chat');
							return;
						} else {
							router.replace(
								`/onboard?token=${encodeURIComponent(
									response.data.token as string
								)}`
							);
							return;
						}
					} catch (e: unknown) {
						setIsGoogleLoading(false);
						if (axios.isAxiosError(e)) {
							setError(
								e.response?.data?.message ||
									e.message ||
									'Google authentication failed'
							);
						} else {
							setError('Google authentication failed');
						}
					}
				},
			}
		);
	}, [router]);

	const handleGoogleClick = () => {
		setError(null);
		setMessage(null);

		if (!window.google?.accounts?.oauth2) {
			setError('Google SDK not loaded. Please try again.');
			return;
		}
		if (!googleCodeClient.current) initGoogle();
		googleCodeClient.current.requestCode();
	};

	return (
		<main className="relative w-screen h-screen flex justify-end bg-[url('/Abstract-Ripple-Effect.png')] bg-cover bg-center">
			{/* Google Sign-In configuration */}
			<Script
				src="https://accounts.google.com/gsi/client"
				strategy="afterInteractive"
				onLoad={initGoogle}
			/>

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
			<section className="z-1 relative bg-secondary w-full md:w-[45%] flex flex-col items-center gap-10">
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
				<section className="mt-40 w-[70%] md:w-[60%] flex flex-col gap-4 items-start">
					<h1 className="text-white text-2xl font-semibold mb-[-10]">
						Authenticate to your account
					</h1>
					<p className="text-secondary-lighter mb-4">
						use email magic link
					</p>
					<form
						action=""
						className="w-full flex flex-col gap-4"
						onSubmit={handleSubmit}
					>
						<label className="flex flex-col gap-1 w-full font-sans text-sm font-medium">
							<h6 className="text-foreground">Email</h6>
							<div className="relative flex flex-row items-center h-9">
								{/* <img src="/email-icon.svg" alt="" className='absolute left-3'/> */}
								<svg
									className="absolute left-3"
									width="15"
									height="15"
									viewBox="0 0 15 15"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										className="stroke-[#2e2e2e]"
										d="M2.5 2.5H12.5C13.1875 2.5 13.75 3.0625 13.75 3.75V11.25C13.75 11.9375 13.1875 12.5 12.5 12.5H2.5C1.8125 12.5 1.25 11.9375 1.25 11.25V3.75C1.25 3.0625 1.8125 2.5 2.5 2.5Z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										className="stroke-[#2e2e2e]"
										d="M13.75 3.75L7.5 8.125L1.25 3.75"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								<input
									type="email"
									name="email"
									placeholder="you@example.com"
									onChange={(e) => setValue(e.target.value)}
									className={` bg-[#151515] border-1 border-[#2e2e2e] rounded-md text-foreground  placeholder:text-[#D7D7D7]
                                w-full h-full pl-10 pr-3 font-sans font-normal focus:outline-none
                                focus:ring-1 focus:ring-primary`}
								/>
							</div>
						</label>
						<Button disabled={value.trim() === '' || isLoading}>
							{isLoading ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : null}
							{isLoading
								? 'Sending magic link'
								: 'Send magic link'}
						</Button>
						{message && (
							<p className="text-center text-sm bg-primary/4 text-foreground w-full border-1 p-2 rounded-md border-primary">
								{message}
							</p>
						)}
						{error && (
							<p className="text-center text-sm bg-red-700/4 text-foreground w-full border-1 p-2 rounded-md border-red-600">
								{error}
							</p>
						)}
					</form>
					<p className="text-sm w-full text-center text-secondary-lighter">
						We&apos;ll send a magic link to your email
					</p>
					<div className="flex items-center w-full">
						<div className="flex-grow border-t border-[#2e2e2e]"></div>
						<span className="mx-4 text-[#D7D7D7] text-xs">
							OR CONTINUE WITH
						</span>
						<div className="flex-grow border-t border-[#2e2e2e]"></div>
					</div>
					<Button
						variant={'outline'}
						className="w-full"
						onClick={handleGoogleClick}
						disabled={isGoogleLoading}
					>
						{isGoogleLoading ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<>
								<Image
									src="/google.svg"
									alt="google icon"
									className="w-4"
									width={16}
									height={16}
								/>
								Google
							</>
						)}
					</Button>
				</section>
			</section>
		</main>
	);
};

export default Page;
