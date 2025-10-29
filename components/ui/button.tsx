import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-lime-400 text-black font-bold uppercase tracking-wide hover:bg-lime-300 shadow-lg hover:shadow-xl hover:shadow-lime-400/25 transition-all duration-200',
        destructive:
          'bg-red-600 text-white font-bold hover:bg-red-700 focus-visible:ring-red-500/20',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground hover:border-border',
        secondary:
          'bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'text-lime-400 underline-offset-4 hover:underline hover:text-lime-300',
        neon:
          'bg-lime-400 text-black font-bold uppercase tracking-wide hover:bg-lime-300 shadow-lg hover:shadow-xl hover:shadow-lime-400/50 transition-all duration-200 animate-neon-pulse',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 rounded-md gap-1.5 px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base font-bold',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
