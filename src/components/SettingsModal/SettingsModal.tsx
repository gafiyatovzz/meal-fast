'use client'
import { Modal, Button, Input } from '../../ui'
import type { Goals, Anthro } from '../../types'
import styles from './SettingsModal.module.less'

export interface ApiKeysState {
  anthropic: string | null   // null = delete, '' = keep, 'sk-...' = new key
  openai:    string | null
  gemini:    string | null
  provider:  'anthropic' | 'openai' | 'gemini'
}

export interface ApiKeysSet {
  anthropic: boolean
  openai:    boolean
  gemini:    boolean
}

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  goals: Goals
  onGoalsChange: (g: Goals) => void
  anthro: Anthro
  onAnthroChange: (a: Anthro) => void
  keysSet: ApiKeysSet
  tmpKeys: ApiKeysState
  onKeysChange: (k: ApiKeysState) => void
  onSave: () => void
}

const PROVIDERS: Array<{ id: 'anthropic' | 'openai' | 'gemini'; label: string; ph: string }> = [
  { id: 'anthropic', label: 'Claude (Anthropic)', ph: 'sk-ant-...' },
  { id: 'openai',    label: 'OpenAI',             ph: 'sk-...' },
  { id: 'gemini',    label: 'Google Gemini',       ph: 'AIza...' },
]

export function SettingsModal({
  open, onClose, goals, onGoalsChange, anthro, onAnthroChange,
  keysSet, tmpKeys, onKeysChange, onSave,
}: SettingsModalProps) {
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

      <div className={styles.section}>Антропометрия</div>
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

      <div className={styles.section}>AI провайдер</div>
      <div className={styles.providerRow}>
        {PROVIDERS.map(({ id, label }) => (
          <button
            key={id}
            className={styles.providerBtn}
            data-active={tmpKeys.provider === id}
            onClick={() => onKeysChange({ ...tmpKeys, provider: id })}
          >
            <span className={styles.providerLabel}>{label}</span>
            {keysSet[id] && tmpKeys[id] !== null && (
              <span className={styles.keyDot} />
            )}
          </button>
        ))}
      </div>

      {PROVIDERS.map(({ id, ph }) => {
        const isSet = keysSet[id]
        const val = tmpKeys[id]
        const deleted = val === null
        return (
          <div key={id} className={styles.keyRow}>
            <Input
              label=""
              type="password"
              value={deleted ? '' : (val ?? '')}
              placeholder={isSet && !deleted ? '••••••••••••' : ph}
              disabled={deleted}
              onChange={e => onKeysChange({ ...tmpKeys, [id]: e.target.value })}
            />
            <div className={styles.keyActions}>
              {deleted
                ? <button className={styles.undoDelete} onClick={() => onKeysChange({ ...tmpKeys, [id]: '' })}>↩ отменить удаление</button>
                : isSet && <button className={styles.deleteKey} onClick={() => onKeysChange({ ...tmpKeys, [id]: null })}>✕ удалить ключ</button>
              }
            </div>
          </div>
        )
      })}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button variant="primary" onClick={onSave}>Сохранить</Button>
      </div>
    </Modal>
  )
}
