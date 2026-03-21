'use client'
import { Modal, Button, Input } from '../../ui'
import type { Goals, Anthro } from '../../types'
import styles from './SettingsModal.module.less'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  goals: Goals
  onGoalsChange: (g: Goals) => void
  anthro: Anthro
  onAnthroChange: (a: Anthro) => void
  onSave: () => void
}

export function SettingsModal({ open, onClose, goals, onGoalsChange, anthro, onAnthroChange, onSave }: SettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Настройки">
      <div className={styles.section}>Цели питания</div>
      <Input label="Калории в день" type="number" value={goals.cal}
        onChange={e => onGoalsChange({ ...goals, cal: +e.target.value })} />
      <div className={styles.grid}>
        <Input label="Белки (г)" type="number" value={goals.p}
          onChange={e => onGoalsChange({ ...goals, p: +e.target.value })} />
        <Input label="Жиры (г)" type="number" value={goals.f}
          onChange={e => onGoalsChange({ ...goals, f: +e.target.value })} />
      </div>
      <Input label="Углеводы (г)" type="number" value={goals.c}
        onChange={e => onGoalsChange({ ...goals, c: +e.target.value })} />

      <div className={styles.section} style={{ marginTop: 20 }}>Антропометрия</div>
      <div className={styles.grid}>
        <Input label="Вес (кг)" type="number" value={anthro.weight} placeholder="70"
          onChange={e => onAnthroChange({ ...anthro, weight: e.target.value })} />
        <Input label="Рост (см)" type="number" value={anthro.height} placeholder="175"
          onChange={e => onAnthroChange({ ...anthro, height: e.target.value })} />
      </div>
      <div className={styles.grid}>
        <Input label="Возраст" type="number" value={anthro.age} placeholder="25"
          onChange={e => onAnthroChange({ ...anthro, age: e.target.value })} />
        <div>
          <div className={styles.genderLabel}>Пол</div>
          <div className={styles.genderRow}>
            {(['м', 'ж'] as const).map(g => (
              <button
                key={g}
                className={styles.genderBtn}
                data-active={anthro.gender === g}
                onClick={() => onAnthroChange({ ...anthro, gender: g })}
              >
                {g === 'м' ? '♂ муж' : '♀ жен'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button variant="primary" onClick={onSave}>Сохранить</Button>
      </div>
    </Modal>
  )
}
