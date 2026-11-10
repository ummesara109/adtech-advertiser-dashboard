const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const router = express.Router();

// Vercel writable temporary storage
const UPLOAD_DIR = path.join('/tmp', 'uploads');
const KYC_DIR = path.join('/tmp', 'private-kyc');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(KYC_DIR, { recursive: true });

const MB = 1024 * 1024;

const FORMATS = {
  jpg: { type: 'image', max: 5 * MB },
  jpeg: { type: 'image', max: 5 * MB },
  png: { type: 'image', max: 5 * MB },
  webp: { type: 'image', max: 5 * MB },
  mp4: { type: 'video', max: 50 * MB },
  webm: { type: 'video', max: 50 * MB },
  mov: { type: 'video', max: 50 * MB },
};

// Creative upload
router.post(
  '/',
  express.raw({ type: () => true, limit: '50mb' }),
  (req, res) => {
    const filename = String(req.query.filename || '');
    const ext = path.extname(filename).slice(1).toLowerCase();
    const format = FORMATS[ext];

    if (!format) {
      return res.status(400).json({
        error: 'Unsupported file type. Upload JPG, PNG, WEBP, MP4, WEBM or MOV.'
      });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'The file is empty.' });
    }

    if (req.body.length > format.max) {
      return res.status(413).json({
        error: `${format.type === 'image' ? 'Images' : 'Videos'} must be ${format.max / MB} MB or smaller.`
      });
    }

    const mime = String(req.headers['content-type'] || '');

    if (
      (mime.startsWith('image/') && format.type !== 'image') ||
      (mime.startsWith('video/') && format.type !== 'video')
    ) {
      return res.status(400).json({
        error: "The file type doesn't match its extension."
      });
    }

    const stored = `${randomUUID()}.${ext}`;

    fs.writeFileSync(path.join(UPLOAD_DIR, stored), req.body);

    res.status(201).json({
      url: `/uploads/${stored}`,
      type: format.type,
      name: filename.slice(0, 120),
      size: req.body.length
    });
  }
);

// Private KYC document upload
router.post(
  '/kyc',
  express.raw({ type: () => true, limit: '6mb' }),
  (req, res) => {
    const filename = String(req.query.filename || '');
    const ext = path.extname(filename).slice(1).toLowerCase();

    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      return res.status(400).json({
        error: 'Upload a PDF, JPG or PNG document.'
      });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'The file is empty.' });
    }

    if (req.body.length > 5 * MB) {
      return res.status(413).json({
        error: 'The document must be 5 MB or smaller.'
      });
    }

    const stored = `${randomUUID()}.${ext}`;

    fs.writeFileSync(path.join(KYC_DIR, stored), req.body);

    res.status(201).json({
      id: stored,
      name: filename.slice(0, 120),
      size: req.body.length
    });
  }
);

// Remove uploaded creative
router.delete('/:file', (req, res) => {
  if (!/^[a-f0-9-]{36}\.\w+$/.test(req.params.file)) {
    return res.status(400).json({ error: 'Invalid file name.' });
  }

  fs.rm(
    path.join(UPLOAD_DIR, req.params.file),
    { force: true },
    () => res.json({ ok: true })
  );
});

module.exports = router;
module.exports.UPLOAD_DIR = UPLOAD_DIR;
module.exports.FORMATS = FORMATS;
module.exports.KYC_DIR = KYC_DIR;
