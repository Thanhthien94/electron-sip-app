import React from 'react'
import { twMerge } from 'tailwind-merge'

// Responsive container component
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  fluid?: boolean
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className, 
  fluid = false,
  ...props 
}) => {
  return (
    <div 
      className={twMerge(
        fluid ? 'container-fluid' : 'container', 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive grid system
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number | string
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  className, 
  cols = 1,
  gap = 4, 
  ...props 
}) => {
  let gridColsClasses = ''
  
  if (typeof cols === 'number') {
    gridColsClasses = `grid-cols-1 sm:grid-cols-${Math.min(cols, 2)} md:grid-cols-${Math.min(cols, 4)} lg:grid-cols-${cols}`
  } else {
    gridColsClasses = [
      'grid-cols-1',
      cols.sm && `sm:grid-cols-${cols.sm}`,
      cols.md && `md:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`,
    ].filter(Boolean).join(' ')
  }
  
  const gapClass = typeof gap === 'number' ? `gap-${gap}` : `gap-[${gap}]`
  
  return (
    <div 
      className={twMerge(
        'grid', 
        gridColsClasses,
        gapClass,
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

// Hidden on breakpoint
interface HiddenProps {
  children: React.ReactNode
  on: 'sm' | 'md' | 'lg' | 'xl' | ('sm' | 'md' | 'lg' | 'xl')[]
}

export const Hidden: React.FC<HiddenProps> = ({ children, on }) => {
  const breakpoints = Array.isArray(on) ? on : [on]
  const classes = breakpoints.map(bp => `hide-${bp}`).join(' ')
  
  return <div className={classes}>{children}</div>
}

// Visible only on breakpoint
interface VisibleProps {
  children: React.ReactNode
  on: 'sm' | 'md' | 'lg' | 'xl' | ('sm' | 'md' | 'lg' | 'xl')[]
}

export const Visible: React.FC<VisibleProps> = ({ children, on }) => {
  const breakpoints = Array.isArray(on) ? on : [on]
  const allBreakpoints = ['sm', 'md', 'lg', 'xl'] as const
  const hiddenOn = allBreakpoints.filter(bp => !breakpoints.includes(bp))
  const classes = hiddenOn.map(bp => `hide-${bp}`).join(' ')
  
  return <div className={classes}>{children}</div>
}

// Responsive stack - changes direction based on screen size
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | { 
    sm?: 'row' | 'column' 
    md?: 'row' | 'column' 
    lg?: 'row' | 'column'
    xl?: 'row' | 'column'
  }
  spacing?: number | string
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

export const Stack: React.FC<StackProps> = ({
  children,
  className,
  direction = 'column',
  spacing = 4,
  align = 'start',
  justify = 'start',
  wrap = false,
  ...props
}) => {
  let directionClasses = ''
  
  if (typeof direction === 'string') {
    directionClasses = `flex-${direction} md:flex-${direction}`
  } else {
    directionClasses = [
      'flex-col', // Mobile default
      direction.sm && `sm:flex-${direction.sm}`,
      direction.md && `md:flex-${direction.md}`,
      direction.lg && `lg:flex-${direction.lg}`,
      direction.xl && `xl:flex-${direction.xl}`,
    ].filter(Boolean).join(' ')
  }
  
  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  }
  
  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }
  
  const alignClass = alignMap[align]
  const justifyClass = justifyMap[justify]
  const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap'
  const spacingClass = typeof spacing === 'number' ? `gap-${spacing}` : `gap-[${spacing}]`
  
  return (
    <div
      className={twMerge(
        'flex',
        directionClasses,
        alignClass,
        justifyClass,
        wrapClass,
        spacingClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive text - changes size based on screen size
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | { 
    sm?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    md?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    lg?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    xl?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }
  weight?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  align?: 'left' | 'center' | 'right' | 'justify'
  truncate?: boolean
  as?: keyof JSX.IntrinsicElements
}

export const Text: React.FC<TextProps> = ({
  children,
  className,
  size = 'md',
  weight = 'normal',
  align = 'left',
  truncate = false,
  as: Component = 'p',
  ...props
}) => {
  let sizeClasses = ''
  
  if (typeof size === 'string') {
    sizeClasses = `text-${size}`
  } else {
    sizeClasses = [
      'text-sm', // Mobile default
      size.sm && `sm:text-${size.sm}`,
      size.md && `md:text-${size.md}`,
      size.lg && `lg:text-${size.lg}`,
      size.xl && `xl:text-${size.xl}`,
    ].filter(Boolean).join(' ')
  }
  
  const weightClass = `font-${weight}`
  const alignClass = `text-${align}`
  const truncateClass = truncate ? 'truncate' : ''
  
  return (
    <Component
      className={twMerge(
        sizeClasses,
        weightClass,
        alignClass,
        truncateClass,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Screen reader only text
interface SrOnlyProps {
  children: React.ReactNode
}

export const SrOnly: React.FC<SrOnlyProps> = ({ children }) => {
  return <span className="sr-only">{children}</span>
}