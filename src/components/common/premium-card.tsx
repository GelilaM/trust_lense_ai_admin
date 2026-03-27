import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PremiumCardProps extends React.ComponentProps<typeof Card> {
  glass?: boolean
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, glass, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "card-no-line",
        glass && "bg-surface/80 backdrop-blur-xl",
        className
      )}
      {...props}
    />
  )
)
PremiumCard.displayName = "PremiumCard"

export { PremiumCard, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
