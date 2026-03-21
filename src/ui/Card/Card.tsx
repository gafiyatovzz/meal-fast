import styles from './Card.module.less'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className, accent }: CardProps) {
  return <div className={clsx(styles.card, accent && styles.accent, className)}>{children}</div>
}
