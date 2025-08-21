import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

import { getEmployeeId, getCustomers, getCustomerAddress, createSalesVisitPlan } from '../api/frappeApi';

interface SalesVisitPlanItem {
  idx: number;
  customer: string;
  address: string;
  visit_time: string;
  notes: string;
}

const InputVisitPage = () => {
  const [salesVisitPlan, setSalesVisitPlan] = useState({
    sales_person: '',
    planned_visit_date: new Date().toISOString().split('T')[0], // Default to today
    visit_plan_details: [] as SalesVisitPlanItem[],
  });

  const [currentVisitItem, setCurrentVisitItem] = useState<SalesVisitPlanItem>({
    idx: 0,
    customer: '',
    address: '',
    visit_time: '07:00', // Default time
    notes: '',
  });

  const [customerOptions, setCustomerOptions] = useState<string[]>([]);

  useEffect(() => {
    // Auto-populate sales_person with logged-in user's employee ID
    const loggedInUserId = sessionStorage.getItem('frappe_user_id'); // Get user ID from session storage
    if (loggedInUserId) {
      getEmployeeId(loggedInUserId)
        .then((employeeName) => {
          if (employeeName) {
            setSalesVisitPlan((prev) => ({ ...prev, sales_person: employeeName }));
          }
        })
        .catch((error) => console.error('Error fetching employee ID:', error));
    }

    // Fetch customer list for autocomplete
    getCustomers()
      .then((customers) => {
        setCustomerOptions(customers);
      })
      .catch((error) => console.error('Error fetching customers:', error));
  }, []);

  const handleSalesVisitPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalesVisitPlan({
      ...salesVisitPlan,
      [e.target.name]: e.target.value,
    });
  };

  const handleCurrentVisitItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentVisitItem({
      ...currentVisitItem,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomerSelect = (event: any, newValue: string | null) => {
    setCurrentVisitItem((prev) => ({ ...prev, customer: newValue || '' }));
    if (newValue) {
      getCustomerAddress(newValue)
        .then((address) => {
          if (address) {
            setCurrentVisitItem((prev) => ({
              ...prev,
              address: address.replace(/<br\s*\/?>/gi, ' '),
            }));
          } else {
            setCurrentVisitItem((prev) => ({ ...prev, address: '' }));
          }
        })
        .catch((error) => console.error('Error fetching customer address:', error));
    }
  };

  const addVisitPlanItem = () => {
    if (!currentVisitItem.customer || !currentVisitItem.address || !currentVisitItem.visit_time) {
      alert('Customer, Address, and Visit Time are required for Visit Item.');
      return;
    }

    setSalesVisitPlan((prev) => ({
      ...prev,
      visit_plan_details: [
        ...prev.visit_plan_details,
        { ...currentVisitItem, idx: prev.visit_plan_details.length + 1 },
      ],
    }));
    setCurrentVisitItem({
      idx: 0,
      customer: '',
      address: '',
      visit_time: '07:00',
      notes: '',
    });
  };

  const removeVisitPlanItem = (index: number) => {
    setSalesVisitPlan((prev) => ({
      ...prev,
      visit_plan_details: prev.visit_plan_details.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!salesVisitPlan.sales_person || !salesVisitPlan.planned_visit_date) {
      alert('Sales Person and Planned Visit Date are required.');
      return;
    }
    if (salesVisitPlan.visit_plan_details.length === 0) {
      alert('At least one Visit Plan Detail is required.');
      return;
    }

    console.log('Submitting Sales Visit Plan:', salesVisitPlan);

    createSalesVisitPlan(salesVisitPlan)
      .then((response) => {
        if (response && response.status === 'success') {
          alert('Sales Visit Plan created successfully!');
          setSalesVisitPlan((prev) => ({
            ...prev,
            planned_visit_date: new Date().toISOString().split('T')[0],
            visit_plan_details: [],
          }));
        } else {
          alert('Failed to create Sales Visit Plan: ' + (response?.message || 'Unknown error'));
        }
      })
      .catch((error) => {
        alert('Error submitting Sales Visit Plan: ' + (error.message || 'Unknown error'));
      });
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mt: 4, mb: 3 }}>
        Input Sales Visit Plan
      </Typography>

      <Box component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '100%' } }}>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} sm={6}>
              <TextField
                label="Sales Person"
                name="sales_person"
                value={salesVisitPlan.sales_person}
                InputProps={{ readOnly: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <DatePicker
                label="Planned Visit Date"
                value={moment(salesVisitPlan.planned_visit_date)}
                onChange={(newValue) => {
                  setSalesVisitPlan((prev) => ({
                    ...prev,
                    planned_visit_date: newValue ? newValue.format('YYYY-MM-DD') : '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid xs={12} sm={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                fullWidth
              >
                Submit
              </Button>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Add Visit Details
          </Typography>

          <Grid container spacing={2} alignItems="flex-start">
            <Grid xs={12} sm={6}>
              <Autocomplete
                options={customerOptions}
                value={currentVisitItem.customer}
                onChange={handleCustomerSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    name="customer"
                    required
                    fullWidth
                  />
                )}
                fullWidth
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                label="Address"
                name="address"
                value={currentVisitItem.address}
                onChange={handleCurrentVisitItemChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TimePicker
                label="Visit Time"
                value={moment(currentVisitItem.visit_time, 'HH:mm')}
                onChange={(newValue) => {
                  setCurrentVisitItem((prev) => ({
                    ...prev,
                    visit_time: newValue ? newValue.format('HH:mm') : '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                label="Notes"
                name="notes"
                value={currentVisitItem.notes}
                onChange={handleCurrentVisitItemChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
            <Grid xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addVisitPlanItem}
                sx={{ mt: 1, mb: 1 }}
              >
                Add Visit Item
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          Current Visit Plan Items
        </Typography>

        {salesVisitPlan.visit_plan_details.length > 0 ? (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
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
                {salesVisitPlan.visit_plan_details.map((item, index) => (
                  <TableRow
                    key={item.idx}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {item.idx}
                    </TableCell>
                    <TableCell>{item.customer}</TableCell>
                    <TableCell>{item.address}</TableCell>
                    <TableCell>{item.visit_time}</TableCell>
                    <TableCell>{item.notes}</TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => removeVisitPlanItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ m: 2 }}>No visit items added yet.</Typography>
        )}
      </Box>
    </Container>
  );
};

export default InputVisitPage;