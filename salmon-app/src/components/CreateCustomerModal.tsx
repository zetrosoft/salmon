import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { getCustomerGroups, getTerritories, createCustomer } from '../api/frappeApi';
import type { NewCustomerData } from '../types/customer';

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newCustomerName: string) => void;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<NewCustomerData>({
    customer_name: '',
    customer_group: '',
    territory: '',
    owner_name: '',
    whatsapp_no: '',
    address: '',
    city: '',
    latitude: null,
    longitude: null,
    customer_type: '',
    sales_person: '',
  });

  const [customerGroups, setCustomerGroups] = useState<readonly string[]>([]);
  const [territories, setTerritories] = useState<readonly string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchDropdownData = async () => {
        setLoading(true);
        setError(null);
        try {
          const [groups, terrs] = await Promise.all([
            getCustomerGroups(),
            getTerritories(),
          ]);
          setCustomerGroups(groups);
          setTerritories(terrs);
        } catch (err) {
          setError('Failed to load required data (Customer Groups, Territories). Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchDropdownData();
    }
  }, [open]);

  const handleInputChange = (field: keyof NewCustomerData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }));
  };

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_group || !formData.territory) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createCustomer(formData);
      if (response.status === 'success' && response.data?.name) {
        onSuccess(response.data.name);
        handleClose();
      } else {
        setError(response.message || 'An unknown error occurred.');
      }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'A server error occurred.';
        setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customer_name: '',
      customer_group: '',
      territory: '',
      owner_name: '',
      whatsapp_no: '',
      address: '',
      city: '',
      latitude: null,
      longitude: null,
      customer_type: '',
      sales_person: '',
    });
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Customer</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          {loading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <TextField
                  label="Customer Name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  fullWidth
                  required
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={customerGroups}
                  getOptionLabel={(option) => option}
                  value={formData.customer_group}
                  onChange={(_event, newValue) => handleInputChange('customer_group', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Customer Group" required />
                  )}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={territories}
                  getOptionLabel={(option) => option}
                  value={formData.territory}
                  onChange={(_event, newValue) => handleInputChange('territory', newValue)}
                  renderInput={(params) => <TextField {...params} label="Territory" required />}
                  fullWidth
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="secondary" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : 'Save Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCustomerModal;
