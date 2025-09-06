import { Card, CardContent, Grid, Typography } from '@mui/material';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', sales: 12 },
  { name: 'Tue', sales: 18 },
  { name: 'Wed', sales: 9 },
  { name: 'Thu', sales: 23 },
  { name: 'Fri', sales: 17 },
  { name: 'Sat', sales: 14 },
  { name: 'Sun', sales: 20 }
];

export default function Dashboard() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Card><CardContent><Typography variant="subtitle2">Total Products</Typography><Typography variant="h5">—</Typography></CardContent></Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card><CardContent><Typography variant="subtitle2">Low Stock</Typography><Typography variant="h5">—</Typography></CardContent></Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card><CardContent><Typography variant="subtitle2">Sales (Today)</Typography><Typography variant="h5">—</Typography></CardContent></Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card><CardContent><Typography variant="subtitle2">Purchases (Today)</Typography><Typography variant="h5">—</Typography></CardContent></Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Weekly Sales</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <Line type="monotone" dataKey="sales" stroke="#1976d2" />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
