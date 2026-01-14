import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import {
  getCustomerGroups,
  getTerritories,
  createCustomer,
} from '../api/frappeApi';
import type { NewCustomerData } from '../types/customer';
import { useDebounce } from '../hooks/useDebounce';

interface OutletContext {
  employeeId: string | null;
}

interface MapProps {
  onLocationChange: (address: string, city: string, lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const defaultLocation = { lat: -6.2, lng: 106.8 }; // Default to Jakarta/Indonesia

// Map component - This will be a placeholder for now, actual implementation will be more complex
const MapInput: React.FC<MapProps> = ({ onLocationChange, initialLat, initialLng }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const initialPosition = (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : defaultLocation;

    const mapRef = useRef<google.maps.Map | null>(null); // Use useRef for map instance
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(initialPosition);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(initialPosition);

  useEffect(() => {
    // Update marker and map center if initialLat/Lng props change (e.g., from form reset)
    const newInitialPosition = (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : defaultLocation;
    if (newInitialPosition.lat !== markerPosition.lat || newInitialPosition.lng !== markerPosition.lng) {
      setMarkerPosition(newInitialPosition);
      setMapCenter(newInitialPosition);
    }
  }, [initialLat, initialLng, markerPosition.lat, markerPosition.lng]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance; // Assign map instance to ref
  }, []); // No dependency on setMap needed anymore, as we use ref
  
  const geocodeAndSetLocation = useCallback((lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat: lat, lng: lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        
        const getCity = (addressComponents: google.maps.GeocoderAddressComponent[]): string => {
          for (const component of addressComponents) {
            if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
              return component.long_name;
            }
          }
          return ''; // Fallback
        };
        
        const city = getCity(results[0].address_components);
        onLocationChange(address, city, lat, lng);
      } else {
        onLocationChange('Unknown Address', '', lat, lng);
        console.error('Geocoder failed due to: ' + status);
      }
    });
  }, [onLocationChange]);

  useEffect(() => {
    // Center map on initial load to user's location
    if (!initialLat && !initialLng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerPosition({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
          geocodeAndSetLocation(latitude, longitude);
        },
        (err) => {
          console.error("Error fetching geolocation: ", err.message);
          // Fallback to default location if geolocation fails
          geocodeAndSetLocation(defaultLocation.lat, defaultLocation.lng);
        }
      );
    }
  }, [initialLat, initialLng, geocodeAndSetLocation]); // Run only once on initial component mount


  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const newLat = e.latLng?.lat();
      const newLng = e.latLng?.lng();
      if (newLat && newLng) {
        setMarkerPosition({ lat: newLat, lng: newLng });
        geocodeAndSetLocation(newLat, newLng);
      }
    },
    [geocodeAndSetLocation]
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const newLat = e.latLng?.lat();
      const newLng = e.latLng?.lng();
      if (newLat && newLng) {
        setMarkerPosition({ lat: newLat, lng: newLng });
        setMapCenter({ lat: newLat, lng: newLng }); // Update map center to clicked position
        geocodeAndSetLocation(newLat, newLng);
      }
    },
    [geocodeAndSetLocation]
  );

  useEffect(() => {
    if (initialLat && initialLng && (initialLat !== markerPosition.lat || initialLng !== markerPosition.lng)) {
      setMarkerPosition({ lat: initialLat, lng: initialLng });
      setMapCenter({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng, markerPosition.lat, markerPosition.lng]);


  if (loadError) return <Alert severity="error">Error loading maps</Alert>;
  if (!isLoaded) return <CircularProgress />;

  return (
    <Box sx={{ height: 400, width: '100%', mb: 2 }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter} // Use mapCenter for centering
        zoom={15}
        onLoad={onMapLoad}
        onClick={onMapClick} // Add onClick handler
      >
        <Marker position={markerPosition} draggable={true} onDragEnd={onMarkerDragEnd} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />
      </GoogleMap>
    </Box>
  );
};


const AddCustomerPage: React.FC = () => {
  const { employeeId } = useOutletContext<OutletContext>();
  const [formData, setFormData] = useState<NewCustomerData & {
    owner_name: string;
    whatsapp_no: string;
    address: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  }>({
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
    sales_person: employeeId || '',
  });

  const [customerGroups, setCustomerGroups] = useState<readonly string[]>([]);
  const [territories, setTerritories] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const [groups, terrs] = await Promise.all([
          getCustomerGroups(),
          getTerritories(),
        ]);
        setCustomerGroups(groups);
        setTerritories(terrs);
      } catch (err) {
        setFeedback({ type: 'error', message: 'Failed to load dropdown data. Please try again.' });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, []);

  const handleInputChange = <T extends keyof typeof formData>(field: T, value: typeof formData[T]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = useCallback((address: string, city: string, lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, address, city, latitude: lat, longitude: lng }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_group || !formData.territory || !formData.owner_name || !formData.whatsapp_no || !formData.address || !formData.customer_type) {
      setFeedback({ type: 'error', message: 'All fields are required.' });
      return;
    }
    if (formData.latitude === null || formData.longitude === null) {
      setFeedback({ type: 'error', message: 'Please select an address on the map.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // In a real scenario, you'd send all formData to the backend
      // For now, only sending required fields as per frappeApi.ts's NewCustomerData
      const customerDataToSend: NewCustomerData = {
        customer_name: formData.customer_name,
        customer_group: formData.customer_group,
        territory: formData.territory,
        owner_name: formData.owner_name,
        whatsapp_no: formData.whatsapp_no,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        customer_type: formData.customer_type,
        sales_person: employeeId || '',
      };
      
      const response = await createCustomer(customerDataToSend);

      if (response.status === 'success' && response.data?.name) {
        setFeedback({ type: 'success', message: `Customer "${response.data.name}" created successfully!` });
        setFormData({ // Reset form
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
      } else {
        setFeedback({ type: 'error', message: response.message || 'An unknown error occurred.' });
      }
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : 'A server error occurred.';
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h5" gutterBottom>Add New Customer</Typography>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Customer Name"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              fullWidth
              required
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="customer-type-label">Customer Type</InputLabel>
              <Select
                labelId="customer-type-label"
                value={formData.customer_type}
                label="Customer Type"
                onChange={(e) => handleInputChange('customer_type', e.target.value as 'Company' | 'Individual' | 'Partnership' | '')}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="Company">Company</MenuItem>
                <MenuItem value="Individual">Individual</MenuItem>
                <MenuItem value="Partnership">Partnership</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Owner Name"
              value={formData.owner_name}
              onChange={(e) => handleInputChange('owner_name', e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="WhatsApp No."
              value={formData.whatsapp_no}
              onChange={(e) => handleInputChange('whatsapp_no', e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={customerGroups}
              getOptionLabel={(option) => option}
              value={formData.customer_group}
              onChange={(_event, newValue) => handleInputChange('customer_group', newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Customer Group" required />
              )}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={territories}
              getOptionLabel={(option) => option}
              value={formData.territory}
              onChange={(_event, newValue) => handleInputChange('territory', newValue || '')}
              renderInput={(params) => <TextField {...params} label="Territory" required />} 
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Select Location on Map:
            </Typography>
            <MapInput onLocationChange={handleLocationChange} initialLat={formData.latitude || undefined} initialLng={formData.longitude || undefined} />
            <TextField
              label="Address from Map"
              value={formData.address}
              fullWidth
              multiline
              rows={2}
              InputProps={{ readOnly: true }}
              required
            />
            <TextField
              label="City"
              value={formData.city || ''}
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ mt: 1 }}
              required
            />
            <TextField
              label="Latitude"
              value={formData.latitude || ''}
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ mt: 1 }}
            />
            <TextField
              label="Longitude"
              value={formData.longitude || ''}
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              fullWidth
              startIcon={<AddCircleOutlineIcon />}
            >
              {isSubmitting ? 'Creating Customer...' : 'Create Customer'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};
export default AddCustomerPage;