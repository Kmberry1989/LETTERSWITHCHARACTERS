import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl text-sm font-black ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-emerald-400/35 bg-[linear-gradient(180deg,#2fb86d,#218f55)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_22px_rgba(33,143,85,0.26)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_16px_30px_rgba(33,143,85,0.3)]",
        destructive:
          "border border-red-400/35 bg-[linear-gradient(180deg,#ff6b7a,#e43f53)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_22px_rgba(228,63,83,0.22)] hover:-translate-y-0.5",
        outline:
          "border border-white/75 bg-white/70 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_22px_rgba(38,55,80,0.08)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/88",
        secondary:
          "border border-emerald-900/5 bg-[linear-gradient(180deg,#eef9e8,#dcefd5)] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(45,70,45,0.08)] hover:-translate-y-0.5 hover:bg-[#e6f4df]",
        reward:
          "border border-amber-300/50 bg-[linear-gradient(180deg,#ffe77d,#ffc947)] text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_22px_rgba(255,201,71,0.28)] hover:-translate-y-0.5",
        glass:
          "border border-white/75 bg-white/65 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_28px_rgba(38,55,80,0.1)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/82",
        ghost: "rounded-2xl text-slate-800 hover:bg-white/65 hover:text-slate-950 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_18px_rgba(38,55,80,0.08)]",
        link: "text-primary underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-7 text-base",
        hero: "h-[3.75rem] rounded-[1.35rem] px-8 text-base",
        icon: "h-11 w-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
