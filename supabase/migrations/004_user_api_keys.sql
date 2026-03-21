create table user_api_keys (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  anthropic_key text,
  openai_key    text,
  gemini_key    text,
  provider      text not null default 'anthropic',
  updated_at    timestamptz default now()
);

alter table user_api_keys enable row level security;
create policy "own keys" on user_api_keys for all using (auth.uid() = user_id);
