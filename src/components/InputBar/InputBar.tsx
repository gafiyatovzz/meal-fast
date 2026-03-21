'use client'
import { useRef } from 'react'
import { Button, Chip } from '../../ui'
import styles from './InputBar.module.less'

interface PhotoState { base64: string; type: string; url: string }

interface InputBarProps {
  text: string
  onChange: (v: string) => void
  onSubmit: () => void
  onPhoto: (file: File) => void
  photo: PhotoState | null
  onRemovePhoto: () => void
  hints: string[]
  allHints: string[]
  onHintClick: (hint: string) => void
  onMoreHints: () => void
  disabled: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export function InputBar({
  text, onChange, onSubmit, onPhoto, photo, onRemovePhoto,
  hints, allHints, onHintClick, onMoreHints, disabled, textareaRef,
}: InputBarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const canSend = !disabled && (text.trim().length > 0 || !!photo)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onPhoto(file)
    e.target.value = ''
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.chips}>
        {hints.map(name => (
          <Chip key={name} label={name} onClick={() => onHintClick(name)} />
        ))}
        {allHints.length > 9 && (
          <Chip label="ещё →" onClick={onMoreHints} highlight />
        )}
      </div>

      {photo && (
        <div className={styles.preview}>
          <img src={photo.url} className={styles.previewImg} alt="" />
          <button className={styles.previewDel} onClick={onRemovePhoto}>✕</button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.fileInput}
        onChange={handleFile}
      />

      <div className={styles.inputBox}>
        <Button
          variant="icon"
          active={!!photo}
          onClick={() => fileRef.current?.click()}
          aria-label="Прикрепить фото"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </Button>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Что съел? Пиши или фоткай…"
          value={text}
          rows={1}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
          }}
        />

        <Button
          variant="icon"
          className={canSend ? styles.sendActive : styles.sendInactive}
          onClick={onSubmit}
          disabled={!canSend}
          aria-label="Отправить"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={canSend ? '#000' : '#666'} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
