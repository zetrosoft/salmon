import { AppBar, Toolbar, Typography, Container, Box, CircularProgress, Alert, IconButton, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, useMediaQuery, Card, CardContent, CardHeader, Chip, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { getSalesActivityHistory, get_sales_person_customers } from '../api/frappeApi'; // Import API baru
import { useOutletContext } from 'react-router-dom';
import type { SalesActivity } from '../types';

interface OutletContext {
  employeeId: string | null;
}

const ActivityCard = ({ activity }: { activity: SalesActivity }) => (
  <Card sx={{ mb: 2 }}>
    <CardHeader
      title={activity.Customer}
      subheader={activity.Date}
      titleTypographyProps={{ variant: 'h6' }}
    />
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Check-in:</Typography>
        <Typography variant="body2">{activity.Checkin}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Check-out:</Typography>
        <Typography variant="body2">{activity.Checkout}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Duration (min):</Typography>
        <Typography variant="body2">{activity.Duration}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">Status:</Typography>
        <Chip label={activity.Status} color={activity.Status === 'Completed' ? 'success' : 'default'} size="small" />
      </Box>
    </CardContent>
  </Card>
);

const ActivityReportPage = () => {
  const { employeeId } = useOutletContext<OutletContext>();
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [customerOptions, setCustomerOptions] = useState<string[]>([]); // New state for customer options

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setFromDate(lastMonth.toISOString().split('T')[0]);
    setToDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchCustomerOptions = async () => {
      try {
        const response = await get_sales_person_customers();
        if (response.status === "success" && response.data) {
          setCustomerOptions(response.data);
        } else {
          setError(response.message || "Failed to fetch customer options.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred while fetching customer options.");
      }
    };
    fetchCustomerOptions();
  }, []); // Run once on component mount

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        Activity Report
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
        <Autocomplete
          options={customerOptions}
          value={customerFilter}
          onChange={(event, newValue) => {
            setCustomerFilter(newValue || '');
          }}
          renderInput={(params) => <TextField {...params} label="Customer" />}
          sx={{ flexGrow: 1 }}
        />
      </Box>

      {activities.length === 0 ? (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 4 }}>
          No activities found for the selected criteria.
        </Typography>
      ) : isMobile ? (
        <Box>
          {activities.map((activity) => (
            <ActivityCard key={`${activity.Date}-${activity.Checkin}`} activity={activity} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
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

export default ActivityReportPage;