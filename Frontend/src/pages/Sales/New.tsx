import React, { useMemo, useState } from 'react';
import { Box, Button, Grid, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import api from '../../../services/api';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../../utils/format';

type Line = { productId: string; name: string; price: number; qty: number };

export default function SaleNew() {
  const { data: products = [] } = useQuery(['products'], async () => {
    const res = await api.get('/products');
    return res.data;
  }, { retry: 1 });

  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState('Walk-in');

  const addLine = () => setLines((s) => [...s, { productId: '', name: '', price: 0, qty: 1 }]);
  const updateLine = (idx: number, patch: Partial<Line>) => setLines((s) => s.map((l, i) => i === idx ? { ...l, ...patch } : l));
  const removeLine = (idx: number) => setLines((s) => s.filter((_, i) => i !== idx));

  const subtotal = useMemo(() => lines.reduce((acc, l) => acc + l.price * l.qty, 0), [lines]);
  const tax = +(subtotal * 0.1).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const printInvoice = () => {
    const win = window.open('', '_blank', 'noopener');
    if (!win) return;
    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice</title>
          <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd;text-align:left}h2{margin-top:0}</style>
        </head>
        <body>
          <h2>Invoice</h2>
          <div>Customer: ${customer}</div>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Line</th></tr></thead>
            <tbody>
              ${lines.map(l => `<tr><td>${l.name}</td><td>${l.qty}</td><td>${formatCurrency(l.price)}</td><td>${formatCurrency(l.price * l.qty)}</td></tr>`).join('')}
            </tbody>
            <tfoot>
              <tr><td colspan="3">Subtotal</td><td>${formatCurrency(subtotal)}</td></tr>
              <tr><td colspan="3">Tax (10%)</td><td>${formatCurrency(tax)}</td></tr>
              <tr><td colspan="3"><strong>Total</strong></td><td><strong>${formatCurrency(total)}</strong></td></tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    win.document.write(invoiceHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Create New Sale / Invoice</Typography>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField label="Customer" value={customer} onChange={(e) => setCustomer(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" onClick={addLine}>Add item</Button>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1}>
              {lines.map((l, idx) => (
                <Grid container spacing={1} key={idx} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Select
                      value={l.productId}
                      onChange={(e) => {
                        const pid = e.target.value as string;
                        const p: any = products.find((x: any) => x._id === pid) || { name: '', price: 0 };
                        updateLine(idx, { productId: pid, name: p.name, price: p.price ?? 0 });
                      }}
                      displayEmpty
                      fullWidth
                      aria-label={`Select product ${idx + 1}`}>
                      <MenuItem value="">Select product</MenuItem>
                      {products.map((p: any) => (<MenuItem key={p._id} value={p._id}>{p.name} — {p.sku}</MenuItem>))}
                    </Select>
                  </Grid>
                  <Grid item xs={4} sm={2}>
                    <TextField type="number" inputProps={{ min: 1 }} label="Qty" value={l.qty} onChange={(e) => updateLine(idx, { qty: Math.max(1, Number(e.target.value || 1)) })} />
                  </Grid>
                  <Grid item xs={4} sm={2}>
                    <TextField label="Price" type="number" value={l.price} onChange={(e) => updateLine(idx, { price: Number(e.target.value || 0) })} />
                  </Grid>
                  <Grid item xs={4} sm={2}>
                    <Button color="error" onClick={() => removeLine(idx)}>Remove</Button>
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <div style={{ textAlign: 'right' }}>
                <div>Subtotal: {formatCurrency(subtotal)}</div>
                <div>Tax: {formatCurrency(tax)}</div>
                <div style={{ fontWeight: 700 }}>Total: {formatCurrency(total)}</div>
              </div>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => { setLines([]); }}>Reset</Button>
              <Button variant="contained" onClick={printInvoice} disabled={lines.length === 0}>Print Invoice</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
}
