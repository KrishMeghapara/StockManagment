import { Stack, TextField, Button, Typography } from '@mui/material';

export default function ProductAdd() {
  return (
    <Stack spacing={2} maxWidth={600}>
      <Typography variant="h5">Add Product</Typography>
      <TextField label="Name" />
      <TextField label="SKU" />
      <TextField label="Category" />
      <TextField label="Supplier" />
      <TextField label="Price" type="number" />
      <TextField label="Stock" type="number" />
      <Button variant="contained">Save</Button>
    </Stack>
  );
}
