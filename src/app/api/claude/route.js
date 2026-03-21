export async function POST(req) {
  const { text, imageBase64, imageType } = await req.json()

  let userContent
  if (imageBase64) {
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
      { type: 'text', text: text ? `На фото еда. Дополнительно: ${text}` : 'Что на фото? Оцени КБЖУ порции.' }
    ]
  } else {
    userContent = text
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `Ты — нутрициолог. Оцени стандартную порцию блюда. Верни ТОЛЬКО JSON без markdown:
{"name":"Короткое название (рус)","cal":число,"p":число,"f":число,"c":число}
cal=калории, p=белки г, f=жиры г, c=углеводы г. Все значения — целые числа. Несколько блюд — суммируй.`,
      messages: [{ role: 'user', content: userContent }]
    })
  })

  if (!res.ok) {
    const err = await res.text()
    return Response.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.content.map(b => b.text || '').join('')
  try {
    const meal = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    return Response.json(meal)
  } catch {
    return Response.json({ error: 'Parse error', raw }, { status: 500 })
  }
}
