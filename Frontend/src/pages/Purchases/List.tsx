import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function PurchasesList() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Purchases</Typography>
        <Button variant="contained" component={Link} to="/purchases/new">Record Purchase</Button>
      </Stack>
      <Typography>Purchase history.</Typography>
    </Stack>
  );
}
