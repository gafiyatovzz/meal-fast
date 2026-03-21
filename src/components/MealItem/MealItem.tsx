import type { Meal } from '../../types'
import styles from './MealItem.module.less'

interface MealItemProps {
  meal: Meal
  onRemove: (id: string) => void
}

export function MealItem({ meal, onRemove }: MealItemProps) {
  return (
    <div className={styles.item}>
      {meal.thumb && <img src={meal.thumb} className={styles.thumb} alt="" />}
      <div className={styles.info}>
        <div className={styles.name}>{meal.name}</div>
        <div className={styles.macros}>
          <span className={styles.protein}>Б {Math.round(meal.p)}г</span>
          <span className={styles.fat}>Ж {Math.round(meal.f)}г</span>
          <span className={styles.carb}>У {Math.round(meal.c)}г</span>
        </div>
      </div>
      <div className={styles.cal}>
        {Math.round(meal.cal)}<span className={styles.calUnit}> ккал</span>
      </div>
      <button className={styles.del} onClick={() => onRemove(meal.id)}>✕</button>
    </div>
  )
}
