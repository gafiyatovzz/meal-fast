import { Card } from '../../ui'
import type { Goals } from '../../types'
import styles from './GoalBanner.module.less'

export function GoalBanner({ goals }: { goals: Goals }) {
  return (
    <Card accent className={styles.banner}>
      <span className={styles.accent}>{goals.cal} ккал</span>
      {' · '}Б <span className={styles.protein}>{goals.p}г</span>
      {' · '}Ж <span className={styles.fat}>{goals.f}г</span>
      {' · '}У <span className={styles.carb}>{goals.c}г</span>
    </Card>
  )
}
