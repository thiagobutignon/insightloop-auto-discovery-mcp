import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark" | "light"
  blur?: "sm" | "md" | "lg" | "xl"
  hoverable?: boolean
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "md", hoverable = false, children, ...props }, ref) => {
    const blurClass = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl"
    }[blur]

    const variantClass = {
      default: "bg-glass border-glass-border",
      dark: "bg-glass-dark border-white/10",
      light: "bg-white/20 border-white/30"
    }[variant]

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-6 transition-all duration-300",
          blurClass,
          variantClass,
          "border",
          "shadow-[0_8px_32px_rgba(31,38,135,0.15)]",
          hoverable && "hover:transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(31,38,135,0.2)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = "GlassCard"