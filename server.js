const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/template.pdf', express.static(path.join(__dirname, 'template.pdf')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Helper: decode dataURL to Buffer
function dataURLToBuffer(dataURL) {
  const matches = dataURL.match(/^data:(.+);base64,(.*)$/);
  if (!matches) throw new Error('Invalid data URL');
  const base64 = matches[2];
  return Buffer.from(base64, 'base64');
}

app.post('/sign', async (req, res) => {
  try {
    const {
      pdfPath,
      signatureDataUrl,
      signPage = 0,
      signX = 0,
      signY = 0,
      signWidth = 150,
      signHeight = 50,
      fields = {}
    } = req.body;

    const templatePath = pdfPath
      ? path.isAbsolute(pdfPath)
        ? pdfPath
        : path.join(__dirname, pdfPath.replace(/^\/+/, ''))
      : path.join(__dirname, 'template.pdf');

    if (!fs.existsSync(templatePath)) {
      return res.status(400).json({ ok: false, error: 'Template PDF não encontrado', templatePath });
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    if (signatureDataUrl) {
      const sigImageBytes = dataURLToBuffer(signatureDataUrl);
      let image;
      try {
        image = await pdfDoc.embedPng(sigImageBytes);
      } catch (e) {
        image = await pdfDoc.embedJpg(sigImageBytes);
      }

      const pages = pdfDoc.getPages();
      if (signPage < 0 || signPage >= pages.length) {
        return res.status(400).json({ ok: false, error: 'signPage inválido' });
      }
      const page = pages[signPage];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      const imgWidth = signWidth;
      const imgHeight = signHeight;
      const x = signX;
      const y = pageHeight - signY - imgHeight;

      page.drawImage(image, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
      });
    }

    const pages = pdfDoc.getPages();
    for (const [fieldName, info] of Object.entries(fields || {})) {
      const { value = '', page = 0, x = 0, y = 0, size = 12 } = info;
      if (page < 0 || page >= pages.length) continue;
      const p = pages[page];
      const { height: pageHeight } = p.getSize();
      const yy = pageHeight - y - size;
      p.drawText(String(value), {
        x,
        y: yy,
        size,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const hash = crypto.createHash('sha256').update(pdfBytes).digest('hex').slice(0, 20);
    const filename = `signed-${Date.now()}-${hash}.pdf`;
    const outPath = path.join(uploadsDir, filename);
    fs.writeFileSync(outPath, pdfBytes);

    const downloadUrl = `/uploads/${filename}`;
    return res.json({ ok: true, hash, download: `http://localhost:${PORT}${downloadUrl}`, filename });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/', (req, res) => res.send('Assinatura backend running'));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});