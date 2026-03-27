const express = require('express');
const { createCanvas } = require('@napi-rs/canvas');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Remove emojis e caracteres especiais
function limparTexto(texto) {
  return texto.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
}

function drawDesign(ctx, WIDTH, HEIGHT, titulo, seed) {
  // Seed para aleatoriedade consistente
  let s = seed || 12345;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  // Fundo gradiente
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#0d0120');
  bg.addColorStop(0.3, '#1a0533');
  bg.addColorStop(0.6, '#43265F');
  bg.addColorStop(1, '#0d0120');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Brilhos
  const addGlow = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  };
  addGlow(WIDTH * 0.75, HEIGHT * 0.2, 450, 'rgba(160,80,255,0.35)');
  addGlow(WIDTH * 0.2, HEIGHT * 0.45, 380, 'rgba(80,40,180,0.3)');
  addGlow(WIDTH * 0.5, HEIGHT * 0.05, 280, 'rgba(255,180,80,0.12)');

  // Estrelas
  for (let i = 0; i < 150; i++) {
    const x = rand() * WIDTH;
    const y = rand() * HEIGHT * 0.75;
    const r = rand() * 2 + 0.3;
    const alpha = rand() * 0.7 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Overlay inferior
  const ov = ctx.createLinearGradient(0, HEIGHT * 0.4, 0, HEIGHT);
  ov.addColorStop(0, 'rgba(0,0,0,0)');
  ov.addColorStop(1, 'rgba(20,5,45,0.98)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Linha decorativa
  ctx.strokeStyle = 'rgba(180,100,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, HEIGHT - 250);
  ctx.lineTo(WIDTH - 60, HEIGHT - 250);
  ctx.stroke();

  // Título
  const tituloLimpo = limparTexto(titulo).toUpperCase();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 82px sans-serif';
  ctx.shadowColor = 'rgba(180,100,255,0.9)';
  ctx.shadowBlur = 25;

  const maxWidth = WIDTH - 120;
  const words = tituloLimpo.split(' ');
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
  if (currentLine) lines.push(currentLine);

  const lineHeight = 100;
  let startY = HEIGHT - 160 - (lines.length * lineHeight);
  for (const line of lines) {
    ctx.fillText(line, 60, startY);
    startY += lineHeight;
  }

  // Logo
  ctx.font = '26px sans-serif';
  ctx.fillStyle = 'rgba(200,150,255,0.9)';
  ctx.shadowBlur = 0;
  ctx.fillText('@INSTITUTOTERAPIASDELUZ', 60, HEIGHT - 75);
}

app.post('/gerar-imagem', async (req, res) => {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const { titulo } = req.body;
  const seed = titulo ? titulo.length * 137 + titulo.charCodeAt(0) * 31 : 12345;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  drawDesign(ctx, WIDTH, HEIGHT, titulo || 'Terapias de Luz', seed);

  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer('image/png'));
});

const server = app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
server.timeout = 30000;
