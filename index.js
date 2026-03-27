const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const sharp = require('sharp');
const https = require('https');

const app = express();
app.use(express.json({ limit: '50mb' }));

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout ao baixar imagem')), 30000);
    https.get(imageUrl, (res) => {
      clearTimeout(timeout);
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

app.post('/gerar-imagem', async (req, res) => {
  try {
    const { titulo } = req.body;
    const WIDTH = 1080;
    const HEIGHT = 1350;

    // Gera imagem com Pollinations
    const tema = encodeURIComponent(`spiritual divine light healing energy mystical nature ${titulo} high quality`);
    const imageUrl = `https://image.pollinations.ai/prompt/${tema}?width=1080&height=1350&nologo=true&seed=${Date.now()}`;

    const imgBuffer = await downloadImage(imageUrl);

    // Verifica se é imagem válida
    const header = imgBuffer.slice(0, 4).toString('hex');
    const isValid = header.startsWith('89504e47') || header.startsWith('ffd8ff');
    if (!isValid) {
      return res.status(400).json({ error: 'Imagem inválida do Pollinations', header });
    }

    const bgBuffer = await sharp(imgBuffer)
      .resize(WIDTH, HEIGHT, { fit: 'cover' })
      .toBuffer();

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const bgImage = await loadImage(bgBuffer);
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

    const gradient = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(67,38,95,0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px sans-serif';
    const maxWidth = WIDTH - 120;
    const words = titulo.toUpperCase().split(' ');
    let lines = [];
    let currentLine = '';
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

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
