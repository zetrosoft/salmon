import { Typography, Container, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, IconButton, Card, CardHeader, CardContent, CardActions, Chip, Skeleton, Tooltip } from '@mui/material';
import { keyframes } from '@mui/system';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getVisitPlans, submitVisitUpdate, PAGE_LENGTH } from '../api/frappeApi';
import { useNavigate, useOutletContext } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import moment from 'moment';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

interface VisitPlan {
  name: string;
  parent: string;
  store_name: string;
  address: string;
  status: 'Draft' | 'Planned' | 'Checked In' | 'Completed' | 'Canceled';
  parent_docstatus: number;
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

const ScheduleCardSkeleton = () => (
  <Card sx={{ mb: 3, border: '1px solid #e0e0e0', boxShadow: '4px 4px 8px rgba(0,0,0,0.1)' }}>
    <CardHeader
      avatar={<Skeleton animation="wave" variant="circular" width={40} height={40} />}
      title={<Skeleton animation="wave" height={20} width="80%" />}
      sx={{ backgroundColor: 'grey.200' }}
    />
    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
      <Skeleton animation="wave" height={15} width="90%" />
      <Skeleton animation="wave" height={15} width="60%" />
      <Skeleton animation="wave" height={15} width="60%" />
      <Skeleton animation="wave" height={15} width="60%" />
    </CardContent>
    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5, backgroundColor: 'grey.50' }}>
      <Skeleton animation="wave" variant="circular" width={32} height={32} />
      <Skeleton animation="wave" variant="rectangular" width={100} height={36} />
    </CardActions>
  </Card>
);

