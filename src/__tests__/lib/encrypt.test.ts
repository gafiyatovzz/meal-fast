import { encrypt, decrypt } from '../../lib/encrypt'

describe('encrypt / decrypt', () => {
  it('возвращает строку в формате iv:tag:enc', () => {
    const result = encrypt('hello')
    const parts = result.split(':')
    expect(parts).toHaveLength(3)
    parts.forEach(part => expect(part).toMatch(/^[0-9a-f]+$/))
  })

  it('шифрует и расшифровывает roundtrip', () => {
    const plain = 'sk-ant-secret-key-123'
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it('каждый вызов encrypt создаёт разный IV', () => {
    const a = encrypt('same')
    const b = encrypt('same')
    expect(a).not.toBe(b)
  })

  it('расшифровывает Unicode строки', () => {
    const text = 'ключ-на-кириллице-Ö-😀'
    expect(decrypt(encrypt(text))).toBe(text)
  })

  it('шифрует пустую строку', () => {
    expect(decrypt(encrypt(''))).toBe('')
  })

  it('шифрует длинный ключ', () => {
    const longKey = 'A'.repeat(1000)
    expect(decrypt(encrypt(longKey))).toBe(longKey)
  })

  it('бросает ошибку при неверном формате', () => {
    expect(() => decrypt('invalid')).toThrow()
  })

  it('бросает ошибку при повреждённом тексте', () => {
    const enc = encrypt('data')
    const parts = enc.split(':')
    // Повреждаем зашифрованные данные
    parts[2] = 'deadbeef'
    expect(() => decrypt(parts.join(':'))).toThrow()
  })
})
