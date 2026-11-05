const express = require('express');
const { invoices } = require('../data/store');

const router = express.Router();

// Invoice and payment history. Invoices are issued by the platform; there is no online payment in this version.
router.get('/', (req, res) => {
  const mine = invoices.filter((i) => i.ownerId === req.user.id);
  const sum = (status) => mine.filter((i) => i.status === status).reduce((s, i) => s + i.amount, 0);
  res.json({ totalInvoiced: mine.reduce((s, i) => s + i.amount, 0), totalPaid: sum('Paid'), totalPending: sum('Pending'), invoices: mine });
});

module.exports = router;
