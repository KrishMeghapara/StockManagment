import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h5">Page not found</Typography>
      <Button component={Link} to="/dashboard" variant="contained">Go to Dashboard</Button>
    </Stack>
  );
}
