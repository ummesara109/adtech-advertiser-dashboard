const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const supabase = require('../config/supabase');

const router = express.Router();

const MB = 1024 * 1024;

const CREATIVE_BUCKET = 'campaign-creatives';
const KYC_BUCKET = 'kyc-documents';

const FORMATS = {
  jpg: { type: 'image', max: 5 * MB, mime: 'image/jpeg' },
  jpeg: { type: 'image', max: 5 * MB, mime: 'image/jpeg' },
  png: { type: 'image', max: 5 * MB, mime: 'image/png' },
  webp: { type: 'image', max: 5 * MB, mime: 'image/webp' },
  mp4: { type: 'video', max: 50 * MB, mime: 'video/mp4' },
  webm: { type: 'video', max: 50 * MB, mime: 'video/webm' },
  mov: { type: 'video', max: 50 * MB, mime: 'video/quicktime' },
};

// Upload campaign creative to Supabase Storage
router.post(
  '/',
  express.raw({ type: () => true, limit: '50mb' }),
  async (req, res) => {
    try {
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

      if (mime !== format.mime) {
        return res.status(400).json({
          error: "The file type doesn't match its extension."
        });
      }

      const stored = `${randomUUID()}.${ext}`;
      const storagePath = `${req.user.id}/${stored}`;

      const { error } = await supabase.storage
        .from(CREATIVE_BUCKET)
        .upload(storagePath, req.body, {
          contentType: format.mime,
          upsert: false
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(CREATIVE_BUCKET)
        .getPublicUrl(storagePath);

      return res.status(201).json({
        url: data.publicUrl,
        path: storagePath,
        type: format.type,
        name: filename.slice(0, 120),
        size: req.body.length
      });

    } catch (error) {
      console.error('Creative upload error:', error.message);
      return res.status(500).json({
        error: 'Unable to upload campaign creative.'
      });
    }
  }
);

// Upload private KYC document to Supabase Storage
router.post(
  '/kyc',
  express.raw({ type: () => true, limit: '6mb' }),
  async (req, res) => {
    try {
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

      const mimeTypes = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png'
      };

      const mime = String(req.headers['content-type'] || '');

      if (mime !== mimeTypes[ext]) {
        return res.status(400).json({
          error: "The file type doesn't match its extension."
        });
      }

      const stored = `${randomUUID()}.${ext}`;
      const storagePath = `${req.user.id}/${stored}`;

      const { error } = await supabase.storage
        .from(KYC_BUCKET)
        .upload(storagePath, req.body, {
          contentType: mime,
          upsert: false
        });

      if (error) throw error;

      return res.status(201).json({
        id: storagePath,
        name: filename.slice(0, 120),
        size: req.body.length
      });

    } catch (error) {
      console.error('KYC upload error:', error.message);
      return res.status(500).json({
        error: 'Unable to upload KYC document.'
      });
    }
  }
);

// Delete campaign creative
router.delete('/:file', async (req, res) => {
  try {
    const filename = String(req.params.file || '');

    if (!/^[a-f0-9-]{36}\.\w+$/i.test(filename)) {
      return res.status(400).json({ error: 'Invalid file name.' });
    }

    const storagePath = `${req.user.id}/${filename}`;

    const { error } = await supabase.storage
      .from(CREATIVE_BUCKET)
      .remove([storagePath]);

    if (error) throw error;

    return res.json({ ok: true });

  } catch (error) {
    console.error('Creative deletion error:', error.message);
    return res.status(500).json({
      error: 'Unable to delete campaign creative.'
    });
  }
});

module.exports = router;
module.exports.FORMATS = FORMATS;