const VisitSchedulePage = () => {
  const STATUS_ORDER = useMemo(() => ({
    "Checked In": 0,
    "Planned": 1,
    "Completed": 2,
    "Canceled": 3,
    "Draft": 4,
  }), []);
  const { employeeId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [visitPlans, setVisitPlans] = useState<VisitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const observer = useRef<IntersectionObserver>(null);
  const lastPlanElementRef = useCallback((node: HTMLElement | null) => {
    if (isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isFetchingMore, hasMore]);

  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  const sortPlans = useCallback((plans: VisitPlan[]) => {
    return plans.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
  }, [STATUS_ORDER]);

  const fetchVisitPlans = useCallback(async (currentPage: number) => {
    if (!employeeId) {
      setError("Employee ID not available.");
      setLoading(false);
      return;
    }
    if (currentPage === 0 && !isFetchingMore) {
        setLoading(true);
    } else {
        setIsFetchingMore(true);
    }
    try {
        const newPlans = await getVisitPlans(currentPage);
        if (newPlans.length < PAGE_LENGTH) {
            setHasMore(false);
        }
        if (newPlans.length > 0) {
            setVisitPlans(prevPlans => {
                const allPlans = [...prevPlans, ...newPlans];
                const uniquePlans = Array.from(new Map(allPlans.map(p => [p.name, p])).values());
                return sortPlans(uniquePlans);
            });
        }
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data.');
    } finally {
        if (currentPage === 0) {
            setLoading(false);
        }
        setIsFetchingMore(false);
    }
  }, [employeeId, isFetchingMore, sortPlans]);

  useEffect(() => {
    if (employeeId) {
      fetchVisitPlans(page);
    }
  }, [employeeId, page, fetchVisitPlans]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountdownActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountdownActive]);

  // DEBUGGING useEffect: Log visitPlans whenever it changes
  useEffect(() => {
    console.log("DEBUG: visitPlans state updated:", visitPlans);
    visitPlans.forEach(plan => {
      if (plan.checkout_time) {
        console.log(`DEBUG: Plan ${plan.name} Checkout Time: ${moment(plan.checkout_time, 'DD/MM/YY HH:mm:ss').isValid()}`);
      }
    });
  }, [visitPlans]);

  const getStatusChip = (plan: VisitPlan) => {
    if (plan.parent_docstatus === 0) {
        return (
            <Tooltip title={plan.parent} arrow>
                <Chip label="Draft" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
            </Tooltip>
        );
    }
    let color: 'primary' | 'secondary' | 'success' | 'error' | 'default' = 'default';
    let label = plan.status;
    switch (plan.status) {
      case 'Planned': color = 'primary'; break;
      case 'Checked In': color = 'secondary'; break;
      case 'Completed': color = 'success'; break;
      case 'Canceled': color = 'error'; break;
      default: label = 'Draft'; color = 'error'; break;
    }
    return (
        <Tooltip title={plan.parent} arrow>
            <Chip label={label} color={color} size="small" sx={{ fontWeight: 'bold' }} />
        </Tooltip>
    );
  };

  const handleCheckIn = async (name: string) => {
    try {
      const success = await submitVisitUpdate(name, 'Checked In');
      if (success) {
        setVisitPlans(prevPlans => sortPlans(prevPlans.map(plan => plan.name === name ? { ...plan, status: 'Checked In', checkin_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) } : plan )) );
      } else {
        setError('Failed to check-in.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during check-in.');
    }
  };

  const handleOpenCheckout = (name: string) => {
    const plan = visitPlans.find(p => p.name === name);
    if (plan && plan.checkin_time) {
      const checkinTime = moment(plan.checkin_time, 'DD/MM/YY HH:mm:ss').toDate().getTime();
      const now = new Date().getTime();
      const diffSeconds = (now - checkinTime) / 1000;
      if (diffSeconds < 180) {
        setCountdown(180 - Math.floor(diffSeconds));
        setIsCountdownActive(true);
      }
    }
    setCurrentPlanName(name);
    setOpenCheckoutDialog(true);
    setPhotoDataUrl(null);
    setPhotoFile(null);
    setCheckoutError(null);
    
    // Start camera and get location
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err: unknown) => {
          console.error("Camera access denied:", err);
          setCheckoutError("Camera access is required. Please enable it in your browser settings.");
        });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: unknown) => {
          console.error("Location access denied:", error);
          let errorMessage = "Location access is required.";
          if (error instanceof GeolocationPositionError) {
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage += " Please enable it in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage += " Location information is unavailable.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage += " The request to get user location timed out.";
            }
          } else {
            errorMessage += " An unknown error occurred.";
          }
          setCheckoutError(errorMessage);
        }
      );
    } else {
      setCheckoutError("Geolocation is not supported by your browser.");
    }
  };

  const handleCloseCheckout = () => {
    setOpenCheckoutDialog(false);
    setCurrentPlanName(null);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], "checkout_photo.png", { type: "image/png" });
            setPhotoFile(file);
          }
        }, 'image/png');
        setPhotoDataUrl(canvas.toDataURL('image/png'));
      }
    }
  };
  
  const handleConfirmCheckout = async () => {
    if (!currentPlanName || !photoFile || !currentLocation) {
      setCheckoutError('Photo and location are required.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const payload = {
        status: 'Completed',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        photo: photoFile,
        checkout_time: moment().format('DD/MM/YY HH:mm:ss'),
      };
      
      const success = await submitVisitUpdate(currentPlanName, 'Completed', payload);

      if (success) {
        setCheckoutLoading(false);
        handleCloseCheckout();
        // Update the plan status in the state
        setVisitPlans(prevPlans => sortPlans(prevPlans.map(plan => plan.name === currentPlanName ? { ...plan, status: 'Completed', checkout_time: payload.checkout_time } : plan)));
      } else {
        setCheckoutLoading(false);
        setCheckoutError('Failed to complete checkout.');
      }
    } catch (err: unknown) {
      setCheckoutLoading(false);
      setCheckoutError(err instanceof Error ? err.message : 'An unexpected error occurred during checkout.');
    }
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          My Visit Schedule
        </Typography>

        <Box sx={{ mb: 2, textAlign: 'right' }}>
          <Button 
            variant="contained" 
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/history')}
          >
            History
          </Button>
        </Box>

        {loading && page === 0 ? (
          <Box>
            <ScheduleCardSkeleton />
            <ScheduleCardSkeleton />
            <ScheduleCardSkeleton />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : visitPlans.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>No visit plans found.</Alert>
        ) : (
          <Box>
            {visitPlans.map((plan, index) => (
              <Card 
                key={plan.name}
                sx={{ mb: 3, border: '1px solid #e0e0e0', boxShadow: '4px 4px 8px rgba(0,0,0,0.1)' }}
                ref={visitPlans.length === index + 1 ? lastPlanElementRef : null}
              >
                <CardHeader
                  avatar={<StorefrontIcon sx={{ color: 'primary.main', fontSize: 40 }} />}
                  title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>{plan.store_name}</Typography>}
                  subheader={<Typography variant="body2" color="text.secondary">{plan.address}</Typography>}
                  sx={{ backgroundColor: 'grey.100', py: 1.5 }}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                    label={
                      <Box component="span">
                        Planning :{' '}
                        <Typography component="span" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                          {plan.planned_visit_time ? moment(plan.planned_visit_time, 'DD-MM-YYYY HH:mm').format('DD-MM-YYYY HH:mm') : 'N/A'}
                        </Typography>
                      </Box>
                    }
                    color="info"
                    size="small"
                  />
                    {getStatusChip(plan)}
                  </Box>
                  <Chip
                    icon={<PlaylistAdd />}
                    label={`CheckIn: ${plan.checkin_time ? moment(plan.checkin_time, 'DD/MM/YY HH:mm:ss').format('DD-MM-YY HH:mm') : 'N/A'}`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<PlaylistAdd />}
                    label={`CheckOut: ${plan.checkout_time ? moment(plan.checkout_time, 'DD/MM/YY HH:mm:ss').format('DD-MM-YY HH:mm') : 'N/A'}`}
                    variant="outlined"
                    size="small"
                  />
                  {plan.notes && (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          Notes: {plan.notes}
                      </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5, backgroundColor: 'grey.50' }}>
                  <IconButton onClick={() => navigate(`/notes/${plan.name}`)} aria-label="Add Notes">
                    <Tooltip title="Add Notes">
                      <PlaylistAdd sx={{ color: 'primary.main' }} />
                    </Tooltip>
                  </IconButton>
                  <Box>
                    {plan.status === 'Planned' && (
                      <Button variant="contained" color="secondary" onClick={() => handleCheckIn(plan.name)}>
                        Check In
                      </Button>
                    )}
                    {plan.status === 'Checked In' && (
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={() => handleOpenCheckout(plan.name)}
                        disabled={isCountdownActive}
                      >
                        {isCountdownActive ? `Wait ${countdown}s` : 'Check Out'}
                      </Button>
                    )}
                  </Box>
                </CardActions>
              </Card>
            ))}
            {isFetchingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {!hasMore && (
              <Typography variant="body2" align="center" color="text.secondary" sx={{ my: 2 }}>
                You have reached the end of the list.
              </Typography>
            )}
          </Box>
        )}
      </Container>
      <Dialog open={openCheckoutDialog} onClose={handleCloseCheckout} fullWidth maxWidth="sm">
        <DialogTitle>Complete Checkout</DialogTitle>
        <DialogContent>
          {checkoutError && <Alert severity="error" sx={{ mb: 2 }}>{checkoutError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>Take Photo:</Typography>
            <video ref={videoRef} style={{ width: '100%', border: '1px solid #ccc' }} autoPlay playsInline />
            <Button variant="outlined" onClick={takePhoto} disabled={!videoRef.current?.srcObject}>Capture Photo</Button>
            {photoDataUrl && <img src={photoDataUrl} alt="Captured" style={{ width: '100%', border: '1px solid #ccc' }} />}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Typography>Current Location:</Typography>
            {currentLocation ? <Typography>Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}</Typography> : <CircularProgress size={20} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCheckout} disabled={checkoutLoading}>Cancel</Button>
          <Button onClick={handleConfirmCheckout} disabled={checkoutLoading || !photoDataUrl || !currentLocation || isCountdownActive} variant="contained">
            {isCountdownActive ? `Wait ${countdown}s` : (checkoutLoading ? <CircularProgress size={24} color="inherit" /> : 'Complete Checkout')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VisitSchedulePage;