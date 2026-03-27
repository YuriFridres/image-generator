app.post('/gerar-imagem', async (req, res) => {
  try {
    const { imageBase64, titulo } = req.body;
    const WIDTH = 1080;
    const HEIGHT = 1350;

    const imgBuffer = Buffer.from(imageBase64, 'base64');
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
