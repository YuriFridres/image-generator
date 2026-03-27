const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const sharp = require('sharp');
const https = require('https');

const app = express();
app.use(express.json({ limit: '50mb' }));

async function downloadImage(imageUrl, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    const get = (u) => {
      https.get(u, { timeout: 120000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          clearTimeout(timer);
          return get(res.headers.location);
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
        res.on('error', (e) => { clearTimeout(timer); reject(e); });
      }).on('error', (e) => { clearTimeout(timer); reject(e); });
    };
    get(imageUrl);
  });
}

function drawDesign(ctx, WIDTH, HEIGHT, titulo) {
  const gradient = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(67,38,95,0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 80px sans-serif';
  const maxWidth = WIDTH - 120;
  const words = titulo.toUpperCase().split(' ');
  let lines = [], currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const lineHeight = 95;
  let startY = HEIGHT - 180 - (lines.length * lineHeight);
  for (const line of lines) {
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(line, 60, startY);
    startY += lineHeight;
  }

  ctx.font = '28px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 0;
  ctx.fillText('@INSTITUTOTERAPIASDELUZ', 60, HEIGHT - 80);
}

app.post('/gerar-imagem', async (req, res) => {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const { titulo } = req.body;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  try {
    // Usa modelo turbo — muito mais rápido
    // Unsplash - sempre funciona, imagens espirituais/natureza
const temas = ['spiritual,meditation,light', 'nature,forest,light', 'universe,cosmos,stars', 'healing,nature,peace', 'energy,light,divine'];
const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];
const imageUrl = `https://source.unsplash.com/1080x1350/?${temaAleatorio}&sig=${Date.now()}`;

    console.log('Gerando imagem turbo:', imageUrl);
    const imgBuffer = await downloadImage(imageUrl, 120000);

    const header = imgBuffer.slice(0, 4).toString('hex');
    const isValid = header.startsWith('89504e47') || header.startsWith('ffd8ff');
    console.log('Header:', header, 'Válido:', isValid);

    if (isValid) {
      const bgBuffer = await sharp(imgBuffer).resize(WIDTH, HEIGHT, { fit: 'cover' }).toBuffer();
      const bgImage = await loadImage(bgBuffer);
      ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    } else {
      ctx.fillStyle = '#43265F';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  } catch (err) {
    console.error('Erro ao gerar imagem:', err.message);
    ctx.fillStyle = '#43265F';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  drawDesign(ctx, WIDTH, HEIGHT, titulo || 'Terapias de Luz');
  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer('image/png'));
});

const server = app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
server.timeout = 300000;
