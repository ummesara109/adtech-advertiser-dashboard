const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('issued_at', { ascending: false });

    if (error) throw error;

    const mine = (invoices || []).map(invoice => ({
      id: invoice.id,
      ownerId: invoice.owner_id,
      number: invoice.number,
      issuedAt: invoice.issued_at,
      campaignId: invoice.campaign_id,
      description: invoice.description,
      amount: Number(invoice.amount),
      status: invoice.status,
      paidAt: invoice.paid_at,
      reference: invoice.reference
    }));

    const sum = status =>
      mine
        .filter(invoice => invoice.status === status)
        .reduce((total, invoice) => total + invoice.amount, 0);

    res.json({
      totalInvoiced: mine.reduce(
        (total, invoice) => total + invoice.amount,
        0
      ),
      totalPaid: sum('Paid'),
      totalPending: sum('Pending'),
      invoices: mine
    });

  } catch (error) {
    console.error('Invoices error:', error.message);
    res.status(500).json({
      error: 'Unable to load invoices.'
    });
  }
});

module.exports = router;
