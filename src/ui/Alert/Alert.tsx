import styles from './Alert.module.less'

interface AlertProps {
  message: string
  onDismiss?: () => void
}

export function Alert({ message, onDismiss }: AlertProps) {
  return (
    <div className={styles.alert}>
      <span>{message}</span>
      {onDismiss && (
        <span className={styles.dismiss} onClick={onDismiss}>✕</span>
      )}
    </div>
  )
}
