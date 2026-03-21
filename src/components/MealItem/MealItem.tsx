'use client'
import { useState } from 'react'
import type { Meal } from '../../types'
import styles from './MealItem.module.less'

interface MealItemProps {
  meal: Meal
  onRemove: (id: string) => void
  onEdit?: () => void
}

export function MealItem({ meal, onRemove, onEdit }: MealItemProps) {
  const [photoOpen, setPhotoOpen] = useState(false)
  return (
    <div className={styles.item}>
      {meal.thumb && (
        <img
          src={meal.thumb}
          className={styles.thumb}
          alt=""
          onClick={() => setPhotoOpen(true)}
        />
      )}
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
      {onEdit && (
        <button className={styles.edit} onClick={onEdit} title="Редактировать">✎</button>
      )}
      <button className={styles.del} onClick={() => onRemove(meal.id)}>✕</button>

      {photoOpen && (
        <div className={styles.lightbox} onClick={() => setPhotoOpen(false)}>
          <img src={meal.thumb} className={styles.lightboxImg} alt="" />
        </div>
      )}
    </div>
  )
}
