'use client'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'

const stepOne = ({ setStep, field, setField }: {
    setStep: React.Dispatch<React.SetStateAction<number>>,
    field: { firstName: string, lastName: string, educationLevel: string },
    setField: React.Dispatch<React.SetStateAction<{ firstName: string, lastName: string, educationLevel: string }>>
}) => {
    const canProceed = field.firstName.trim() !== "" && field.lastName.trim() !== "" && field.educationLevel.trim() !== "";

  return (
    <div className='w-full flex flex-col gap-4'>
        <label className='flex flex-col gap-1 w-full font-sans text-sm font-medium'>
            <h6 className='text-foreground'>What should we call you?</h6>
            <div className='relative flex flex-row items-center h-9'>
                <input
                    type="text"
                    name="firstName"
                    value={field.firstName}
                    placeholder="Bruce"
                    onChange={(e) => setField({ ...field, firstName: e.target.value })}
                    className={` bg-[#151515] border-1 border-[#2e2e2e] rounded-md text-foreground  placeholder:text-[#9e9e9e]
                                w-full h-full pl-4 pr-4 font-sans font-normal focus:outline-none
                                focus:ring-1 focus:ring-primary` }
                    />
            </div>
        </label>
        <label className='flex flex-col gap-1 w-full font-sans text-sm font-medium'>
            <h6 className='text-foreground'>Your last name too.</h6>
            <div className='relative flex flex-row items-center h-9'>
                <input
                    type="text"
                    name="lastName"
                    value={field.lastName}
                    placeholder="Wayne"
                    onChange={(e) => setField({ ...field, lastName: e.target.value })}
                    className={` bg-[#151515] border-1 border-[#2e2e2e] rounded-md text-foreground  placeholder:text-[#9e9e9e]
                                w-full h-full pl-4 pr-4 font-sans font-normal focus:outline-none
                                focus:ring-1 focus:ring-primary` }
                />
            </div>
        </label>
        <label className='flex flex-col gap-1 w-full font-sans text-sm font-medium'>
            <h6 className='text-foreground'>What is your highest level of education?</h6>
            <div className='relative flex flex-row items-center h-9'>
                <input
                    type="text"
                    name="educationLevel"
                    value={field.educationLevel}
                    placeholder="College"
                    onChange={(e) => setField({ ...field, educationLevel: e.target.value })}
                    className=' bg-[#151515] border-1 border-[#2e2e2e] rounded-md text-foreground  placeholder:text-[#9e9e9e]
                                w-full h-full pl-4 pr-4 font-sans font-normal focus:outline-none focus:ring-1 focus:ring-primary'
                    />
            </div>
        </label>
        <Button className='w-[30%] self-end' disabled={!canProceed} onClick={() => setStep((prevStep) => prevStep + 1)}>
            Next
        </Button>
    </div>
  )
}

export default stepOne