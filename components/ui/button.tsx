import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-lime-400 via-lime-300 to-lime-400 text-black font-bold shadow-[0_4px_15px_rgba(204,255,0,0.3)] hover:shadow-[0_6px_20px_rgba(204,255,0,0.4)] hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
        gradient:
          'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-bold shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] hover:from-purple-600 hover:via-pink-600 hover:to-orange-600',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-foreground font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl',
        outline:
          'border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:bg-lime-400/10 hover:border-lime-400 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)]',
        soft:
          'bg-lime-400/20 border border-lime-400/30 text-lime-400 font-semibold backdrop-blur-sm hover:bg-lime-400/30 hover:border-lime-400/50 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_4px_15px_rgba(204,255,0,0.15)]',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] hover:from-red-700 hover:to-red-800',
        secondary:
          'bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 text-gray-200 font-semibold hover:bg-gray-600/50 hover:border-gray-500/50 hover:scale-[1.02] active:scale-[0.98]',
        ghost:
          'text-foreground hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]',
        link: 'text-lime-400 underline-offset-4 hover:underline hover:text-lime-300 p-0',
        neon:
          'bg-lime-400 text-black font-bold shadow-[0_0_20px_rgba(204,255,0,0.5)] hover:shadow-[0_0_30px_rgba(204,255,0,0.7)] hover:scale-[1.05] active:scale-[0.95] animate-pulse',
        premium:
          'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-black font-bold shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_25px_rgba(251,191,36,0.6)] hover:scale-[1.02] active:scale-[0.98] relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
      },
      size: {
        default: 'h-11 px-6 py-2.5 rounded-xl',
        sm: 'h-9 rounded-lg gap-1.5 px-4 text-xs',
        lg: 'h-14 rounded-2xl px-10 text-base font-bold gap-3',
        icon: 'size-11 rounded-xl',
        xl: 'h-16 rounded-2xl px-12 text-lg font-bold gap-3',
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
