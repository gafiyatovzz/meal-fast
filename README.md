# Ем и расту — трекер питания

AI-трекер питания: пишешь или фоткаешь еду, Claude считает КБЖУ, данные хранятся в Supabase.

## Функционал

### Добавление приёмов пищи
- **Текстом** — напиши что съел, Claude распознает блюдо и рассчитает КБЖУ
- **Фото** — сфоткай еду, AI определит состав и питательную ценность
- **Быстрые подсказки** — чипсы с популярными блюдами для быстрого добавления

### Дневное отслеживание
- Счётчик калорий с прогресс-баром относительно цели
- Разбивка по макронутриентам: белки, жиры, углеводы
- Список всех приёмов пищи за текущий день с возможностью удаления

### Личные цели
- Настройка дневной нормы калорий и КБЖУ
- Цели сохраняются локально в браузере

### Технологии
- **AI**: Claude (Anthropic) — анализ текста и фото для расчёта КБЖУ
- **База данных**: Supabase — хранение приёмов пищи
- **Frontend**: Next.js (React)

---

## Быстрый старт

### 1. Создай таблицу в Supabase

Зайди в SQL Editor своего проекта и выполни:

```sql
create table meals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  meal_date date default current_date,
  name text not null,
  cal int, p int, f int, c int,
  thumb text
);

alter table meals enable row level security;
create policy "allow all" on meals for all using (true);
```

### 2. Настрой переменные окружения

Скопируй `.env.example` в `.env.local` и заполни:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

- **Supabase**: Settings → API Keys → Project URL + Publishable key
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com) → API Keys

### 3. Запусти локально

```bash
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## Deploy на Railway

1. Запушь в GitHub
2. Зайди на [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Добавь переменные окружения в Railway: Variables → те же три что в `.env.local`
4. Railway сам соберёт и задеплоит ✅

Переменные для Railway:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ANTHROPIC_API_KEY
```
