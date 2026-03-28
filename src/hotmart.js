import { saveMember, getMemberByEmail } from './db.js';
import { createInviteLink, removeMember } from './telegram.js';
import { sendWhatsApp } from './devzap.js';

const COMPRA_EVENTS = ['PURCHASE_APPROVED'];
const CANCEL_EVENTS = [
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'SUBSCRIPTION_CANCELLATION'
];

function normalizePhone(raw = '') {
  const digits = raw.replace(/\D/g, '').replace(/^0/, '');
  return digits.startsWith('55') ? digits : '55' + digits;
}

export async function handleHotmart(req, res) {
  res.sendStatus(200); // responde rápido pro Hotmart não retentar

  const { event, data } = req.body;
  if (!event || !data) return;

  const email = data.buyer?.email;
  const name  = data.buyer?.name?.split(' ')[0] || 'você';
  const phone = normalizePhone(data.buyer?.phone || '');

  console.log(`[${event}] ${email} ${phone}`);

  // --- COMPRA APROVADA ---
  if (COMPRA_EVENTS.includes(event)) {
    await saveMember({ email, phone });

    const { invite_link, start_link } = await createInviteLink(email);

    const msg =
      `Olá, ${name}! 🎉 Seu acesso foi liberado.\n\n` +
      `👉 Entre no grupo exclusivo:\n${invite_link}\n\n` +
      `Após entrar no grupo, clique aqui para ativar seu acesso completo:\n${start_link}`;

    await sendWhatsApp(phone, msg);
    console.log(`Adicionado: ${email}`);
  }

  // --- CANCELAMENTO / REEMBOLSO ---
  if (CANCEL_EVENTS.includes(event)) {
    const member = await getMemberByEmail(email);

    if (member?.telegram_user_id) {
      await removeMember(member.telegram_user_id);
      console.log(`Removido do Telegram: ${email}`);
    } else {
      console.warn(`Sem telegram_user_id para ${email} — remoção manual necessária`);
    }
  }
}
