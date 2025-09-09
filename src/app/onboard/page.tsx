'use client';
import React, { FormEvent, Suspense, useEffect, useState } from 'react';
import axios from 'axios';
import { clientEnv } from '../../../env.client';
import StepOne from './stepOne';
import StepTwo from './stepTwo';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuthContext } from '@/contexts/auth.context';
import Cookies from 'js-cookie';
import { Console } from 'console';

const OnboardingPage = () => {
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const [step, setStep] = useState<number>(1);

    // step one
    const [field, setField] = useState({ firstName: "", lastName: "", educationLevel: "" })

    // step two
    const [preferences, setPreferences] = useState<string[]>([])

    const { login } = useAuthContext();

    const [isVerifying, setIsVerifying] = useState(true); // Only verify if token exists

    useEffect(() => {
        async function verifyToken() {
            // Check if already logged in
            const accessToken = Cookies.get('accessToken');
            const refreshToken = Cookies.get('refreshToken');
            
            if (accessToken && refreshToken) {
                console.log("Already logged in, redirecting to home...");
                router.push('/');
                return;
            }

            try {
                if (!token) {
                    console.log("No token found, staying on onboarding page");
                    setIsVerifying(false);
                    return;
                }

                console.log("Verifying token...");
                const response = await axios.post(`${clientEnv.apiUrl}/api/v1/auth/magic-link/verify`, { token });

                login(response.data.data.accessToken, response.data.data.refreshToken);
                console.log("Token verified successfully, redirecting to home...");
                router.push('/');
                
            } catch (error) {
                console.error('Token verification failed:', error);
                
                if (axios.isAxiosError(error)) {
                    const errorMessage = error.response?.data?.message || '';

                    if (error.response?.data?.statusCode === 403) {
                        console.log(errorMessage);
                        setIsVerifying(false);
                        return;
                    }
                    
                    // Fix the error checking logic
                    if (errorMessage.includes('expired') || 
                        errorMessage.includes('invalid') || 
                        errorMessage.includes('used')) {
                        console.log("Invalid/expired token, redirecting to sign-in...");
                        router.push('/sign-in');
                        return;
                    }
                }
                
                // For other errors, stay on onboarding page
                setIsVerifying(false);
                setError('Token verification failed. Please try again.');
            }
        }
        verifyToken();
    }, [router, login, token]);

    if (isVerifying) {
        return <div className="w-screen h-screen"></div>;
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);


        try {
            await axios.put(`${clientEnv.apiUrl}/api/v1/auth/onboard`, { ...field, preferences, email });
            // setMessage("Onboarding complete! Redirecting...");
            setIsLoading(false);

            router.push('/');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || error.message || 'Something went wrong');
            } else {
                setError('Something went wrong');
            }
            setIsLoading(false);
            console.error('Magic link request failed:', error);
        }
    }


  return (
    <main className="relative w-screen h-screen flex justify-end bg-[url('/Abstract-Ripple-Effect.png')] bg-cover bg-center">
        <section className='z-2'>
            <div className='absolute top-5 left-5 md:top-10 md:left-10 flex items-center gap-3'>
                <Image src="/lernen-logo.svg" alt="Lernen logo" className='w-6' width={24} height={24}/>
                <p className='text-xl'>Lernen</p>
            </div>
            <p className='absolute hidden left-10 bottom-10 md:block'>Lernen (ler‧nen) The Intelligent Learning Tech</p>
        </section>
        <section className='z-1 relative bg-secondary w-full md:w-[45%] flex flex-col items-center gap-10'>
            <Image src="/socials.svg" alt="" className='absolute top-5 right-5  md:top-10 md:right-20' width={157} height={26}/>
            <section className='mt-40 w-[70%] md:w-[60%] flex flex-col gap-4 items-start'>
                <h1 className='text-foreground text-2xl font-semibold mb-[-10]'>{step === 1 ? "Short Onboarding" : "What interests you most?"}</h1>
                <p className='text-[#9e9e9e] mb-4'>
                    {step === 1 ? "Tell us about yourself. Takes only a few seconds" : "Select what you would rather use Lernen for."}
                </p>
                <div className='w-full h-2 bg-background rounded-full flex flex-row'>
                    <div className='w-[50%] h-full bg-primary rounded-l-full'></div>
                    { step > 1 ? <div className='w-[50%] h-full rounded-r-full bg-primary'></div> : <div></div>}
                </div>
                <p className='w-full text-center text-sm'>Step {step} of 2</p>
                <form action="" className='w-full' onSubmit={handleSubmit}>
                    { step === 1 && <StepOne setStep={setStep} setField={setField} field={field}/>}
                    { step === 2 && <StepTwo setStep={setStep} preferences={preferences} setPreferences={setPreferences} isLoading={isLoading}/>}
                    { message && (
                        <p className='text-center mt-10 text-sm bg-primary/4 text-foreground w-full border-1 p-2 rounded-md border-primary'>{message}</p>
                    ) }
                    { error && (
                        <p className='text-center text-sm mt-10 bg-red-700/4 text-foreground w-full border-1 p-2 rounded-md border-red-600'>{error}</p>
                    ) }
                </form>
            </section>
        </section>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<p></p>}>
        <OnboardingPage />
    </Suspense>
  );
}
