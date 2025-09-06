'use client';
import { clientEnv } from '../../../env.client';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/auth.context';

const LoginPage = () => {
  const { user, login } = useAuthContext();

  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const [rememberMe, setRememberMe] = useState(false);

  const toggleRememberMe = () => {
    setRememberMe(prev => !prev);
  };

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(event: React.FormEvent) {
  event.preventDefault();

  const formData = new FormData(event.target as HTMLFormElement);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string; 
  const rememberMe = formData.get('rememberMe') === 'on';

  if (!email && !password) {
    setEmailError('Email is required');
    setPasswordError('Password is required');
    setError(null);
    return;
  }
  if (!email) {
    setEmailError('Email is required');
    setPasswordError(null);
    setError(null);
    return;
  }
  if (!password) {
    setPasswordError('Password is required');
    setEmailError(null);
    setError(null);
    return;
  }

  try {
    setIsLoading(true);
    const response = (await axios.post(`${clientEnv.apiUrl}/api/v1/auth/login?provider=email`,
      {
        email, password, rememberMe
      }
    )).data;

    console.log('Login successful:', response.data);
    login(response.data.accessToken, response.data.refreshToken);
    router.push('/');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setError(error.response?.data?.message || error.message || 'Something went wrong');
    } else {
      setError('Something went wrong');
    }
    console.error('Login failed:', error);
  } finally {
    setIsLoading(false);
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
          <p className='text-3xl mb-[15%] md:mb-0'>Sign in to Lernen</p>
          <p className='hidden md:block md:text-base md:text-[#606060]'>Please enter your details</p>
        </div>
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          <label className='flex flex-col gap-1 font-sans text-sm font-medium'>
            <span>Email</span>
            <div className='relative flex flex-row items-center h-9'>
              {/* <img src="/email-icon.svg" alt="" className='absolute left-3'/> */}
              <svg className='absolute left-3' width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className='md:stroke-background stroke-[#B7B7B7]' d="M2.5 2.5H12.5C13.1875 2.5 13.75 3.0625 13.75 3.75V11.25C13.75 11.9375 13.1875 12.5 12.5 12.5H2.5C1.8125 12.5 1.25 11.9375 1.25 11.25V3.75C1.25 3.0625 1.8125 2.5 2.5 2.5Z" stroke-linecap="round" stroke-linejoin="round"/>
                <path className='md:stroke-background stroke-[#B7B7B7]' d="M13.75 3.75L7.5 8.125L1.25 3.75"  stroke-linecap="round" stroke-linejoin="round"/>
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
          <label className='flex flex-col gap-2 font-medium text-sm'>
            <div className='flex flex-row justify-between items-center font-sans'>
              <span>Password</span>
              <a href="" className='relative md:text-black after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[1px] after:bg-background hover:after:w-full after:transition-all after:duration-500'>Forgot password?</a>
            </div>
            <div className='relative flex flex-row items-center h-9'>
              <svg className='absolute left-2.5 w-5' width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className='stroke-[#B7B7B7] md:stroke-background' d="M5.11366 6.68919H3.75002C3.40485 6.68919 3.12503 6.96781 3.12502 7.313C3.12501 8.34269 3.12497 10.4232 3.12504 11.8243C3.12511 13.3948 5.55384 13.75 7.5 13.75C9.44619 13.75 11.8749 13.3948 11.8749 11.8243C11.875 10.4233 11.875 8.34269 11.8749 7.313C11.8749 6.96781 11.5951 6.68919 11.2499 6.68919H9.88631H5.11366ZM5.11366 6.68919C5.11366 6.68919 5.11368 5.08446 5.11366 4.12162C5.11363 2.96607 6.06801 1.875 7.5 1.875C8.932 1.875 9.88631 2.96607 9.88631 4.12162" stroke-linecap="round" stroke-linejoin="round"/>
                <path className='fill-[#B7B7B7] md:fill-background' fill-rule="evenodd" clip-rule="evenodd" d="M8.125 10.3863V11.25C8.125 11.5952 7.84519 11.875 7.5 11.875C7.15481 11.875 6.875 11.5952 6.875 11.25V10.3863C6.68319 10.2146 6.5625 9.96512 6.5625 9.6875C6.5625 9.16975 6.98225 8.75 7.5 8.75C8.01775 8.75 8.4375 9.16975 8.4375 9.6875C8.4375 9.96512 8.31681 10.2146 8.125 10.3863Z"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                name='password'
                placeholder='hello!123'
                onClick={() => setPasswordError(null)}
                className={`bg-[#151515] md:bg-white rounded-md text-foreground md:text-background placeholder:text-[#B7B7B7] md:placeholder:text-[#777777] w-full h-9 px-10 font-sans font-normal focus:outline-none
                  transition-[box-shadow] duration-300
                  ${passwordError ? "ring-2 ring-red-500" : ""}
                  focus:ring-2 focus:ring-my-secondary-darker` }
              />
              {showPassword ?
                <svg className='absolute right-3 w-5 cursor-pointer' onClick={togglePassword} width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M19.7071 5.70711C20.0976 5.31658 20.0976 4.68342 19.7071 4.29289C19.3166 3.90237 18.6834 3.90237 18.2929 4.29289L14.032 8.55382C13.4365 8.20193 12.7418 8 12 8C9.79086 8 8 9.79086 8 12C8 12.7418 8.20193 13.4365 8.55382 14.032L4.29289 18.2929C3.90237 18.6834 3.90237 19.3166 4.29289 19.7071C4.68342 20.0976 5.31658 20.0976 5.70711 19.7071L9.96803 15.4462C10.5635 15.7981 11.2582 16 12 16C14.2091 16 16 14.2091 16 12C16 11.2582 15.7981 10.5635 15.4462 9.96803L19.7071 5.70711ZM12.518 10.0677C12.3528 10.0236 12.1792 10 12 10C10.8954 10 10 10.8954 10 12C10 12.1792 10.0236 12.3528 10.0677 12.518L12.518 10.0677ZM11.482 13.9323L13.9323 11.482C13.9764 11.6472 14 11.8208 14 12C14 13.1046 13.1046 14 12 14C11.8208 14 11.6472 13.9764 11.482 13.9323ZM15.7651 4.8207C14.6287 4.32049 13.3675 4 12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C1.92276 13.7326 2.86706 15.0637 4.21194 16.3739L5.62626 14.9596C4.4555 13.8229 3.61144 12.6531 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C12.7719 6 13.5135 6.13385 14.2193 6.36658L15.7651 4.8207ZM12 18C11.2282 18 10.4866 17.8661 9.78083 17.6334L8.23496 19.1793C9.37136 19.6795 10.6326 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C22.0773 10.2674 21.133 8.93627 19.7881 7.62611L18.3738 9.04043C19.5446 10.1771 20.3887 11.3469 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18Z" fill="#252525"/>
                </svg>
                :
                <svg className='absolute right-3 w-5 cursor-pointer' onClick={togglePassword} width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.30147 15.5771C4.77832 14.2684 3.6904 12.7726 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C14.1843 6 16.1261 7.07185 17.6986 8.42294C19.2218 9.73158 20.3097 11.2274 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18C9.81574 18 7.87402 16.9282 6.30147 15.5771ZM12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C2.00757 13.8624 3.23268 15.5772 4.99812 17.0941C6.75717 18.6054 9.14754 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C21.9925 10.1376 20.7674 8.42276 19.002 6.90595C17.2429 5.39462 14.8525 4 12 4ZM10 12C10 10.8954 10.8955 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8955 14 10 13.1046 10 12ZM12 8C9.7909 8 8.00004 9.79086 8.00004 12C8.00004 14.2091 9.7909 16 12 16C14.2092 16 16 14.2091 16 12C16 9.79086 14.2092 8 12 8Z" fill="#252525"/>
                </svg>
              }
            </div>
            <p className={`text-red-500 text-xs transition-all duration-300 overflow-hidden font-sans
                ${passwordError ? "opacity-100 max-h-6" : "opacity-0 max-h-0"}
              `}>
              {passwordError}
            </p>
          </label>
          <label className='flex flex-row gap-2 items-center text-sm'>
            <input type="checkbox" name="rememberMe" checked={rememberMe} onChange={toggleRememberMe} className='ml-0.5 cursor-pointer accent-my-secondary-darker border-2 border-background w-3 h-3'/>
            <span className='font-sans'>Remember me</span>
          </label>
          <button
            disabled={isLoading}
            type="submit"
            className={`bg-foreground text-background md:bg-background
              rounded-md h-9 cursor-pointer w-xs xl:w-sm hover:bg-my-secondary-darker hover:text-background
              hover:font-medium transition-colors duration-200
              ${isLoading 
                ? ' md:bg-my-secondary-darker md:text-background' 
                : 'hover:font-medium md:text-foreground'
              }
              `}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          {error &&
            <p className='text-red-500 text-sm text-center'>
              {error}
            </p>
          }
        </form>
      </div>
      <p className='transition-all duration-200'>I do not have a <span className='text-my-secondary'>Lernen</span> account. <a href='/register' className='text-my-secondary underline cursor-pointer'>Sign up</a></p>
    </main>
  )
}

export default LoginPage;
