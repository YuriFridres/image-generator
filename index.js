const express = require('express');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const sharp = require('sharp');
const https = require('https');
const http = require('http');

const app = express();
app.use(express.json());

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

app.post('/gerar-imagem', async (req, res) => {
  try {
    const { imageUrl, titulo } = req.body;
    const WIDTH = 1080;
    const HEIGHT = 1350;

    // Baixa e redimensiona a imagem de fundo
    const imgBuffer = await downloadImage(imageUrl);
    const bgBuffer = await sharp(imgBuffer)
      .resize(WIDTH, HEIGHT, { fit: 'cover' })
      .toBuffer();

    // Canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Fundo
    const bgImage = await loadImage(bgBuffer);
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

    // Gradiente roxo embaixo
    const gradient = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(67,38,95,0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Título
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'left';

    // Quebra de linha automática
    const maxWidth = WIDTH - 120;
    const words = titulo.toUpperCase().split(' ');
    let lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = 95;
    const totalTextHeight = lines.length * lineHeight;
    let startY = HEIGHT - 180 - totalTextHeight;

    for (const line of lines) {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(line, 60, startY);
      startY += lineHeight;
    }

    // Logo
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 0;
    ctx.fillText('@INSTITUTOTERAPIASDELUZ', 60, HEIGHT - 80);

    const pngBuffer = canvas.toBuffer('image/png');
    res.set('Content-Type', 'image/png');
    res.send(pngBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Rodando na porta 3000!'));
