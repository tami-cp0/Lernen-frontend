'use client';
import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2Icon } from 'lucide-react'

const StepTwo = ({ setStep, preferences, setPreferences, isLoading, email }: { 
    setStep: React.Dispatch<React.SetStateAction<number>>,
    preferences: string[],
    setPreferences: React.Dispatch<React.SetStateAction<string[]>>,
    isLoading: boolean,
    email: string | null
}) => {
    const canProceed = preferences.length > 0;

    const handleChange = (value: string, checked: boolean) => {
        if (checked) {
            setPreferences([...preferences, value])      // add if checked
        } else {
            setPreferences(preferences.filter((v) => v !== value)) // remove if unchecked
        }
    }

    const textList = [
        "Study for exams",
        "Form a mini book club with Lernen AI",
        "Brainstorm ideas or creative projects",
        "Read fun summaries or bite-sized lessons",
        "Follow guided learning paths",
        "No idea"
    ]

    return (
        <div className='w-full flex flex-col gap-4'>
            {textList.map((text, index) => (
                <Label key={index} className='border-1 border-[#2e2e2e] rounded-md p-4 bg-[#1b1b1b]'>
                    <Checkbox
                        checked={preferences.includes(text)}
                        onCheckedChange={(checked) => handleChange(text, checked as boolean)}
                    />
                    <p>{text}</p>
                </Label>
            ))}
            <div className='w-full flex flex-row justify-between'>
                <Button type='button' variant={'outline'} className='w-[30%] self-start' onClick={() => setStep((prevStep) => prevStep - 1)}>
                    Back
                </Button>
                <Button type='submit' className='w-[30%] self-end' disabled={!canProceed && !email}>
                    {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
                    {isLoading ? '' : 'Continue'}
                </Button>
            </div>
        </div>
    )
}

export default StepTwo