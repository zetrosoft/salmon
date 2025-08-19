import { AppBar, Toolbar, Typography, Container, Box, CircularProgress, Alert, IconButton, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSalesActivityHistory } from '../api/frappeApi';

interface SalesActivity {
  Date: string;
  Customer: string;
  Checkin: string;
  Checkout: string;
  Duration: number;
  Status: string;
}

interface OutletContext {
  employeeId: string | null;
}

const SalesActivityHistoryPage = () => {
  const { employeeId } = useOutletContext<OutletContext>();
  const { customer: initialCustomer } = useParams<{ customer?: string }>();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>(initialCustomer || '');

  useEffect(() => {
    if (employeeId) {
      const today = new Date();
      const lastWeek = new Date(today.setDate(today.getDate() - 7));
      setFromDate(lastWeek.toISOString().split('T')[0]);
      setToDate(new Date().toISOString().split('T')[0]);
    }
  }, [employeeId]);

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
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sales activity history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [employeeId, fromDate, toDate, customerFilter]);

  

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                {activities.map((activity, index) => (
                  <TableRow
                    key={index}
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
