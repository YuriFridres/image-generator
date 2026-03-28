import { addToGroup, removeFromGroup } from './evolution.js';

const COMPRA_EVENTS = [
  'PURCHASE_APPROVED'
];

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
  res.sendStatus(200); // responde imediatamente pro Hotmart não retentar

  const { event, data } = req.body;
  if (!event || !data) return;

  const email = data.buyer?.email;
  const phone = normalizePhone(data.buyer?.phone || '');

  if (!phone || phone.length < 12) {
    console.warn(`[${event}] Telefone inválido para ${email}: "${phone}"`);
    return;
  }

  console.log(`[${event}] ${email} → ${phone}`);

  if (COMPRA_EVENTS.includes(event)) {
    await addToGroup(phone);
  }

  if (CANCEL_EVENTS.includes(event)) {
    await removeFromGroup(phone);
  }
}
