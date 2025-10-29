import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          'file:text-white placeholder:text-gray-400 selection:bg-lime-400 selection:text-black',
          'flex h-10 w-full min-w-0 rounded-md border border-border bg-input px-3 py-2 text-base text-foreground shadow-sm transition-all',
          'outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-lime-400 focus-visible:ring-lime-400/50 focus-visible:ring-2',
          'aria-invalid:ring-red-500/20 aria-invalid:border-red-500',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
