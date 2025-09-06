import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function ProductsList() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Products</Typography>
        <Button variant="contained" component={Link} to="/products/add">Add Product</Button>
      </Stack>
      <Typography>Search, filter, and manage products.</Typography>
    </Stack>
  );
}
