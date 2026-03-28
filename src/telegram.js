const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function createInviteLink(email) {
  const encodedEmail = encodeURIComponent(email);
  const res = await fetch(`${BASE}/createChatInviteLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 86400 // 24h
    })
  });
  const data = await res.json();
  // Retorna o link + o deep link para capturar o user_id depois
  return {
    invite_link: data.result?.invite_link,
    start_link: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${encodedEmail}`
  };
}

export async function removeMember(telegram_user_id) {
  const res = await fetch(`${BASE}/banChatMember`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      user_id: telegram_user_id
    })
  });
  // Desbane imediatamente para não impedir entrada futura
  await fetch(`${BASE}/unbanChatMember`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      user_id: telegram_user_id,
      only_if_banned: true
    })
  });
  return res.json();
}

// Recebe updates do Telegram — captura /start com email encoded
export async function handleTelegramUpdate(req, res) {
  res.sendStatus(200); // responde imediatamente pro Telegram
  const msg = req.body?.message;
  if (!msg?.text?.startsWith('/start')) return;

  const parts = msg.text.split(' ');
  const email = parts[1] ? decodeURIComponent(parts[1]) : null;
  if (!email || !email.includes('@')) return;

  const { saveTelegramId } = await import('./db.js');
  await saveTelegramId({
    email,
    telegram_user_id: msg.from.id
  });

  console.log(`Mapeado: ${email} → telegram_id ${msg.from.id}`);
}
