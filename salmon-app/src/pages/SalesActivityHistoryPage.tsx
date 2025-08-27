import { AppBar, Toolbar, Typography, Container, Box, CircularProgress, Alert, IconButton, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import { getSalesActivityHistory } from '../api/frappeApi';
import { useOutletContext } from 'react-router-dom';
import type { SalesActivity } from '../types';

interface OutletContext {
  employeeId: string | null;
}

const SalesActivityHistoryPage = () => {
  const { employeeId } = useOutletContext<OutletContext>();
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setFromDate(lastMonth.toISOString().split('T')[0]);
    setToDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!employeeId) {
        setError("Employee ID not available.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const history = await getSalesActivityHistory(fromDate, toDate, customerFilter);
        setActivities(history);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Failed to fetch sales activity history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [employeeId, fromDate, toDate, customerFilter]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Activity History
      </Typography>
      <Box sx={{ mb: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="From Date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="To Date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Customer"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
      </Box>

      {activities.length === 0 ? (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 4 }}>
          No activities found for the selected criteria.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="sales activity table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <TableRow
                  key={`${activity.Date}-${activity.Checkin}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {activity.Date}
                  </TableCell>
                  <TableCell>{activity.Customer}</TableCell>
                  <TableCell>{activity.Checkin}</TableCell>
                  <TableCell>{activity.Checkout}</TableCell>
                  <TableCell>{activity.Duration}</TableCell>
                  <TableCell>{activity.Status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default SalesActivityHistoryPage;