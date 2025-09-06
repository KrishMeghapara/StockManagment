import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function SalesList() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Sales</Typography>
        <Button variant="contained" component={Link} to="/sales/new">New Sale</Button>
      </Stack>
      <Typography>Sales history.</Typography>
    </Stack>
  );
}
