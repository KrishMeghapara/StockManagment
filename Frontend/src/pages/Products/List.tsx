import React, { useMemo, useState } from 'react';
import { Button, Stack, Typography, TextField, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, IconButton, InputAdornment, MenuItem, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link } from 'react-router-dom';
import { useProducts } from '../../../hooks/useProducts';
import { formatCurrency } from '../../../utils/format';

export default function ProductsList() {
  const { data: products = [], isLoading, refetch } = useProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.category && s.add(p.category));
    return Array.from(s);
  }, [products]);

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p._id || '').toLowerCase().includes(q);
  });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Products</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" component={Link} to="/products/add">Add Product</Button>
          <IconButton aria-label="refresh products" onClick={() => refetch()}><RefreshIcon /></IconButton>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          placeholder="Search by name, SKU or ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          aria-label="Search products"
          sx={{ flex: 1 }}
        />

        <TextField select value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 200 }} aria-label="Filter by category">
          <MenuItem value="all">All categories</MenuItem>
          {categories.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
        </TextField>
      </Stack>

      <TableContainer component={Paper} aria-live="polite">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading products...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No products found.</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p._id} hover component={Link} to={`/products/${p._id}`} style={{ textDecoration: 'none' }}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell align="right">{formatCurrency(p.price ?? 0)}</TableCell>
                  <TableCell align="right">{p.stock ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="flex-end">
        <Typography variant="caption" color="text.secondary">Auto-refresh every 5s</Typography>
      </Box>
    </Stack>
  );
}
