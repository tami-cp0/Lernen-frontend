'use client';
import { clientEnv } from '../../../env.client';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

const ResetPasswordInner = () => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const [newPasswordError, setNewPasswordError] = useState<string | null>(
        null
    );
    const [confirmPasswordError, setConfirmPasswordError] = useState<
        string | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const searchParams = useSearchParams();

    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setNewPasswordError(null);
        setConfirmPasswordError(null);

        const formData = new FormData(event.target as HTMLFormElement);
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!newPassword && !confirmPassword) {
            setNewPasswordError('Password is required');
            setConfirmPasswordError('Password is required');
            setError(null);
            return;
        }

        if (!newPassword) {
            setNewPasswordError('Password is required');
            setError(null);
            return;
        }

        if (!confirmPassword) {
            setConfirmPasswordError('Password is required');
            setError(null);
            return;
        }

        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[A-Za-z\d\W]{8,}$/;

        if (!strongPasswordRegex.test(newPassword)) {
            setNewPasswordError(
                'Password must contain one or more uppercase letters, numbers, and special characters.'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const token = searchParams.get('token');
        if (!token) {
            setError('Invalid link');
            return;
        }

        try {
            await axios.put(`${clientEnv.apiUrl}/api/v1/auth/reset-password`, {
				newPassword,
				confirmPassword,
				token,
			});

			setMessage('Password reset successful.');
			router.push('/login');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                
                    setError(
                        error.response?.data?.message ||
                            error.message ||
                            'Something went wrong'
                    );
            } else {
                setError('Something went wrong');
            }
            console.error('Reset password failed:', error);
        }
    }

	return (
		<main className="w-screen h-screen flex flex-col justify-center items-center md:gap-4">
			<div className="md:bg-foreground md:text-background rounded-3xl max-w-lg h-fit p-8 flex flex-col gap-3 transition-all duration-200">
				<div className="flex flex-row items-center gap-3 justify-center">
					<img src="/lernen-logo.svg" alt="" className="w-9" />
				</div>
				<div className="flex flex-col justify-center items-center font-medium font-inter gap-2">
					<p className="text-2xl mb-[5%] md:mb-0">Reset Password</p>
				</div>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<label className="flex flex-col gap-2 font-medium text-sm">
						<div className="flex flex-row justify-between items-center font-sans">
							<span>New Password</span>
						</div>
						<div className="relative flex flex-row items-center h-9">
							<svg
								className="absolute left-2.5 w-5"
								width="18"
								height="18"
								viewBox="0 0 15 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									className="stroke-[#B7B7B7] md:stroke-background"
									d="M5.11366 6.68919H3.75002C3.40485 6.68919 3.12503 6.96781 3.12502 7.313C3.12501 8.34269 3.12497 10.4232 3.12504 11.8243C3.12511 13.3948 5.55384 13.75 7.5 13.75C9.44619 13.75 11.8749 13.3948 11.8749 11.8243C11.875 10.4233 11.875 8.34269 11.8749 7.313C11.8749 6.96781 11.5951 6.68919 11.2499 6.68919H9.88631H5.11366ZM5.11366 6.68919C5.11366 6.68919 5.11368 5.08446 5.11366 4.12162C5.11363 2.96607 6.06801 1.875 7.5 1.875C8.932 1.875 9.88631 2.96607 9.88631 4.12162"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									className="fill-[#B7B7B7] md:fill-background"
									fillRule="evenodd"
									clipRule="evenodd"
									d="M8.125 10.3863V11.25C8.125 11.5952 7.84519 11.875 7.5 11.875C7.15481 11.875 6.875 11.5952 6.875 11.25V10.3863C6.68319 10.2146 6.5625 9.96512 6.5625 9.6875C6.5625 9.16975 6.98225 8.75 7.5 8.75C8.01775 8.75 8.4375 9.16975 8.4375 9.6875C8.4375 9.96512 8.31681 10.2146 8.125 10.3863Z"
								/>
							</svg>
							<input
								type={showPassword ? 'text' : 'password'}
								name="newPassword"
								placeholder="hello!123"
								onClick={() => setNewPasswordError(null)}
								className={`bg-[#151515] md:bg-white rounded-md text-foreground md:text-background placeholder:text-[#B7B7B7] md:placeholder:text-[#777777] w-full h-9 px-10 font-sans font-normal focus:outline-none
                  transition-[box-shadow] duration-300
                  ${newPasswordError ? 'ring-2 ring-red-500' : ''}
                  focus:ring-2 focus:ring-my-secondary-darker`}
							/>
							{showPassword ? (
								<svg
									className="absolute right-3 w-5 cursor-pointer"
									onClick={togglePassword}
									width="800px"
									height="800px"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										className="md:fill-background fill-[#B7B7B7]"
										fillRule="evenodd"
										clipRule="evenodd"
										d="M19.7071 5.70711C20.0976 5.31658 20.0976 4.68342 19.7071 4.29289C19.3166 3.90237 18.6834 3.90237 18.2929 4.29289L14.032 8.55382C13.4365 8.20193 12.7418 8 12 8C9.79086 8 8 9.79086 8 12C8 12.7418 8.20193 13.4365 8.55382 14.032L4.29289 18.2929C3.90237 18.6834 3.90237 19.3166 4.29289 19.7071C4.68342 20.0976 5.31658 20.0976 5.70711 19.7071L9.96803 15.4462C10.5635 15.7981 11.2582 16 12 16C14.2091 16 16 14.2091 16 12C16 11.2582 15.7981 10.5635 15.4462 9.96803L19.7071 5.70711ZM12.518 10.0677C12.3528 10.0236 12.1792 10 12 10C10.8954 10 10 10.8954 10 12C10 12.1792 10.0236 12.3528 10.0677 12.518L12.518 10.0677ZM11.482 13.9323L13.9323 11.482C13.9764 11.6472 14 11.8208 14 12C14 13.1046 13.1046 14 12 14C11.8208 14 11.6472 13.9764 11.482 13.9323ZM15.7651 4.8207C14.6287 4.32049 13.3675 4 12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C1.92276 13.7326 2.86706 15.0637 4.21194 16.3739L5.62626 14.9596C4.4555 13.8229 3.61144 12.6531 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C12.7719 6 13.5135 6.13385 14.2193 6.36658L15.7651 4.8207ZM12 18C11.2282 18 10.4866 17.8661 9.78083 17.6334L8.23496 19.1793C9.37136 19.6795 10.6326 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C22.0773 10.2674 21.133 8.93627 19.7881 7.62611L18.3738 9.04043C19.5446 10.1771 20.3887 11.3469 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18Z"
									/>
								</svg>
							) : (
								<svg
									className="absolute right-3 w-5 cursor-pointer"
									onClick={togglePassword}
									width="800px"
									height="800px"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										className="md:fill-background fill-[#B7B7B7]"
										fillRule="evenodd"
										clipRule="evenodd"
										d="M6.30147 15.5771C4.77832 14.2684 3.6904 12.7726 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C14.1843 6 16.1261 7.07185 17.6986 8.42294C19.2218 9.73158 20.3097 11.2274 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18C9.81574 18 7.87402 16.9282 6.30147 15.5771ZM12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C2.00757 13.8624 3.23268 15.5772 4.99812 17.0941C6.75717 18.6054 9.14754 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C21.9925 10.1376 20.7674 8.42276 19.002 6.90595C17.2429 5.39462 14.8525 4 12 4ZM10 12C10 10.8954 10.8955 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8955 14 10 13.1046 10 12ZM12 8C9.7909 8 8.00004 9.79086 8.00004 12C8.00004 14.2091 9.7909 16 12 16C14.2092 16 16 14.2091 16 12C16 9.79086 14.2092 8 12 8Z"
									/>
								</svg>
							)}
						</div>
						<p
							className={`text-red-500 text-xs transition-all duration-300 overflow-hidden font-sans
                ${
					newPasswordError
						? 'opacity-100 max-h-fit'
						: 'opacity-0 max-h-0'
				}
              `}
						>
							{newPasswordError}
						</p>
					</label>
					<label className="flex flex-col gap-2 font-medium text-sm">
						<div className="flex flex-row justify-between items-center font-sans">
							<span>Confirm Password</span>
						</div>
						<div className="relative flex flex-row items-center h-9">
							<svg
								className="absolute left-2.5 w-5"
								width="18"
								height="18"
								viewBox="0 0 15 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									className="stroke-[#B7B7B7] md:stroke-background"
									d="M5.11366 6.68919H3.75002C3.40485 6.68919 3.12503 6.96781 3.12502 7.313C3.12501 8.34269 3.12497 10.4232 3.12504 11.8243C3.12511 13.3948 5.55384 13.75 7.5 13.75C9.44619 13.75 11.8749 13.3948 11.8749 11.8243C11.875 10.4233 11.875 8.34269 11.8749 7.313C11.8749 6.96781 11.5951 6.68919 11.2499 6.68919H9.88631H5.11366ZM5.11366 6.68919C5.11366 6.68919 5.11368 5.08446 5.11366 4.12162C5.11363 2.96607 6.06801 1.875 7.5 1.875C8.932 1.875 9.88631 2.96607 9.88631 4.12162"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									className="fill-[#B7B7B7] md:fill-background"
									fillRule="evenodd"
									clipRule="evenodd"
									d="M8.125 10.3863V11.25C8.125 11.5952 7.84519 11.875 7.5 11.875C7.15481 11.875 6.875 11.5952 6.875 11.25V10.3863C6.68319 10.2146 6.5625 9.96512 6.5625 9.6875C6.5625 9.16975 6.98225 8.75 7.5 8.75C8.01775 8.75 8.4375 9.16975 8.4375 9.6875C8.4375 9.96512 8.31681 10.2146 8.125 10.3863Z"
								/>
							</svg>
							<input
								type={showPassword ? 'text' : 'password'}
								name="confirmPassword"
								placeholder="hello!123"
								onClick={() => setNewPasswordError(null)}
								className={`bg-[#151515] md:bg-white rounded-md text-foreground md:text-background placeholder:text-[#B7B7B7] md:placeholder:text-[#777777] w-full h-9 px-10 font-sans font-normal focus:outline-none
                  transition-[box-shadow] duration-300
                  ${confirmPasswordError ? 'ring-2 ring-red-500' : ''}
                  focus:ring-2 focus:ring-my-secondary-darker`}
							/>
							{showPassword ? (
								<svg
									className="absolute right-3 w-5 cursor-pointer"
									onClick={togglePassword}
									width="800px"
									height="800px"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										className="md:fill-background fill-[#B7B7B7]"
										fillRule="evenodd"
										clipRule="evenodd"
										d="M19.7071 5.70711C20.0976 5.31658 20.0976 4.68342 19.7071 4.29289C19.3166 3.90237 18.6834 3.90237 18.2929 4.29289L14.032 8.55382C13.4365 8.20193 12.7418 8 12 8C9.79086 8 8 9.79086 8 12C8 12.7418 8.20193 13.4365 8.55382 14.032L4.29289 18.2929C3.90237 18.6834 3.90237 19.3166 4.29289 19.7071C4.68342 20.0976 5.31658 20.0976 5.70711 19.7071L9.96803 15.4462C10.5635 15.7981 11.2582 16 12 16C14.2091 16 16 14.2091 16 12C16 11.2582 15.7981 10.5635 15.4462 9.96803L19.7071 5.70711ZM12.518 10.0677C12.3528 10.0236 12.1792 10 12 10C10.8954 10 10 10.8954 10 12C10 12.1792 10.0236 12.3528 10.0677 12.518L12.518 10.0677ZM11.482 13.9323L13.9323 11.482C13.9764 11.6472 14 11.8208 14 12C14 13.1046 13.1046 14 12 14C11.8208 14 11.6472 13.9764 11.482 13.9323ZM15.7651 4.8207C14.6287 4.32049 13.3675 4 12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C1.92276 13.7326 2.86706 15.0637 4.21194 16.3739L5.62626 14.9596C4.4555 13.8229 3.61144 12.6531 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C12.7719 6 13.5135 6.13385 14.2193 6.36658L15.7651 4.8207ZM12 18C11.2282 18 10.4866 17.8661 9.78083 17.6334L8.23496 19.1793C9.37136 19.6795 10.6326 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C22.0773 10.2674 21.133 8.93627 19.7881 7.62611L18.3738 9.04043C19.5446 10.1771 20.3887 11.3469 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18Z"
									/>
								</svg>
							) : (
								<svg
									className="absolute right-3 w-5 cursor-pointer"
									onClick={togglePassword}
									width="800px"
									height="800px"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										className="md:fill-background fill-[#B7B7B7]"
										fillRule="evenodd"
										clipRule="evenodd"
										d="M6.30147 15.5771C4.77832 14.2684 3.6904 12.7726 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C14.1843 6 16.1261 7.07185 17.6986 8.42294C19.2218 9.73158 20.3097 11.2274 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18C9.81574 18 7.87402 16.9282 6.30147 15.5771ZM12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C2.00757 13.8624 3.23268 15.5772 4.99812 17.0941C6.75717 18.6054 9.14754 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C21.9925 10.1376 20.7674 8.42276 19.002 6.90595C17.2429 5.39462 14.8525 4 12 4ZM10 12C10 10.8954 10.8955 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8955 14 10 13.1046 10 12ZM12 8C9.7909 8 8.00004 9.79086 8.00004 12C8.00004 14.2091 9.7909 16 12 16C14.2092 16 16 14.2091 16 12C16 9.79086 14.2092 8 12 8Z"
									/>
								</svg>
							)}
						</div>
						<p
							className={`text-red-500 text-xs transition-all duration-300 overflow-hidden font-sans
                ${
					confirmPasswordError
						? 'opacity-100 max-h-fit'
						: 'opacity-0 max-h-0'
				}
              `}
						>
							{confirmPasswordError}
						</p>
					</label>
					<button
						type="submit"
						className="bg-foreground text-background md:bg-background
              rounded-md h-9 cursor-pointer w-xs xl:w-sm hover:bg-my-secondary-darker hover:text-background
              hover:font-medium transition-colors duration-200 md:text-foreground
              "
					>
						Reset
					</button>
					{error && (
						<p className="text-red-500 text-sm text-center">
							{error}
						</p>
					)}
					{message && (
						<p className="text-my-secondary-darker md:text-green-500 text-sm text-center">
							{message}
						</p>
					)}
				</form>
			</div>
			<p className="transition-all duration-200">
				I do not have a{' '}
				<span className="text-my-secondary">Lernen</span> account.{' '}
				<a
					href="/register"
					className="text-my-secondary underline cursor-pointer"
				>
					Sign up
				</a>
			</p>
		</main>
	);
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}