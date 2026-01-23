import React from 'react'

const MobileHeader = () => {
  return (
    <header className='w-full h-13 shrink-0 fixed bg-background/85 backdrop-blur-md shadow-sm z-10 flex items-center md:hidden'>
        <p className='m-auto font-medium font-mono text-secondary-lighter'>Lernen</p>
    </header>
  )
}

export default MobileHeader