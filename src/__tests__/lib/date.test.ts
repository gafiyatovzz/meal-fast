import { localDateStr, today, addDays, formatDateLong, formatDateShort } from '../../lib/date'

describe('localDateStr', () => {
  it('форматирует дату в YYYY-MM-DD', () => {
    expect(localDateStr(new Date(2025, 0, 5))).toBe('2025-01-05')
  })

  it('дополняет месяц и день нулями', () => {
    expect(localDateStr(new Date(2025, 8, 3))).toBe('2025-09-03')
  })

  it('корректно обрабатывает декабрь', () => {
    expect(localDateStr(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

describe('today', () => {
  it('возвращает строку в формате YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('совпадает с текущей датой', () => {
    const d = new Date()
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(today()).toBe(expected)
  })
})

describe('addDays', () => {
  it('добавляет положительное число дней', () => {
    expect(addDays('2025-01-01', 5)).toBe('2025-01-06')
  })

  it('добавляет 0 дней (та же дата)', () => {
    expect(addDays('2025-03-15', 0)).toBe('2025-03-15')
  })

  it('вычитает дни (отрицательное число)', () => {
    expect(addDays('2025-01-10', -5)).toBe('2025-01-05')
  })

  it('пересекает границу месяца', () => {
    expect(addDays('2025-01-30', 5)).toBe('2025-02-04')
  })

  it('пересекает границу года', () => {
    expect(addDays('2024-12-30', 5)).toBe('2025-01-04')
  })

  it('корректно работает с 1 днём вперёд', () => {
    expect(addDays('2025-03-22', 1)).toBe('2025-03-23')
  })

  it('корректно работает с 1 днём назад', () => {
    expect(addDays('2025-03-22', -1)).toBe('2025-03-21')
  })
})

describe('formatDateLong', () => {
  it('возвращает строку с месяцем на русском', () => {
    const result = formatDateLong('2025-03-15')
    expect(result).toMatch(/марта/i)
  })

  it('содержит число месяца', () => {
    const result = formatDateLong('2025-01-20')
    expect(result).toContain('20')
  })

  it('содержит день недели', () => {
    // 2025-01-06 — понедельник
    const result = formatDateLong('2025-01-06')
    expect(result).toMatch(/понедельник/i)
  })
})

describe('formatDateShort', () => {
  it('возвращает строку (не пустую)', () => {
    const result = formatDateShort('2025-03-22')
    expect(result.length).toBeGreaterThan(0)
  })

  it('содержит число', () => {
    const result = formatDateShort('2025-03-22')
    expect(result).toMatch(/22/)
  })

  it('возвращает строку для любой даты', () => {
    expect(() => formatDateShort('2024-12-31')).not.toThrow()
  })
})
