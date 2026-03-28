const BASE = process.env.EVOLUTION_URL;
const KEY  = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'grupos';
const GROUP_JID = process.env.GROUP_JID;

async function evRequest(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log(`[Evolution] ${path}:`, JSON.stringify(data));
  return data;
}

export async function addToGroup(phone) {
  return evRequest(`/group/addParticipant/${INSTANCE}`, {
    groupJid: GROUP_JID,
    participants: [`${phone}@s.whatsapp.net`]
  });
}

export async function removeFromGroup(phone) {
  return evRequest(`/group/removeParticipant/${INSTANCE}`, {
    groupJid: GROUP_JID,
    participants: [`${phone}@s.whatsapp.net`]
  });
}
