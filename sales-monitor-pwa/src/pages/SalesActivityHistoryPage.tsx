import { AppBar, Toolbar, Typography, Container, Box, CircularProgress, Alert, IconButton, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface SalesActivity {
  Date: string;
  Customer: string;
  Checkin: string;
  Checkout: string;
  Duration: number;
  Status: string;
}

const SalesActivityHistoryPage = () => {
  const { employeeId, customer: initialCustomer } = useParams<{ employeeId: string; customer?: string }>();
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
        // const history = await getSalesActivityHistory(employeeId, fromDate, toDate, customerFilter); // Removed call
        // setActivities(history);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sales activity history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [employeeId, fromDate, toDate, customerFilter]);

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

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
    <Box sx={{ flexGrow: 1, width: '100%' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sales Activity History
          </Typography>
        </Toolbar>
      </AppBar>
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
    </Box>
  );
};

export default SalesActivityHistoryPage;
