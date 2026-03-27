const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const sharp = require('sharp');
const https = require('https');

const app = express();
app.use(express.json({ limit: '50mb' }));

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) return get(res.headers.location);
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    get(imageUrl);
  });
}

app.post('/gerar-imagem', async (req, res) => {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const { imageUrl, titulo } = req.body;
  const tituloLimpo = (titulo || 'Terapias de Luz')
    .replace(/[^\w\s\u00C0-\u017F]/g, '')
    .trim()
    .toUpperCase();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Tenta usar imagem do Instagram como fundo
  try {
    if (imageUrl) {
      const imgBuf = await downloadImage(imageUrl);
      const header = imgBuf.slice(0, 4).toString('hex');
      if (header.startsWith('89504e47') || header.startsWith('ffd8ff')) {
        const bgBuf = await sharp(imgBuf).resize(WIDTH, HEIGHT, { fit: 'cover' }).toBuffer();
        const bg = await loadImage(bgBuf);
        ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
      } else throw new Error('invalid');
    } else throw new Error('no url');
  } catch {
    // Fallback roxo
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#0a0018');
    bg.addColorStop(0.5, '#43265F');
    bg.addColorStop(1, '#0a0018');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Overlay inferior
  const ov = ctx.createLinearGradient(0, HEIGHT * 0.45, 0, HEIGHT);
  ov.addColorStop(0, 'rgba(0,0,0,0)');
  ov.addColorStop(1, 'rgba(40,10,70,0.97)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Linha decorativa
  ctx.strokeStyle = 'rgba(200,150,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, HEIGHT - 280);
  ctx.lineTo(WIDTH - 60, HEIGHT - 280);
  ctx.stroke();

  // TÍTULO
  ctx.shadowColor = 'rgba(220,150,255,1)';
  ctx.shadowBlur = 25;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 85px Arial';

  const maxWidth = WIDTH - 120;
  const words = tituloLimpo.split(' ');
  let lines = [], current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineH = 100;
  let y = HEIGHT - 260 - (lines.length * lineH);
  for (const line of lines) {
    ctx.fillText(line, 60, y);
    y += lineH;
  }

  // Logo
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(210,170,255,0.9)';
  ctx.font = '28px Arial';
  ctx.fillText('@INSTITUTOTERAPIASDELUZ', 60, HEIGHT - 100);

  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer('image/png'));
});

const server = app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
server.timeout = 60000;
