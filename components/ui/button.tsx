import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { useAccessibility } from "../providers/accessibility-provider"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
  loading?: boolean
  loadingText?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaPressed?: boolean
  ariaExpanded?: boolean
  tooltip?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    ariaLabel,
    ariaDescribedBy,
    ariaPressed,
    ariaExpanded,
    tooltip,
    disabled,
    children,
    onClick,
    onKeyDown,
    ...props 
  }, ref) => {
    const { announce } = useAccessibility()
    const Comp = asChild ? Slot : "button"
    
    // Generate unique ID for tooltip if provided
    const tooltipId = React.useId()
    const isDisabled = disabled || loading

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault()
        return
      }

      // Announce button press for screen readers if it has state changes
      if (ariaPressed !== undefined) {
        const newState = !ariaPressed
        announce(`Button ${newState ? 'pressed' : 'not pressed'}`, 'polite')
      }

      if (ariaExpanded !== undefined) {
        const newState = !ariaExpanded
        announce(`${newState ? 'Expanded' : 'Collapsed'}`, 'polite')
      }

      onClick?.(event)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle Enter and Space keys for accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        if (isDisabled) {
          event.preventDefault()
          return
        }
        
        // Prevent default space behavior (scrolling) for buttons
        if (event.key === ' ') {
          event.preventDefault()
        }
        
        // Trigger click for keyboard users
        if (onClick) {
          onClick(event as any)
        }
      }

      onKeyDown?.(event)
    }

    return (
      <>
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            // High contrast mode improvements
            "high-contrast:border-2 high-contrast:border-current",
            // Focus improvements for keyboard navigation
            "focus-visible:ring-offset-background",
            // Loading state styling
            loading && "cursor-not-allowed",
            // Disabled state improvements
            isDisabled && "cursor-not-allowed opacity-50"
          )}
          ref={ref}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || (tooltip ? tooltipId : undefined)}
          aria-pressed={ariaPressed}
          aria-expanded={ariaExpanded}
          aria-busy={loading}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {loading && (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              <span className="sr-only">Loading</span>
            </>
          )}
          
          {loading && loadingText ? loadingText : children}
        </Comp>
        
        {/* Tooltip for additional context */}
        {tooltip && (
          <div
            id={tooltipId}
            className="sr-only"
            role="tooltip"
          >
            {tooltip}
          </div>
        )}
      </>
    )
  }
)
Button.displayName = "Button"

// Specialized button variants for common use cases

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode
  label: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = "icon", ariaLabel, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        ariaLabel={ariaLabel || label}
        {...props}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export interface ToggleButtonProps extends ButtonProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  pressedLabel?: string
  unpressedLabel?: string
}

export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ 
    pressed, 
    onPressedChange, 
    pressedLabel, 
    unpressedLabel, 
    children,
    ariaLabel,
    ...props 
  }, ref) => {
    const handleClick = () => {
      onPressedChange(!pressed)
    }

    const getAriaLabel = () => {
      if (ariaLabel) return ariaLabel
      if (pressed && pressedLabel) return pressedLabel
      if (!pressed && unpressedLabel) return unpressedLabel
      return undefined
    }

    return (
      <Button
        ref={ref}
        variant={pressed ? "default" : "outline"}
        ariaPressed={pressed}
        ariaLabel={getAriaLabel()}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
ToggleButton.displayName = "ToggleButton"

export interface MenuButtonProps extends ButtonProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  menuId: string
}

export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ 
    expanded, 
    onExpandedChange, 
    menuId, 
    children,
    ...props 
  }, ref) => {
    const handleClick = () => {
      onExpandedChange(!expanded)
    }

    return (
      <Button
        ref={ref}
        ariaExpanded={expanded}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
MenuButton.displayName = "MenuButton"

export { buttonVariants }
