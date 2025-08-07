import { AppBar, Toolbar, Typography, Container, List, ListItem, ListItemText, Paper, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, IconButton } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { getVisitPlans, updateVisitPlanStatus, getOrderHistory, getEmployeeId } from '../api/frappeApi'; // Changed from mockApi
import HistoryIcon from '@mui/icons-material/History';
import ScheduleIcon from '@mui/icons-material/Schedule'; // For Terjadwal
import LocationOnIcon from '@mui/icons-material/LocationOn'; // For Check-in
import TaskAltIcon from '@mui/icons-material/TaskAlt'; // For Selesai
import LogoutIcon from '@mui/icons-material/Logout'; // For Logout button
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // For Back button

interface VisitPlan {
  name: string; // Frappe DocType name (e.g., 'SVP0001')
  store_name: string; // Changed from storeName
  address: string;
  status: 'Terjadwal' | 'Check-in' | 'Selesai';
  checkin_time?: string; // Changed from checkinTime
  checkout_time?: string; // Changed from checkoutTime
  latitude?: number; // Changed from lat
  longitude?: number; // Changed from lng
  photo_url?: string | null; // Changed from photoUrl
}

interface VisitListPageProps {
  onLogout: () => void;
  userId: string | null;
}

const VisitListPage = ({ onLogout, userId }: VisitListPageProps) => {
  const [visitPlans, setVisitPlans] = useState<VisitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeAndPlans = async () => {
      if (!userId) {
        setError("User ID not available.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const empId = await getEmployeeId(userId);
        console.log(empId);
        if (empId) {
          setEmployeeId(empId);
          const plans = await getVisitPlans(empId);
          setVisitPlans(plans);
        } else {
          setError("Employee ID not found for this user.");
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeAndPlans();
  }, [userId]);

  const handleCheckIn = async (name: string) => {
    try {
      setLoading(true);
      const success = await updateVisitPlanStatus(name, 'Check-in');
      if (success) {
        setVisitPlans(prevPlans =>
          prevPlans.map(plan =>
            plan.name === name
              ? { ...plan, status: 'Check-in', checkin_time: new Date().toLocaleTimeString() }
              : plan
          )
        );
      } else {
        setError('Failed to check-in.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (name: string) => {
    setCurrentPlanName(name);
    setOpenCheckoutDialog(true);
    setPhotoDataUrl(null);
    setCurrentLocation(null);
    setCheckoutError(null);
    startCamera();
    getGeolocation();
  };

  const handleCloseCheckout = () => {
    setOpenCheckoutDialog(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setCheckoutError('Failed to access camera. Please grant permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setPhotoDataUrl(dataUrl);
      }
    }
  };

  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          console.error("Error getting geolocation: ", geoError);
          setCheckoutError('Failed to get location. Please grant permissions.');
        }
      );
    } else {
      setCheckoutError('Geolocation is not supported by your browser.');
    }
  };

  const handleConfirmCheckout = async () => {
    if (!currentPlanName) return;
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const success = await updateVisitPlanStatus(currentPlanName, 'Selesai', {
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        photo_url: photoDataUrl || undefined,
      });

      if (success) {
        setVisitPlans(prevPlans =>
          prevPlans.map(plan =>
            plan.name === currentPlanName
              ? { ...plan, status: 'Selesai', checkout_time: new Date().toLocaleTimeString(), latitude: currentLocation?.latitude, longitude: currentLocation?.longitude, photo_url: photoDataUrl }
              : plan
          )
        );
        handleCloseCheckout();
      } else {
        setCheckoutError('Failed to complete checkout.');
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleViewOrderHistory = async (storeName: string) => {
    try {
      const history = await getOrderHistory(storeName);
      alert(`Order history for ${storeName}:\n${JSON.stringify(history, null, 2)}`);
      // In a real application, this would navigate to a new page or open a dialog
      // to display the order history data fetched from the backend.
    } catch (err: any) {
      alert(`Failed to fetch order history for ${storeName}: ${err.message}`);
    }
  };

  const getStatusIcon = (status: VisitPlan['status']) => {
    switch (status) {
      case 'Terjadwal':
        return <ScheduleIcon color="info" sx={{ verticalAlign: 'middle', mr: 0.5 }} />;
      case 'Check-in':
        return <LocationOnIcon color="warning" sx={{ verticalAlign: 'middle', mr: 0.5 }} />;
      case 'Selesai':
        return <TaskAltIcon color="success" sx={{ verticalAlign: 'middle', mr: 0.5 }} />;
      default:
        return null;
    }
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={onLogout} // Back button also logs out for now
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rencana Kunjungan Hari Ini
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="logout"
            onClick={onLogout}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <List>
          {visitPlans.length === 0 ? (
            <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 4 }}>
              Tidak ada rencana kunjungan hari ini.
            </Typography>
          ) : (
            visitPlans.map((plan) => (
              <Paper key={plan.name} elevation={2} sx={{ mb: 2, p: 2 }}>
                <ListItem disableGutters>
                  <ListItemText
                    primary={plan.store_name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {plan.address}
                        </Typography>
                        <br />
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                          {getStatusIcon(plan.status)}
                          Status: {plan.status}
                        </Box>
                        {plan.checkin_time && <>, Check-in: {plan.checkin_time}</>}
                        {plan.checkout_time && <>, Check-out: {plan.checkout_time}</>}
                      </>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <IconButton aria-label="view order history" onClick={() => handleViewOrderHistory(plan.store_name)} sx={{ mb: 1 }}>
                      <HistoryIcon />
                    </IconButton>
                    {plan.status === 'Terjadwal' && (
                      <Button variant="contained" onClick={() => handleCheckIn(plan.name)}>
                        Check-in
                      </Button>
                    )}
                    {plan.status === 'Check-in' && (
                      <Button variant="contained" color="secondary" onClick={() => handleOpenCheckout(plan.name)}>
                        Checkout
                      </Button>
                    )}
                  </Box>
                </ListItem>
              </Paper>
            ))
          )}
        </List>
      </Container>

      <Dialog open={openCheckoutDialog} onClose={handleCloseCheckout}>
        <DialogTitle>Complete Checkout for {visitPlans.find(p => p.name === currentPlanName)?.store_name}</DialogTitle>
        <DialogContent>
          {checkoutError && <Alert severity="error" sx={{ mb: 2 }}>{checkoutError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1">Take Photo:</Typography>
            <video ref={videoRef} style={{ width: '100%', maxWidth: '320px', border: '1px solid #ccc' }} autoPlay playsInline></video>
            <Button variant="outlined" onClick={takePhoto} disabled={!videoRef.current?.srcObject}>
              Capture Photo
            </Button>
            {photoDataUrl && (
              <Box>
                <Typography variant="subtitle2">Preview:</Typography>
                <img src={photoDataUrl} alt="Captured" style={{ width: '100%', maxWidth: '320px', border: '1px solid #ccc' }} />
              </Box>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <Typography variant="subtitle1">Current Location:</Typography>
            {currentLocation ? (
              <Typography>Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}</Typography>
            ) : (
              <CircularProgress size={20} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCheckout} disabled={checkoutLoading}>Cancel</Button>
          <Button onClick={handleConfirmCheckout} disabled={checkoutLoading || !photoDataUrl || !currentLocation} variant="contained">
            {checkoutLoading ? <CircularProgress size={24} color="inherit" /> : 'Complete Checkout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitListPage;