const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/gerar-imagem', async (req, res) => {
  try {
    const { imageUrl, titulo } = req.body;
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 1080px; height: 1350px; overflow: hidden; position: relative; }
        .bg {
          width: 100%; height: 100%;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
          position: absolute;
        }
        .overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(67,38,95,0.92));
          padding: 80px 60px;
        }
        .titulo {
          color: white;
          font-family: 'Arial Black', sans-serif;
          font-size: 72px;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.1;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
        }
        .logo {
          color: rgba(255,255,255,0.8);
          font-family: Arial, sans-serif;
          font-size: 28px;
          margin-top: 20px;
          letter-spacing: 3px;
        }
      </style>
      </head>
      <body>
        <div class="bg"></div>
        <div class="overlay">
          <div class="titulo">${titulo}</div>
          <div class="logo">@INSTITUTOTERAPIASDELUZ</div>
        </div>
      </body>
      </html>
    `);
    await new Promise(r => setTimeout(r, 1500));
    const screenshot = await page.screenshot({ type: 'png' });
    await browser.close();
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Rodando!'));
