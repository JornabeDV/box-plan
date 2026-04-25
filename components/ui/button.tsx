import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap h-12 font-heading text-sm font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground font-bold shadow-[0_0_30px_rgba(230,255,43,0.25),0_0_80px_rgba(230,255,43,0.1)] hover:shadow-[0_0_40px_rgba(230,255,43,0.35),0_0_100px_rgba(230,255,43,0.15)] active:scale-[0.98]',
        outline:
          'border border-outline/20 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-white/5',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        glass:
          'bg-surface-container-high/60 backdrop-blur-xl border border-outline/10 text-foreground hover:bg-surface-container-high/80 hover:border-outline/20',
        link:
          'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-5 py-2.5',
        sm: 'h-10 gap-1.5 px-4 text-xs',
        lg: 'px-10 text-base font-bold gap-3',
        icon: 'h-12 w-12',
        xl: 'px-12 text-lg font-bold gap-3',
      }
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
