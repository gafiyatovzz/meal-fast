'use client'
import { Modal, Button } from '../../ui'
import styles from './HistoryModal.module.less'

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  hints: string[]
  onSelect: (hint: string) => void
}

export function HistoryModal({ open, onClose, hints, onSelect }: HistoryModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="История блюд">
      <div className={styles.list}>
        {hints.map(name => (
          <div key={name} className={styles.item} onClick={() => { onSelect(name); onClose() }}>
            {name}
          </div>
        ))}
      </div>
      <Button variant="secondary" className={styles.close} onClick={onClose}>Закрыть</Button>
    </Modal>
  )
}
