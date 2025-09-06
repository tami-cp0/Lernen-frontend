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
  setEmailError(null);
  setPasswordError(null);
  setError(null);

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
    <main className='min-w-screen min-h-screen flex flex-col justify-center items-center gap-4'>
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
              <img src="/email-icon.svg" alt="" className='absolute left-3'/>
              <input
                type="email"
                name="email"
                placeholder="johndoe@gmail.com"
                onClick={() => setEmailError(null)}
                className={`bg-white rounded-md text-background placeholder:text-[#777777] w-full h-full pl-10 pr-3 font-sans font-normal focus:outline-none
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
              <img src="/password-icon.svg" alt="" className='absolute left-2.5 w-5'/>
              <input
                type={showPassword ? 'text' : 'password'}
                name='password'
                placeholder='enter your password'
                onClick={() => setPasswordError(null)}
                className={`bg-white rounded-md text-background placeholder:text-[#777777] w-full h-full px-10 font-sans font-normal focus:outline-none
                  transition-[box-shadow] duration-300
                  ${passwordError ? "ring-2 ring-red-500" : ""}
                  focus:ring-2 focus:ring-my-secondary-darker` }
              />
              <img
                src={showPassword ? "/eye-off.svg" : "/eye-on.svg"}
                alt="Toggle password visibility"
                className='absolute right-3 w-5 cursor-pointer'
                onClick={togglePassword}
              />
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
            className={`bg-my-secondary-darker text-background md:bg-background
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
      <p className='hidden md:block transition-all duration-200'>I do not have a <span className='text-my-secondary'>Lernen</span> account. <a href='' className='text-my-secondary underline cursor-pointer'>Sign up</a></p>
    </main>
  )
}

export default LoginPage;
