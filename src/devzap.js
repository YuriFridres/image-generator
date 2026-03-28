export async function sendWhatsApp(phone, message) {
  const res = await fetch(`${process.env.DEVZAP_URL}/message/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.DEVZAP_KEY
    },
    body: JSON.stringify({
      number: phone,
      text: message
    })
  });
  return res.json();
}
