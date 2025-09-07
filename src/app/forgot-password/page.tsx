'use client';
import { clientEnv } from '../../../env.client';
import axios from 'axios';
import React, { useState } from 'react';

const ForgotPassswordPage = () => {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setEmailError(null);
        setMessage(null);
        setError(null);

        const formData = new FormData(event.target as HTMLFormElement);
        const email = formData.get('email') as string;

        if (!email) {
            setEmailError('Email is required');
            setError(null);
            return;
        }

        try {
          const response = await axios.post(`${clientEnv.apiUrl}/api/v1/auth/forgot-password`,
            { email }
          );

          setMessage('Link sent, please check your email');
        } catch (error) {
            if (axios.isAxiosError(error)) {
            setError(error.response?.data?.message || error.message || 'Something went wrong');
            } else {
            setError('Something went wrong');
            }
            console.error('Forgot password failed:', error);
        }
    }

  return (
    <main className='min-w-screen min-h-screen flex flex-col justify-center items-center md:gap-4'>
      <div className='md:bg-foreground md:text-background rounded-3xl max-w-lg h-fit p-8 flex flex-col gap-3 transition-all duration-200'>
        <div className='flex flex-row items-center gap-3 justify-center'>
          <img src="/lernen-logo.svg" alt="" className='w-9'/>
          <span className='hidden text-2xl md:text-3xl font-sans'>Lernen</span>
        </div>
        <div className='flex flex-col justify-center items-center font-medium font-inter gap-2'>
          <p className='text-3xl'>Forgot Password</p>
          <p className='text-[#676767] md:mb-0 text-base md:text-[#606060]'>Password reset link will be sent</p>
        </div>
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          <label className='flex flex-col gap-1 font-sans text-sm font-medium'>
            <div className='relative flex flex-row items-center h-9'>
              {/* <img src="/email-icon.svg" alt="" className='absolute left-3'/> */}
              <svg className='absolute left-3' width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className='md:stroke-background stroke-[#B7B7B7]' d="M2.5 2.5H12.5C13.1875 2.5 13.75 3.0625 13.75 3.75V11.25C13.75 11.9375 13.1875 12.5 12.5 12.5H2.5C1.8125 12.5 1.25 11.9375 1.25 11.25V3.75C1.25 3.0625 1.8125 2.5 2.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/>
                <path className='md:stroke-background stroke-[#B7B7B7]' d="M13.75 3.75L7.5 8.125L1.25 3.75"  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="johndoe@gmail.com"
                onClick={() => setEmailError(null)}
                className={`bg-[#151515] md:bg-white rounded-md text-[#D7D7D7] md:text-background placeholder:text-[#B7B7B7] md:placeholder:text-[#777777] w-full h-full pl-10 pr-3 font-sans font-normal focus:outline-none
                  transition-[box-shadow] duration-300
                  ${emailError ? "ring-2 ring-red-500" : ""}
                  focus:ring-2 focus:ring-my-secondary-darker` }
              />
            </div>
            <p className={`text-red-500 text-xs transition-all duration-300 overflow-hidden
                ${emailError ? "opacity-100 max-h-6" : "opacity-0 max-h-0"}
              `}>
              {emailError}
            </p>
          </label>
          <button
            type="submit"
            className={`bg-foreground text-background md:bg-background
              rounded-md h-9 cursor-pointer w-xs xl:w-sm hover:bg-my-secondary-darker hover:text-background
              hover:font-medium transition-colors duration-200 md:text-foreground
              `}
          >
            {message ? 'Resend Link' : 'Send Link'}
          </button>
          {error &&
            <p className='text-red-500 text-sm text-center'>
              {error}
            </p>
          }
          {message &&
            <p className='text-my-secondary md:text-my-secondary-darker text-sm text-center'>
              {message}
            </p>
          }
        </form>
      </div>
      <p className='transition-all duration-200'>I do not have a <span className='text-my-secondary'>Lernen</span> account. <a href='/register' className='text-my-secondary underline cursor-pointer'>Sign up</a></p>
    </main>
  )
}

export default ForgotPassswordPage;
