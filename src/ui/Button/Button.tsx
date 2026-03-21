'use client'
import styles from './Button.module.less'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  active?: boolean
}

export function Button({ variant = 'primary', active, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.btn,
        styles[variant],
        active && styles.active,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
