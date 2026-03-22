'use client'
import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Input } from '../../ui'
import styles from './BarcodeScanner.module.less'

interface BarcodeScannerProps {
  open: boolean
  token: string
  onClose: () => void
  onConfirm: (meal: { name: string; cal: number; p: number; f: number; c: number }) => void
}

type Phase = 'scanning' | 'loading' | 'confirm' | 'error'
type ErrorKind = 'no-camera' | 'not-found' | 'fetch-error' | 'unknown'

interface Product {
  name: string
  cal100: number
  p100: number
  f100: number
  c100: number
}

const CAMERA_ERRORS = new Set([
  'NotAllowedError', 'NotFoundError', 'OverconstrainedError',
  'DevicesNotFoundError', 'TrackStartError', 'NotReadableError',
])

export function BarcodeScanner({ open, token: _token, onClose, onConfirm }: BarcodeScannerProps) {
  const [phase, setPhase] = useState<Phase>('scanning')
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null)
  const [errorDetail, setErrorDetail] = useState<string>('')
  const [product, setProduct] = useState<Product | null>(null)
  const [grams, setGrams] = useState('100')
  const [retryKey, setRetryKey] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!open) return

    setPhase('scanning')
    setProduct(null)
    setGrams('100')
    setErrorKind(null)
    setErrorDetail('')

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let controls: { stop(): void } | null = null

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled) return

        const codeReader = new BrowserMultiFormatReader()
        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          async (result: { getText(): string } | null | undefined, err: unknown) => {
            if (!result || cancelled) {
              // Ignore NotFoundException (no barcode in frame yet) — it fires continuously
              if (err && (err as Error).name !== 'NotFoundException') {
                console.error('[BarcodeScanner] decode error', err)
              }
              return
            }

            cancelled = true
            controls?.stop()
            setPhase('loading')

            const barcode = result.getText()
            try {
              const res = await fetch(`/api/barcode?barcode=${encodeURIComponent(barcode)}`)
              if (res.status === 404) {
                setErrorKind('not-found')
                setPhase('error')
                return
              }
              if (!res.ok) {
                setErrorKind('fetch-error')
                setPhase('error')
                return
              }
              const data: Product = await res.json()
              setProduct(data)
              setPhase('confirm')
            } catch {
              setErrorKind('fetch-error')
              setPhase('error')
            }
          }
        )
      } catch (e) {
        if (cancelled) return
        const err = e as Error
        console.error('[BarcodeScanner] init error:', err.name, err.message, err)
        const detail = `${err.name}: ${err.message}`
        setErrorDetail(detail)
        setErrorKind(CAMERA_ERRORS.has(err.name) ? 'no-camera' : 'unknown')
        setPhase('error')
      }
    }

    startScanner()

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [open, retryKey])

  function handleRetry() {
    setRetryKey(k => k + 1)
  }

  function handleConfirm() {
    if (!product) return
    const g = Math.max(1, parseInt(grams, 10) || 100)
    onConfirm({
      name: product.name,
      cal: Math.round(product.cal100 * g / 100),
      p: Math.round(product.p100 * g / 100),
      f: Math.round(product.f100 * g / 100),
      c: Math.round(product.c100 * g / 100),
    })
  }

  const g = Math.max(1, parseInt(grams, 10) || 100)
  const preview = product ? {
    cal: Math.round(product.cal100 * g / 100),
    p: Math.round(product.p100 * g / 100),
    f: Math.round(product.f100 * g / 100),
    c: Math.round(product.c100 * g / 100),
  } : null

  return (
    <Modal open={open} onClose={onClose} title="Штрих-код">
      {(phase === 'scanning' || phase === 'loading') && (
        <div className={styles.scannerWrap}>
          <div className={styles.viewfinderBox}>
            <video ref={videoRef} className={styles.viewfinder} autoPlay playsInline muted />
            {phase === 'scanning' && (
              <div className={styles.scanLine} />
            )}
            {phase === 'loading' && (
              <div className={styles.loadingOverlay}>
                <span className={styles.loadingText}>Ищу продукт…</span>
              </div>
            )}
          </div>
          <p className={styles.hint}>Наведите камеру на штрих-код товара</p>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
        </div>
      )}

      {phase === 'confirm' && product && (
        <div className={styles.confirmWrap}>
          <p className={styles.productName}>{product.name}</p>

          <div className={styles.per100}>
            <span>На 100г:</span>
            <span>{product.cal100} ккал</span>
            <span className={styles.protein}>Б {product.p100}г</span>
            <span className={styles.fat}>Ж {product.f100}г</span>
            <span className={styles.carb}>У {product.c100}г</span>
          </div>

          <div className={styles.gramsRow}>
            <Input
              label="Количество (г)"
              value={grams}
              onChange={e => setGrams(e.target.value.replace(/\D/g, ''))}
              placeholder="100"
            />
          </div>

          {preview && (
            <div className={styles.preview}>
              <span>{preview.cal} ккал</span>
              <span className={styles.protein}>Б {preview.p}г</span>
              <span className={styles.fat}>Ж {preview.f}г</span>
              <span className={styles.carb}>У {preview.c}г</span>
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose}>Отмена</Button>
            <Button variant="primary" onClick={handleConfirm}>Добавить</Button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className={styles.errorWrap}>
          <p className={styles.errorMsg}>
            {errorKind === 'no-camera' && 'Нет доступа к камере. Разрешите доступ в настройках браузера.'}
            {errorKind === 'not-found' && 'Продукт не найден в базе. Попробуйте ввести вручную.'}
            {errorKind === 'fetch-error' && 'Ошибка сети. Проверьте соединение и попробуйте снова.'}
            {errorKind === 'unknown' && 'Ошибка инициализации камеры.'}
          </p>
          {errorDetail && (
            <p className={styles.errorDetail}>{errorDetail}</p>
          )}
          <div className={styles.actions}>
            {(errorKind === 'fetch-error' || errorKind === 'unknown') && (
              <Button variant="secondary" onClick={handleRetry}>Повторить</Button>
            )}
            <Button variant="primary" onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
