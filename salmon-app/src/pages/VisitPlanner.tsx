import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import type { Moment } from 'moment';

import { getEmployeeId, getCustomers, getCustomerAddress, createSalesVisitPlan } from '../api/frappeApi';

// --- Helper Hook for Debouncing ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


interface SalesVisitPlanItem {
  idx: number;
  customer: string;
  address: string;
  visit_time: Moment | null;
  notes: string;
}

const initialVisitItemState = {
  customer: '',
  address: '',
  visit_time: null,
  notes: '',
};

const VisitPlanner = () => {
  const [salesVisitPlan, setSalesVisitPlan] = useState<{
    sales_person: string;
    planned_visit_date: Moment | null;
  }>({
    sales_person: '',
    planned_visit_date: moment().add(1, 'days'),
  });

  const [visitPlanDetails, setVisitPlanDetails] = useState<SalesVisitPlanItem[]>([]);
  const [currentVisitItem, setCurrentVisitItem] = useState<Omit<SalesVisitPlanItem, 'idx'>>(initialVisitItemState);
  
  // --- State for Customer Autocomplete ---
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<readonly string[]>([]);
  const [customerInputValue, setCustomerInputValue] = useState('');
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(customerInputValue, 500);


  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch only the initial employee ID
  const fetchInitialData = useCallback(async () => {
    setPageLoading(true);
    try {
      const loggedInUserId = sessionStorage.getItem('frappe_user_id');
      if (loggedInUserId) {
        const employeeName = await getEmployeeId(loggedInUserId);
        if (employeeName) {
          setSalesVisitPlan((prev) => ({ ...prev, sales_person: employeeName }));
        }
      }
    } catch (error) {
      console.error('Error fetching employee ID:', error);
      setFeedback({ type: 'error', message: 'Failed to load user data. Please refresh.' });
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Customer Autocomplete Logic ---
  useEffect(() => {
    let active = true;

    if (!isCustomerOpen) {
        setCustomerOptions([]);
        return undefined;
    }

    // Fetch customers when dropdown is opened or search term changes
    const fetchCustomers = async () => {
        setIsCustomerLoading(true);
        const newOptions = await getCustomers(debouncedSearchTerm);
        if (active) {
            setCustomerOptions(newOptions);
            setIsCustomerLoading(false);
        }
    };
    fetchCustomers();

    return () => {
        active = false;
    };
  }, [debouncedSearchTerm, isCustomerOpen]);


  const handleCustomerSelect = useCallback(async (event: any, newValue: string | null) => {
    if (!newValue) {
      setCurrentVisitItem(prev => ({ ...prev, customer: '', address: '' }));
      return;
    }
    setCurrentVisitItem(prev => ({ ...prev, customer: newValue, address: 'Loading address...' }));
    try {
      const address = await getCustomerAddress(newValue);
      const cleanedAddress = address ? address.replace(/<br\s*\/?>/gi, ' ') : 'Address not found.';
      setCurrentVisitItem(prev => ({ ...prev, address: cleanedAddress }));
    } catch (error) {
      console.error('Error fetching customer address:', error);
      setCurrentVisitItem(prev => ({ ...prev, address: 'Failed to fetch address.' }));
    }
  }, []);

  const addVisitPlanItem = () => {
    if (!currentVisitItem.customer || !currentVisitItem.visit_time) {
      setFeedback({ type: 'error', message: 'Customer and Visit Time are required to add an item.' });
      return;
    }
    setVisitPlanDetails(prev => [
      ...prev,
      { ...currentVisitItem, idx: prev.length + 1 }
    ]);
    setCurrentVisitItem(initialVisitItemState);
    setFeedback(null);
  };

  const removeVisitPlanItem = (indexToRemove: number) => {
    setVisitPlanDetails(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!salesVisitPlan.sales_person || !salesVisitPlan.planned_visit_date) {
      setFeedback({ type: 'error', message: 'Sales Person and Planned Visit Date are required.' });
      return;
    }
    if (visitPlanDetails.length === 0) {
      setFeedback({ type: 'error', message: 'At least one visit plan detail is required.' });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    const submissionData = {
      ...salesVisitPlan,
      planned_visit_date: salesVisitPlan.planned_visit_date.format('YYYY-MM-DD'),
      visit_plan_details: visitPlanDetails.map(item => ({
        ...item,
        visit_time: item.visit_time ? item.visit_time.format('HH:mm') : '',
      })),
    };
    try {
      const response = await createSalesVisitPlan(submissionData);
      if (response && response.status === 'success') {
        setFeedback({ type: 'success', message: 'Sales Visit Plan created successfully!' });
        setVisitPlanDetails([]);
        setCurrentVisitItem(initialVisitItemState);
        setSalesVisitPlan(prev => ({ ...prev, planned_visit_date: moment().add(1, 'days') }));
        setCustomerInputValue('');
      } else {
        setFeedback({ type: 'error', message: `Failed to create plan: ${response?.message || 'Unknown error'}` });
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: `Submission Error: ${error.message || 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h5" gutterBottom>Input Sales Visit Plan</Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Sales Person" value={salesVisitPlan.sales_person} InputProps={{ readOnly: true }} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="Planned Visit Date"
                value={salesVisitPlan.planned_visit_date}
                onChange={(newValue) => setSalesVisitPlan(prev => ({ ...prev, planned_visit_date: newValue }))}
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting} fullWidth size="large">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Grid>
          </Grid>

          {feedback && (
            <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          )}

          <Box sx={{ border: '1px solid #ddd', p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Add Visit Detail</Typography>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={12} sm={12}>
                <Autocomplete
                  fullWidth
                  open={isCustomerOpen}
                  onOpen={() => setIsCustomerOpen(true)}
                  onClose={() => setIsCustomerOpen(false)}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option}
                  options={customerOptions}
                  loading={isCustomerLoading}
                  onInputChange={(event, newInputValue) => {
                    setCustomerInputValue(newInputValue);
                  }}
                  onChange={handleCustomerSelect}
                  filterOptions={(x) => x}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Customer"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isCustomerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" value={currentVisitItem.address} multiline rows={1} fullWidth InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={2} sm={2}>
                <TimePicker
                  label="Visit Time"
                  value={currentVisitItem.visit_time}
                  onChange={(newValue) => setCurrentVisitItem(prev => ({ ...prev, visit_time: newValue }))}
                  ampm={false}
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={currentVisitItem.notes}
                  onChange={(e) => setCurrentVisitItem(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={1}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={addVisitPlanItem}>
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h5" gutterBottom>Current Visit Plan Items</Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Visit Time</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitPlanDetails.length > 0 ? (
                  visitPlanDetails.map((item, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>{item.idx}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>{item.visit_time ? item.visit_time.format('HH:mm') : ''}</TableCell>
                      <TableCell>{item.notes}</TableCell>
                      <TableCell align="right">
                        <IconButton color="error" onClick={() => removeVisitPlanItem(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No visit items added yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default VisitPlanner;