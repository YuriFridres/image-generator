const express = require('express');
const { createCanvas } = require('@napi-rs/canvas');

const app = express();
app.use(express.json({ limit: '10mb' }));

function limparTexto(texto) {
  return (texto || '').replace(/[^\w\s\u00C0-\u017F]/g, '').trim().toUpperCase();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
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
  return lines;
}

// Paletas temáticas variadas
const paletas = [
  { bg1: '#0a0018', bg2: '#2d0a5e', bg3: '#0a0018', glow1: 'rgba(140,60,255,0.5)', glow2: 'rgba(80,20,200,0.4)', star: '255,255,255' },
  { bg1: '#001520', bg2: '#004060', bg3: '#001520', glow1: 'rgba(0,150,255,0.4)', glow2: 'rgba(0,80,180,0.35)', star: '200,240,255' },
  { bg1: '#150010', bg2: '#500030', bg3: '#150010', glow1: 'rgba(255,80,150,0.4)', glow2: 'rgba(180,20,80,0.35)', star: '255,220,240' },
  { bg1: '#001510', bg2: '#005030', bg3: '#001510', glow1: 'rgba(0,200,120,0.35)', glow2: 'rgba(0,120,60,0.3)', star: '200,255,220' },
  { bg1: '#100010', bg2: '#400060', bg3: '#0a0020', glow1: 'rgba(180,0,255,0.4)', glow2: 'rgba(100,0,200,0.35)', star: '240,200,255' },
];

app.post('/gerar-imagem', async (req, res) => {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const { titulo } = req.body;
  const tituloLimpo = limparTexto(titulo);

  // Seed baseada no título para consistência mas variação entre posts
  const seed = tituloLimpo.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const paleta = paletas[seed % paletas.length];

  // RNG determinístico
  let s = seed * 1234567;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // === FUNDO ===
  const bg = ctx.createLinearGradient(0, 0, WIDTH * 0.5, HEIGHT);
  bg.addColorStop(0, paleta.bg1);
  bg.addColorStop(0.5, paleta.bg2);
  bg.addColorStop(1, paleta.bg3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // === NEBULOSAS ===
  for (let i = 0; i < 5; i++) {
    const x = rand() * WIDTH;
    const y = rand() * HEIGHT * 0.8;
    const r = 200 + rand() * 400;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const alpha = 0.15 + rand() * 0.3;
    g.addColorStop(0, paleta.glow1.replace('0.5)', `${alpha})`));
    g.addColorStop(0.5, paleta.glow2.replace('0.4)', `${alpha * 0.4})`));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // === ESTRELAS ===
  const numStars = 180 + Math.floor(rand() * 100);
  for (let i = 0; i < numStars; i++) {
    const x = rand() * WIDTH;
    const y = rand() * HEIGHT * 0.9;
    const r = rand() * 2.5 + 0.3;
    const alpha = 0.3 + rand() * 0.7;
    ctx.fillStyle = `rgba(${paleta.star},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // === ESTRELAS GRANDES COM BRILHO ===
  for (let i = 0; i < 20; i++) {
    const x = rand() * WIDTH;
    const y = rand() * HEIGHT * 0.75;
    const r = rand() * 5 + 2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, `rgba(${paleta.star},1)`);
    g.addColorStop(0.3, `rgba(${paleta.star},0.4)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  }

  // === ELEMENTO CENTRAL (sol/lua) ===
  const cx = WIDTH * (0.3 + rand() * 0.4);
  const cy = HEIGHT * (0.12 + rand() * 0.2);
  const cr = 40 + rand() * 30;

  // Halo
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 8);
  halo.addColorStop(0, paleta.glow1.replace('0.5)', '0.5)'));
  halo.addColorStop(0.4, paleta.glow1.replace('0.5)', '0.15)'));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Círculo central
  ctx.fillStyle = `rgba(${paleta.star},0.9)`;
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fill();

  // Raios
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + rand() * 0.3;
    const len = 60 + rand() * 100;
    const ray = ctx.createLinearGradient(
      cx + Math.cos(angle) * cr,
      cy + Math.sin(angle) * cr,
      cx + Math.cos(angle) * (cr + len),
      cy + Math.sin(angle) * (cr + len)
    );
    ray.addColorStop(0, `rgba(${paleta.star},0.5)`);
    ray.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = ray;
    ctx.lineWidth = 1.5 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * cr, cy + Math.sin(angle) * cr);
    ctx.lineTo(cx + Math.cos(angle) * (cr + len), cy + Math.sin(angle) * (cr + len));
    ctx.stroke();
  }

  // === OVERLAY INFERIOR ===
  const ov = ctx.createLinearGradient(0, HEIGHT * 0.35, 0, HEIGHT);
  ov.addColorStop(0, 'rgba(0,0,0,0)');
  ov.addColorStop(0.5, 'rgba(5,0,15,0.8)');
  ov.addColorStop(1, 'rgba(5,0,15,0.98)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // === TÍTULO ===
  ctx.font = 'bold 82px Arial';
  const lines = wrapText(ctx, tituloLimpo, WIDTH - 140);
  const lineH = 100;
  const totalH = lines.length * lineH;
  const startY = HEIGHT - 180 - totalH;

  // Sombra/glow no texto
  ctx.shadowColor = paleta.glow1.replace('0.5)', '1)');
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#FFFFFF';

  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, 70, y);
    y += lineH;
  }

  // === LINHA DECORATIVA ===
  ctx.shadowBlur = 0;
  const lineGrad = ctx.createLinearGradient(60, 0, WIDTH - 60, 0);
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  lineGrad.addColorStop(0.3, paleta.glow1.replace('0.5)', '0.8)'));
  lineGrad.addColorStop(0.7, paleta.glow1.replace('0.5)', '0.8)'));
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, HEIGHT - 140);
  ctx.lineTo(WIDTH - 60, HEIGHT - 140);
  ctx.stroke();

  // === LOGO ===
  ctx.fillStyle = `rgba(${paleta.star},0.75)`;
  ctx.font = '26px Arial';
  ctx.fillText('@INSTITUTOTERAPIASDELUZ', 70, HEIGHT - 85);

  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer('image/png'));
});

const server = app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
server.timeout = 30000;
