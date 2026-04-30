import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
          'flex h-12 w-full min-w-0 border border-outline/20 bg-surface-variant px-5 py-2.5 text-sm md:text-base text-foreground shadow-sm transition-all',
          'outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-sm',
          'focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-2',
          'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
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
