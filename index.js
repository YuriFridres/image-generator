const express = require('express');
const { createCanvas } = require('@napi-rs/canvas');

const app = express();
app.use(express.json({ limit: '10mb' }));

function drawDesign(ctx, WIDTH, HEIGHT, titulo) {
  // Fundo gradiente espiritual
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#1a0533');
  bg.addColorStop(0.4, '#43265F');
  bg.addColorStop(0.7, '#2d1b4e');
  bg.addColorStop(1, '#0d0120');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Círculos de luz
  const addGlow = (x, y, r, color) => {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  };
  addGlow(WIDTH * 0.7, HEIGHT * 0.25, 400, 'rgba(180,100,255,0.3)');
  addGlow(WIDTH * 0.2, HEIGHT * 0.5, 350, 'rgba(100,50,200,0.25)');
  addGlow(WIDTH * 0.5, HEIGHT * 0.1, 300, 'rgba(255,200,100,0.15)');

  // Estrelas
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT * 0.7;
    const r = Math.random() * 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gradiente inferior
  const overlay = ctx.createLinearGradient(0, HEIGHT * 0.45, 0, HEIGHT);
  overlay.addColorStop(0, 'rgba(0,0,0,0)');
  overlay.addColorStop(1, 'rgba(30,5,60,0.97)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Linha decorativa
  ctx.strokeStyle = 'rgba(180,100,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, HEIGHT - 240);
  ctx.lineTo(WIDTH - 60, HEIGHT - 240);
  ctx.stroke();

  // Título
  ctx.fillStyle = 'white';
  ctx.font = 'bold 82px sans-serif';
  ctx.shadowColor = 'rgba(180,100,255,0.8)';
  ctx.shadowBlur = 20;
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

  const lineHeight = 98;
  let startY = HEIGHT - 160 - (lines.length * lineHeight);
  for (const line of lines) {
    ctx.fillText(line, 60, startY);
    startY += lineHeight;
  }

  // Logo
  ctx.font = '26px sans-serif';
  ctx.fillStyle = 'rgba(200,150,255,0.9)';
  ctx.shadowBlur = 0;
  ctx.fillText('@INSTITUTOTERAPIASDELUZ', 60, HEIGHT - 70);
}

app.post('/gerar-imagem', async (req, res) => {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const { titulo } = req.body;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Seed para estrelas consistentes por título
  Math.seedrandom = (seed) => {
    let s = seed;
    Math.random = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  };
  if (titulo) Math.seedrandom(titulo.length * 137);

  drawDesign(ctx, WIDTH, HEIGHT, titulo || 'Terapias de Luz');

  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer('image/png'));
});

const server = app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
server.timeout = 30000;
