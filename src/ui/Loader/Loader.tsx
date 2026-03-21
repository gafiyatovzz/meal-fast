import styles from './Loader.module.less'

export function Loader() {
  return (
    <div className={styles.dots}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={styles.dot}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}
