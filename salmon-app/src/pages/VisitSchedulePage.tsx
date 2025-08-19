import { Typography, Container, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, IconButton, Card, CardHeader, CardContent, CardActions, Chip } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { getVisitPlans, submitVisitUpdate } from '../api/frappeApi';
import { useNavigate, useOutletContext } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import StorefrontIcon from '@mui/icons-material/Storefront';

interface VisitPlan {
  name: string;
  store_name: string;
  address: string;
  status: 'Draft' | 'Planned' | 'Checked In' | 'Completed' | 'Canceled';
  planned_visit_time?: string;
  checkin_time?: string;
  checkout_time?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string | null;
  notes?: string;
}

interface OutletContext {
  employeeId: string | null;
}

const VisitSchedulePage = () => {
  const { employeeId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [visitPlans, setVisitPlans] = useState<VisitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitPlans = async () => {
      if (!employeeId) {
        setError("Employee ID not available.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const plans = await getVisitPlans();
        setVisitPlans(plans);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchVisitPlans();
  }, [employeeId]);

  const getStatusChip = (status: VisitPlan['status']) => {
    let color: 'default' | 'warning' | 'success' | 'error' = 'default';
    let label = status;

    switch (status) {
      case 'Checked In':
        color = 'warning';
        break;
      case 'Completed':
        color = 'success';
        break;
      case 'Canceled':
        color = 'error';
        break;
      case 'Planned':
      case 'Draft':
        color = 'default';
        label = status;
        break;
    }
    return <Chip label={label} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
  };

  const handleCheckIn = async (name: string) => {
  try {
    setLoading(true);
    const success = await submitVisitUpdate(name, 'Checked In');
    console.log("handleCheckIn - success from API:", success); // ADDED LOG
    if (success) {
      console.log("handleCheckIn - entering if block"); // ADDED LOG
      setVisitPlans(prevPlans =>
        prevPlans.map(plan =>
          plan.name === name
            ? { ...plan, status: 'Checked In', checkin_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }
            : plan
        )
      );
    } else {
      console.log("handleCheckIn - entering else block"); // ADDED LOG
      setError('Failed to check-in.');
    }
  } catch (err: any) {
    console.log("handleCheckIn - entering catch block:", err); // ADDED LOG
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

        // Mengonversi canvas ke Blob (multipart/form-data)
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            // Buat objek File dari Blob
            const file = new File([blob], `checkout_photo_${Date.now()}.png`, { type: 'image/png' });
            setPhotoFile(file); // Simpan File di state
            setPhotoDataUrl(URL.createObjectURL(blob)); // Tetap gunakan dataUrl untuk preview
          } else {
            setCheckoutError('Failed to capture photo as Blob.');
          }
        }, 'image/png', 0.8); // Kualitas kompresi 80% untuk PNG
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
      const success = await submitVisitUpdate(currentPlanName, 'Completed', {
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        photo_file: photoFile,
      });

      if (success) {
        setVisitPlans(prevPlans =>
          prevPlans.map(plan =>
            plan.name === currentPlanName
              ? { ...plan, status: 'Completed', checkout_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), latitude: currentLocation?.latitude, longitude: currentLocation?.longitude, photo_url: photoDataUrl }
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

  const handleViewOrderHistory = (storeName: string) => {
    navigate(`/history/${storeName}`);
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
    <>
      <Container sx={{ mt: 4, alignSelf: 'flex-start' }}>
        {visitPlans.length === 0 ? (
          <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 4 }}>
            Tidak ada rencana kunjungan hari ini.
          </Typography>
        ) : (
          <Box sx={{ width: '100%' }}>
            {visitPlans.map((plan) => (
              <Card key={plan.name} sx={{ mb: 3, border: '1px solid #e0e0e0', boxShadow: '4px 4px 8px rgba(0,0,0,0.1)' }}>
                <CardHeader
                  avatar={<StorefrontIcon color="primary" fontSize="large" />}
                  action={getStatusChip(plan.status)}
                  title={plan.store_name}
                  titleTypographyProps={{ fontWeight: 'bold', variant: 'h6' }}
                  sx={{
                    backgroundColor: 'grey.200',
                    '& .MuiCardHeader-action': { alignSelf: 'center' },
                  }}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                  <Typography variant="body2"><strong>Alamat:</strong><br/>{plan.address}</Typography>
                  <Typography variant="body2"><strong>Jadwal:</strong> {plan.planned_visit_time || '-'}</Typography>
                  <Typography variant="body2"><strong>Check In:</strong> {plan.checkin_time || '-'}</Typography>
                  <Typography variant="body2"><strong>Check Out:</strong> {plan.checkout_time || '-'}</Typography>
                  {plan.notes && (
                    <Typography variant="body2"><strong>Catatan:</strong> {plan.notes}</Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5, backgroundColor: 'grey.50' }}>
                  <IconButton aria-label="view order history" onClick={() => handleViewOrderHistory(plan.store_name)}>
                    <HistoryIcon />
                  </IconButton>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(plan.status === 'Draft' || plan.status === 'Planned') && (
                      <Button variant="contained" onClick={() => handleCheckIn(plan.name)}>
                        Check-in
                      </Button>
                    )}
                    {plan.status === 'Checked In' && (
                      <Button variant="contained" color="secondary" onClick={() => handleOpenCheckout(plan.name)}>
                        Checkout
                      </Button>
                    )}
                  </Box>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
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
    </>
  );
};

export default VisitSchedulePage;
