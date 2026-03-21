export interface Meal {
  id: string
  name: string
  cal: number
  p: number
  f: number
  c: number
  thumb?: string
  meal_date: string
  created_at: string
  user_id: string
}

export interface Goals {
  cal: number
  p: number
  f: number
  c: number
}

export interface Anthro {
  weight: string
  height: string
  age: string
  gender: 'м' | 'ж'
}
