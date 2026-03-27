const express = require('express');
const { createCanvas } = require('@napi-rs/canvas');

const app = express();
app.use(express.json({ limit: '10mb' }));

function limparTexto(texto) {
  return texto.replace(/[^\w\s\u00C0-\u017F]/g, '').trim();
}

app.post('/gerar-imagem', async (req, res) => {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const titulo = limparTexto(req.body.titulo || 'Terapias de Luz').toUpperCase();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Fundo gradiente roxo
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a0018');
  bg.addColorStop(0.5, '#2d0f5e');
  bg.addColorStop(1, '#0a0018');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Brilho central
  const glow = ctx.createRadialGradient(WIDTH/2, HEIGHT*0.3, 0, WIDTH/2, HEIGHT*0.3, 500);
  glow.addColorStop(0, 'rgba(150,80,255,0.4)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Estrelas simples
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT * 0.8;
    const r = Math.random() * 2 + 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Overlay inferior
  const ov = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
  ov.addColorStop(0, 'rgba(0,0,0,0)');
  ov.addColorStop(1, 'rgba(10,0,30,0.97)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Linha decorativa
  ctx.strokeStyle = 'rgba(180,100,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, HEIGHT - 280);
  ctx.lineTo(WIDTH - 60, HEIGHT - 280);
  ctx.stroke();

  // TÍTULO — texto branco grande
  ctx.save();
  ctx.shadowColor = 'rgba(200,100,255,1)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 85px Arial';
  ctx.textBaseline = 'top';

  const maxWidth = WIDTH - 120;
  const words = titulo.split(' ');
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
  const totalH = lines.length * lineH;
  let y = HEIGHT - 260 - totalH;

  for (const line of lines) {
    ctx.fillText(line, 60, y);
    y += lineH;
  }
  ctx.restore();

  // Logo
  ctx.save();
  ctx.fillStyle = 'rgba(200,160,255,0.85)';
  ctx.font = '28px Arial';
  ctx.textBaseline = 'top';
  ctx.fillText('@INSTITUTOTERAPIASDELUZ', 60, HEIGHT - 120);
  ctx.restore();

  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer('image/png'));
});

const server = app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
server.timeout = 30000;
