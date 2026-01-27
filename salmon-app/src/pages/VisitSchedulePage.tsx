/**
 * @file VisitSchedulePage.tsx
 * @description Komponen React untuk menampilkan dan mengelola jadwal kunjungan sales.
 *              Memungkinkan pengguna untuk melihat rencana kunjungan, melakukan check-in,
 *              dan check-out dengan validasi lokasi serta pengambilan foto.
 *              Juga menyediakan fitur navigasi ke lokasi pelanggan dan melihat riwayat kunjungan.
 */
import { Typography, Container, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, IconButton, Card, CardHeader, CardContent, CardActions, Chip, Skeleton, Tooltip, Select, MenuItem, FormControl, InputLabel, DialogContentText, useMediaQuery, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getVisitPlans, submitVisitUpdate, PAGE_LENGTH, getCustomerMasterLocation, updateCustomerLocation } from '../api/frappeApi';
import { useNavigate, useOutletContext } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import NavigationIcon from '@mui/icons-material/Navigation';
import moment from 'moment';

/**
 * @description Keyframes untuk animasi putar (spin) pada ikon loading.
 */
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

/**
 * @interface VisitPlan
 * @description Mendefinisikan struktur data untuk sebuah rencana kunjungan.
 * @property {string} name - Nama unik atau ID dari rencana kunjungan.
 * @property {string} parent - Dokumen induk dari rencana kunjungan (misalnya, Visit Schedule).
 * @property {string} store_name - Nama toko/pelanggan yang akan dikunjungi.
 * @property {string} address - Alamat toko/pelanggan.
 * @property {'Draft' | 'Planned' | 'Checked In' | 'Completed' | 'Canceled'} status - Status terkini dari kunjungan.
 * @property {number} parent_docstatus - Status dokumen induk (0: Draft, 1: Submitted, dll.).
 * @property {string} [planned_visit_time] - Waktu kunjungan yang direncanakan.
 * @property {string} [checkin_time] - Waktu sales melakukan check-in.
 * @property {string} [checkout_time] - Waktu sales melakukan check-out.
 * @property {number} [latitude] - Latitude lokasi check-in/check-out.
 * @property {number} [longitude] - Longitude lokasi check-in/check-out.
 * @property {string | null} [photo_url] - URL foto yang diambil saat check-out.
 * @property {string} [notes] - Catatan terkait kunjungan.
 */
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

/**
 * @interface OutletContext
 * @description Mendefinisikan konteks yang diterima dari Outlet (react-router-dom).
 * @property {string | null} employeeId - ID karyawan yang sedang login.
 */
interface OutletContext {
  employeeId: string | null;
}

/**
 * @component ScheduleCardSkeleton
 * @description Komponen skeleton yang digunakan sebagai placeholder saat data rencana kunjungan sedang dimuat.
 *              Memberikan umpan balik visual kepada pengguna bahwa konten sedang dalam proses pengambilan.
 */
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

/**
 * @function getDistanceInMeters
 * @description Menghitung jarak antara dua titik koordinat geografis (latitude dan longitude) dalam meter
 *              menggunakan formula Haversine.
 * @param {number} lat1 - Latitude titik pertama.
 * @param {number} lon1 - Longitude titik pertama.
 * @param {number} lat2 - Latitude titik kedua.
 * @param {number} lon2 - Longitude titik kedua.
 * @returns {number} Jarak antara dua titik dalam meter.
 */
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}

/**
 * @function formatDistance
 * @description Memformat jarak dari meter ke format yang lebih mudah dibaca (meter atau kilometer).
 * @param {number} meters - Jarak dalam meter.
 * @returns {string} Jarak yang diformat (misalnya, "150 meter" atau "1.2 km").
 */
const formatDistance = (meters: number): string => {
    if (meters < 500) {
        return `${Math.round(meters)} meter`;
    } else {
        const kilometers = meters / 1000;
        return `${kilometers.toFixed(1)} km`;
    }
};

/**
 * @component VisitSchedulePage
 * @description Halaman utama untuk menampilkan dan mengelola jadwal kunjungan sales.
 *              Menyediakan fungsionalitas untuk melihat daftar kunjungan, melakukan check-in,
 *              dan check-out dengan validasi lokasi serta pengambilan foto.
 *              Mendukung infinite scrolling untuk memuat data kunjungan.
 */
const VisitSchedulePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  /**
   * @constant STATUS_ORDER
   * @description Objek memoized yang mendefinisikan urutan prioritas status kunjungan untuk sorting.
   *              Status dengan nilai lebih kecil akan muncul lebih dulu.
   */
  const STATUS_ORDER = useMemo(() => ({
    "Checked In": 0,
    "Planned": 1,
    "Completed": 2,
    "Canceled": 3,
    "Draft": 4,
  }), []);

  /**
   * @hook useOutletContext
   * @description Mengambil employeeId dari konteks outlet untuk identifikasi pengguna.
   */
  const { employeeId } = useOutletContext<OutletContext>();
  /**
   * @hook useNavigate
   * @description Hook untuk navigasi antar halaman.
   */
  const navigate = useNavigate();

  // --- State untuk Data Kunjungan dan Paginasi ---
  /**
   * @state visitPlans
   * @description Daftar rencana kunjungan yang ditampilkan.
   */
  const [visitPlans, setVisitPlans] = useState<VisitPlan[]>([]);
  /**
   * @state loading
   * @description Menunjukkan apakah data kunjungan awal sedang dimuat.
   */
  const [loading, setLoading] = useState(true);
  /**
   * @state error
   * @description Menyimpan pesan error jika terjadi kesalahan saat mengambil data.
   */
  const [error, setError] = useState<string | null>(null);
  /**
   * @state page
   * @description Nomor halaman saat ini untuk infinite scrolling.
   */
  const [page, setPage] = useState(0);
  /**
   * @state hasMore
   * @description Menunjukkan apakah masih ada data kunjungan yang bisa dimuat.
   */
  const [hasMore, setHasMore] = useState(true);
  /**
   * @state isFetchingMore
   * @description Menunjukkan apakah data tambahan sedang dimuat (untuk infinite scrolling).
   */
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  /**
   * @state totalPlans
   * @description Jumlah total rencana kunjungan yang tersedia di backend.
   */
  const [totalPlans, setTotalPlans] = useState(0);

  /**
   * @ref observer
   * @description Ref untuk IntersectionObserver yang digunakan dalam infinite scrolling.
   */
  const observer = useRef<IntersectionObserver>(null);
  /**
   * @function lastPlanElementRef
   * @description Callback ref yang dipasang pada elemen terakhir dalam daftar kunjungan.
   *              Ketika elemen ini terlihat (intersecting), halaman berikutnya akan dimuat.
   * @param {HTMLElement | null} node - Elemen DOM yang diamati.
   */
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

  // --- State untuk Proses Check-out ---
  /**
   * @state openCheckoutDialog
   * @description Mengontrol visibilitas dialog check-out.
   */
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  /**
   * @state currentPlanName
   * @description Menyimpan nama rencana kunjungan yang sedang diproses untuk check-out.
   */
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  /**
   * @ref videoRef
   * @description Ref untuk elemen video yang menampilkan stream kamera.
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  /**
   * @ref canvasRef
   * @description Ref untuk elemen canvas yang digunakan untuk mengambil foto dari stream video.
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /**
   * @state photoDataUrl
   * @description Menyimpan data URL dari foto yang diambil.
   */
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  /**
   * @state photoFile
   * @description Menyimpan objek File dari foto yang diambil, siap untuk diunggah.
   */
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  /**
   * @state currentLocation
   * @description Menyimpan koordinat lokasi pengguna saat ini.
   */
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  /**
   * @state checkoutLoading
   * @description Menunjukkan apakah proses check-out sedang berlangsung.
   */
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  /**
   * @state checkoutError
   * @description Menyimpan pesan error jika terjadi kesalahan saat check-out.
   */
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  /**
   * @state devices
   * @description Daftar perangkat media (kamera) yang tersedia.
   */
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  /**
   * @state activeDeviceId
   * @description ID perangkat kamera yang sedang aktif digunakan.
   */
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
  /**
   * @state isVideoStreamReady
   * @description Menunjukkan apakah stream video dari kamera sudah siap dan terhubung ke elemen video.
   */
  const [isVideoStreamReady, setIsVideoStreamReady] = useState(false);
  
  // --- State untuk Konfirmasi Jarak dan Loading Awal ---
  /**
   * @state distanceConfirm
   * @description Mengontrol visibilitas dialog konfirmasi jarak.
   */
     const [distanceConfirm, setDistanceConfirm] = useState<{ isOpen: boolean; distance: number; type?: 'too_far' | 'almost_there' }>({ isOpen: false, distance: 0 });  /**
   * @state isInitialLoading
   * @description Menunjukkan apakah proses loading awal (izin kamera/lokasi, pengecekan jarak) sedang berlangsung.
   */
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  /**
   * @state initialLoadingError
   * @description Menyimpan pesan error jika terjadi kesalahan pada proses loading awal.
   */
  const [initialLoadingError, setInitialLoadingError] = useState<string | null>(null);

  /**
   * @state activeCameraStream
   * @description Menyimpan objek MediaStream dari kamera yang sedang aktif.
   */
  const [activeCameraStream, setActiveCameraStream] = useState<MediaStream | null>(null); // New state for camera stream

  /**
   * @hook useEffect
   * @description Mengelola siklus hidup stream kamera.
   *              Ketika dialog check-out terbuka dan stream kamera aktif, stream akan di-*assign* ke elemen video.
   *              Juga mengatur state `isVideoStreamReady` setelah stream berhasil di-*assign*.
   *              Stream akan dihentikan saat dialog ditutup melalui `handleCloseCheckout`.
   */
  useEffect(() => {
    if (openCheckoutDialog && activeCameraStream) {
      setIsVideoStreamReady(false); // Reset state when dialog opens or stream changes
      const assignStream = () => {
        if (videoRef.current) {
          // console.log("DEBUG: Attempting to assign stream. videoRef.current:", videoRef.current, "activeCameraStream:", activeCameraStream);
          videoRef.current.srcObject = activeCameraStream;
          // console.log("DEBUG: Camera stream assigned to videoRef.current.srcObject.");
          setIsVideoStreamReady(true); // Set to true when stream is successfully assigned
        } else {
          console.warn("DEBUG: videoRef.current is null in useEffect. Retrying...");
          // console.log("DEBUG: videoRef.current is still null. Retrying assignStream...");
          setTimeout(assignStream, 50); // Retry after 50ms
        }
      };
      assignStream();
    } else if (!openCheckoutDialog) {
      setIsVideoStreamReady(false); // Ensure it's false when dialog is closed
    }
    // The stream is stopped by handleCloseCheckout when the dialog is closed.
    // No need to stop it here prematurely.
  }, [openCheckoutDialog, activeCameraStream]); // videoRef.current is not a dependency

  // Removed getCameras and startCamera functions, and their useEffects.
  // Camera initialization will now be handled directly in handleOpenCheckout

  /**
   * @function sortPlans
   * @description Mengurutkan daftar rencana kunjungan berdasarkan prioritas status.
   * @param {VisitPlan[]} plans - Array rencana kunjungan yang akan diurutkan.
   * @returns {VisitPlan[]} Array rencana kunjungan yang sudah diurutkan.
   */
  const sortPlans = useCallback((plans: VisitPlan[]) => {
    return plans.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
  }, [STATUS_ORDER]);

    /**

     * @function fetchVisitPlans

     * @description Mengambil data rencana kunjungan dari API Frappe.

     *              Mendukung paginasi untuk infinite scrolling.

     * @param {number} pageToFetch - Nomor halaman yang akan diambil.

     * @async

     */

    const fetchVisitPlans = useCallback(async (pageToFetch: number) => {

      if (!employeeId) {

        setError("Employee ID not available.");

        setLoading(false);

        setIsFetchingMore(false);

        return;

      }

      if (pageToFetch === 0) setLoading(true); else setIsFetchingMore(true);

      try {

          const response = await getVisitPlans(pageToFetch);

          if (response.error_message) {

              setError(response.error_message);

              setHasMore(false);

              setVisitPlans([]);

              return;

          }

          const newPlans = response.data;

          const totalCount = response.total;

          if (pageToFetch === 0) {

              setVisitPlans(sortPlans(newPlans));

              setTotalPlans(totalCount);

              setHasMore(newPlans.length < totalCount);

          } else {

              setVisitPlans(prevPlans => {

                  const allPlans = [...prevPlans, ...newPlans];

                  const uniquePlans = Array.from(new Map(allPlans.map(p => [p.name, p])).values());

                  const sortedUniquePlans = sortPlans(uniquePlans);

                  setHasMore(sortedUniquePlans.length < totalCount);

                  return sortedUniquePlans;

              });

          }

          setError(null);

      } catch (err: unknown) {

          console.error('Error fetching visit plans:', err);

          setError(err instanceof Error ? err.message : 'Failed to fetch data.');

          setHasMore(false);

      } finally {

          if (pageToFetch === 0) setLoading(false);

          setIsFetchingMore(false);

      }

    }, [employeeId, sortPlans]);

  /**
   * @hook useEffect
   * @description Memuat rencana kunjungan awal ketika `employeeId` tersedia atau berubah.
   *              Merupakan trigger utama untuk pengambilan data.
   */
  useEffect(() => {
    if (employeeId) {
      setVisitPlans([]);
      setPage(0);
      setHasMore(true);
      setTotalPlans(0);
      fetchVisitPlans(0);
    }
  }, [employeeId, fetchVisitPlans]);

  /**
   * @hook useEffect
   * @description Memuat halaman rencana kunjungan berikutnya ketika state `page` berubah (untuk infinite scrolling).
   */
  useEffect(() => {
    if (page > 0) fetchVisitPlans(page);
  }, [page, fetchVisitPlans]);

  /**
   * @function getStatusChip
   * @description Mengembalikan komponen Chip Material-UI yang merepresentasikan status kunjungan.
   *              Warna dan label Chip disesuaikan dengan status kunjungan.
   * @param {VisitPlan} plan - Objek rencana kunjungan.
   * @returns {JSX.Element} Komponen Chip dengan Tooltip.
   */
  const getStatusChip = useCallback((plan: VisitPlan) => {
    if (plan.parent_docstatus === 0) return <Tooltip title={plan.parent} arrow><Chip label="Draft" color="warning" size="small" sx={{ fontWeight: 'bold' }} /></Tooltip>;
    let color: 'primary' | 'secondary' | 'success' | 'error' | 'default' = 'default';
    let label = plan.status;
    switch (plan.status) {
      case 'Planned': color = 'primary'; break;
      case 'Checked In': color = 'secondary'; break;
      case 'Completed': color = 'success'; break;
      case 'Canceled': color = 'error'; break;
      default: label = 'Draft'; color = 'error'; break;
    }
    return <Tooltip title={plan.parent} arrow><Chip label={label} color={color} size="small" sx={{ fontWeight: 'bold' }} /></Tooltip>;
  }, []);

  /**
   * @function handleCheckIn
   * @description Menangani proses check-in untuk sebuah rencana kunjungan.
   *              Mengirimkan pembaruan status ke server dan me-refresh daftar kunjungan.
   * @param {string} name - Nama rencana kunjungan yang akan di-check-in.
   * @async
   */
  const handleCheckIn = async (name: string) => {
    try {
      const success = await submitVisitUpdate(name, 'Checked In');
      if (success) fetchVisitPlans(0); else setError('Failed to check-in.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during check-in.');
    }
  };

    /**

     * @function handleOpenCheckout

     * @description Menangani pembukaan dialog check-out.

     *              Melakukan validasi awal seperti meminta izin kamera dan lokasi,

     *              mengambil lokasi master pelanggan, dan melakukan pengecekan jarak.

     *              Jika jarak terlalu jauh, akan menampilkan dialog konfirmasi untuk update lokasi.

     * @param {string} name - Nama rencana kunjungan yang akan di-check-out.

     * @async

     */

    const handleOpenCheckout = async (name: string) => {

      const plan = visitPlans.find(p => p.name === name);

      if (!plan) {

          return;

      }

      setCurrentPlanName(name);

      setIsInitialLoading(true);

      setInitialLoadingError(null);

      let currentCameraStream: MediaStream | null = null;

  

      try {

          // --- STEP 1: Request ALL permissions upfront and get live location ---

          const cameraStreamPromise = navigator.mediaDevices.getUserMedia({ video: true });

          const liveLocationPromise = new Promise<{latitude: number, longitude: number}>((resolve, reject) => {

              if (!navigator.geolocation) return reject(new Error("Geolocation is not supported."));

              navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(err));

          });

  

          const [streamResult, liveLocation] = await Promise.all([cameraStreamPromise, liveLocationPromise]);

          currentCameraStream = streamResult; // Store the stream locally

          setActiveCameraStream(currentCameraStream); // Store in state for useEffect

          setCurrentLocation(liveLocation);

  

          // --- STEP 2: Fetch Master Location ---

          const masterLocation = await getCustomerMasterLocation(plan.store_name);

  

                    // --- STEP 3: Distance Check --- (Only if master location exists)

  

                                        if (masterLocation && masterLocation.latitude && masterLocation.longitude) {

  

                    

  

                                            const distance = getDistanceInMeters(masterLocation.latitude, masterLocation.longitude, liveLocation.latitude, liveLocation.longitude);

  

                    

  

                                            if (distance > 100) { // Jarak terlalu jauh

  

                                                setIsInitialLoading(false);

  

                                                setDistanceConfirm({ isOpen: true, distance: distance, type: 'too_far' }); // Menambahkan 'type'

  

                                                // Crucially, stop the camera stream if the main dialog won\'t open yet

  

                                                if (currentCameraStream) currentCameraStream.getTracks().forEach(track => track.stop());

  

                                                setActiveCameraStream(null); // Clear state

  

                                                return;

  

                                            } else if (distance > 50) { // Jarak sudah dekat (antara 5 dan 100 meter)

  

                                                setIsInitialLoading(false);

  

                                                setDistanceConfirm({ isOpen: true, distance: distance, type: 'almost_there' }); // Menambahkan 'type'

  

                                                // Crucially, stop the camera stream if the main dialog won won't open yet

  

                                                if (currentCameraStream) currentCameraStream.getTracks().forEach(track => track.stop());

  

                                                setActiveCameraStream(null); // Clear state

  

                                                return;

  

                                            }

  

                                        }

  

                    

  

                    // --- STEP 4: If distance OK or no master location, open main checkout dialog ---

  

                    // Stream is already in activeCameraStream state, useEffect will handle assignment

  

            

  

                    setIsInitialLoading(false);

  

                    setOpenCheckoutDialog(true); // Open the main dialog

  

            

  

                } catch (error) {

          console.error("DEBUG: Error during pre-checkout validation:", error);

          console.error("DEBUG: Error during pre-checkout validation:", error);

          if (currentCameraStream) currentCameraStream.getTracks().forEach(track => track.stop()); // Ensure stream is stopped on error

          setActiveCameraStream(null); // Clear state

          

          let errorMessage = "Gagal mempersiapkan checkout. Pastikan izin lokasi dan kamera telah diberikan.";

          if (error instanceof GeolocationPositionError) {

              if (error.code === error.PERMISSION_DENIED) errorMessage = "Akses lokasi ditolak. Mohon aktifkan di pengaturan browser.";

              else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "Informasi lokasi tidak tersedia saat ini.";

          } else if (error instanceof Error && error.name === 'NotAllowedError') {

              errorMessage = "Akses kamera ditolak. Mohon aktifkan di pengaturan browser.";

          }

          setInitialLoadingError(errorMessage);

          setIsInitialLoading(false);

      }

    };

  /**
   * @function handleCloseCheckout
   * @description Menutup dialog check-out dan mereset state terkait.
   *              Memastikan stream kamera dihentikan.
   */
  const handleCloseCheckout = useCallback(() => {
    // console.log("DEBUG: handleCloseCheckout triggered. Stopping camera stream.");
    setOpenCheckoutDialog(false);
    setCurrentPlanName(null);
    setIsVideoStreamReady(false); // Reset video stream ready state
    // Stream stopping is now handled by useEffect based on openCheckoutDialog state
  }, []); // No dependencies needed as it only sets state and state setters are stable

  /**
   * @function takePhoto
   * @description Mengambil foto dari stream video yang sedang aktif dan menyimpannya sebagai data URL dan objek File.
   */
  const takePhoto = useCallback(() => {
    // console.log("DEBUG: takePhoto called. videoRef.current:", videoRef.current, "canvasRef.current:", canvasRef.current);
    if (videoRef.current && canvasRef.current) {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
            const dataUrl = canvasElement.toDataURL('image/jpeg');
            setPhotoDataUrl(dataUrl);
            canvasElement.toBlob((blob: Blob | null) => {
                if (blob) setPhotoFile(new File([blob], 'captured_photo.jpeg', { type: 'image/jpeg' }));
            }, 'image/jpeg');
        }
    }
  }, []);

  /**
   * @function proceedWithCheckout
   * @description Melanjutkan proses check-out dengan mengirimkan data kunjungan yang sudah lengkap
   *              (termasuk lokasi dan foto) ke server.
   * @async
   */
  const proceedWithCheckout = useCallback(async () => {
    if (!currentLocation || !currentPlanName || !photoFile) {
        setCheckoutError('Pastikan foto sudah diambil dan lokasi tersedia.');
        setCheckoutLoading(false);
        return;
    }
    try {
        const success = await submitVisitUpdate(currentPlanName, 'Completed', { latitude: currentLocation.latitude, longitude: currentLocation.longitude, photo_file: photoFile, checkout_time: moment().format('YYYY-MM-DD HH:mm:ss') });
        if (success) {
            handleCloseCheckout();
            fetchVisitPlans(0);
        } else {
            setCheckoutError('Gagal menyelesaikan checkout.');
        }
    } catch (error) {
        setCheckoutError(error instanceof Error ? error.message : 'Terjadi error saat checkout.');
    } finally {
        setCheckoutLoading(false);
    }
  }, [currentLocation, currentPlanName, photoFile, handleCloseCheckout, fetchVisitPlans]);

  /**
   * @function handleAcceptDistanceUpdate
   * @description Menangani persetujuan pengguna untuk memperbarui lokasi master pelanggan
   *              dengan lokasi pengguna saat ini.
   * @async
   */
  const handleAcceptDistanceUpdate = async () => {
    // console.log("--- DEBUG: handleAcceptDistanceUpdate triggered ---");
    setDistanceConfirm({ isOpen: false, distance: 0 });

    const plan = visitPlans.find(p => p.name === currentPlanName);
    if (!plan || !currentLocation) {
        // console.error("DEBUG: Missing plan or current location for update.");
        return;
    }

    try {
        // console.log("DEBUG: Calling updateCustomerLocation API...");
        await updateCustomerLocation(plan.store_name, currentLocation.latitude, currentLocation.longitude);
        // console.log("DEBUG: Location updated successfully. Reloading page.");
        window.location.reload(); // Reload the page
    } catch (error) {
        // console.error("DEBUG: Failed to update customer location:", error);
        setInitialLoadingError("Gagal memperbarui lokasi customer. Silakan coba lagi.");
    }
  };

  /**
   * @function handleConfirmCheckout
   * @description Fungsi callback untuk mengkonfirmasi dan menyelesaikan proses check-out.
   *              Melakukan validasi akhir dan memanggil `proceedWithCheckout`.
   * @async
   */
  const handleConfirmCheckout = useCallback(async () => {
    // console.log("DEBUG: handleConfirmCheckout called. currentLocation:", currentLocation, "currentPlanName:", currentPlanName, "photoFile:", photoFile, "photoDataUrl:", photoDataUrl);
    if (!currentLocation || !currentPlanName || !photoFile) {
        setCheckoutError('Pastikan foto sudah diambil dan lokasi tersedia.');
        return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
        const plan = visitPlans.find(p => p.name === currentPlanName);
        if (!plan) throw new Error("Data kunjungan tidak ditemukan.");
        const masterLocation = await getCustomerMasterLocation(plan.store_name);
        if (!masterLocation) {
            await updateCustomerLocation(plan.store_name, currentLocation.latitude, currentLocation.longitude);
        }
        await proceedWithCheckout();
    } catch (err) {
        setCheckoutError(err instanceof Error ? err.message : 'Gagal memvalidasi lokasi.');
        setCheckoutLoading(false);
    }
  }, [currentPlanName, currentLocation, photoFile, visitPlans, proceedWithCheckout]);

  /**
   * @function handleNavigate
   * @description Membuka Google Maps untuk navigasi ke lokasi pelanggan.
   *              Membutuhkan lokasi master pelanggan yang valid.
   * @param {VisitPlan} plan - Objek rencana kunjungan.
   * @async
   */
  const handleNavigate = async (plan: VisitPlan) => {
    const masterLocation = await getCustomerMasterLocation(plan.store_name);
    if (masterLocation && masterLocation.latitude && masterLocation.longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${masterLocation.latitude},${masterLocation.longitude}`;
        window.open(url, '_blank');
    } else {
        setError(`Lokasi untuk customer ${plan.store_name} tidak ditemukan.`);
    }
  };

  /**
   * @function formatDateTime
   * @description Memformat string tanggal dan waktu ke format yang lebih mudah dibaca.
   *              Jika tanggal sama dengan tanggal yang direncanakan, hanya waktu yang ditampilkan.
   * @param {string | undefined} dateTimeString - String tanggal dan waktu yang akan diformat.
   * @param {string | undefined} plannedDateTimeString - String tanggal dan waktu yang direncanakan (untuk perbandingan).
   * @returns {string} String tanggal dan waktu yang sudah diformat.
   */
  const formatDateTime = useCallback((dateTimeString: string | undefined, plannedDateTimeString: string | undefined) => {
    if (!dateTimeString) return 'N/A';
    const dateTime = moment(dateTimeString, 'DD-MM-YYYY HH:mm:ss');
    if (!dateTime.isValid()) return 'Invalid Date';
    if (plannedDateTimeString) {
      const plannedDate = moment(plannedDateTimeString, 'DD-MM-YYYY HH:mm');
      if (plannedDate.isValid() && dateTime.isSame(plannedDate, 'day')) return dateTime.format('HH:mm');
    }
    return dateTime.format('DD-MM-YYYY HH:mm');
  }, []);

  return (
    /**
     * @section Tampilan Utama Jadwal Kunjungan
     * @description Bagian ini menampilkan daftar rencana kunjungan dalam bentuk kartu.
     *              Menyediakan tombol untuk navigasi ke riwayat kunjungan.
     *              Menampilkan skeleton loading, pesan error, atau pesan jika tidak ada rencana kunjungan.
     */
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, width: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>My Visit Schedule</Typography>
        <Box sx={{ mb: 2, textAlign: 'right' }}><Button variant="contained" startIcon={<HistoryIcon />} onClick={() => navigate('/history')}>History</Button></Box>
        {loading && page === 0 ? (
          <Box><ScheduleCardSkeleton /><ScheduleCardSkeleton /><ScheduleCardSkeleton /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : visitPlans.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>No visit plans found.</Alert>
        ) : (
          <Box>
            {visitPlans.map((plan, index) => (
              /**
               * @component CardKunjungan
               * @description Menampilkan detail satu rencana kunjungan.
               *              Termasuk nama toko, alamat, waktu perencanaan, status, dan tombol aksi.
               */
              <Card key={plan.name} sx={{ mb: 3, border: '1px solid #e0e0e0', boxShadow: '4px 4px 8px rgba(0,0,0,0.1)', width: isMobile ? '100%' : 'auto' }} ref={visitPlans.length === index + 1 ? lastPlanElementRef : null}>
                <CardHeader
                  avatar={<StorefrontIcon sx={{ color: 'primary.main', fontSize: 40 }} />}
                  title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>{plan.store_name}</Typography>}
                  subheader={<Typography variant="body2" color="text.secondary">{plan.address}</Typography>}
                  sx={{ backgroundColor: 'grey.100', py: 1.5 }}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={<Box component="span">Planning :{' '}<Typography component="span" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>{plan.planned_visit_time ? moment(plan.planned_visit_time, 'DD-MM-YYYY HH:mm').format('DD-MM-YYYY HH:mm') : 'N/A'}</Typography></Box>} color="info" size="small" />
                    {getStatusChip(plan)}
                  </Box>
                  <Chip icon={<PlaylistAdd />} label={`CheckIn: ${formatDateTime(plan.checkin_time, plan.planned_visit_time)}`} variant="outlined" size="small" />
                  <Chip icon={<PlaylistAdd />} label={`CheckOut: ${formatDateTime(plan.checkout_time, plan.planned_visit_time)}`} variant="outlined" size="small" />
                  {plan.notes && <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Notes: {plan.notes}</Typography>}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5, backgroundColor: 'grey.50' }}>
                  <Box>
                    <IconButton onClick={() => handleNavigate(plan)} aria-label="Navigate"><Tooltip title="Navigate to Customer"><NavigationIcon sx={{ color: 'primary.main' }} /></Tooltip></IconButton>
                    <IconButton onClick={() => navigate(`/notes/${plan.name}`)} aria-label="Add Notes"><Tooltip title="Add Notes"><PlaylistAdd /></Tooltip></IconButton>
                  </Box>
                  <Box>
                    {plan.status === 'Planned' && <Button variant="contained" color="secondary" onClick={() => handleCheckIn(plan.name)}>Check In</Button>}
                    {plan.status === 'Checked In' && <Button variant="contained" color="success" onClick={() => handleOpenCheckout(plan.name)}>Check Out</Button>}
                  </Box>
                </CardActions>
              </Card>
            ))}
            {isFetchingMore && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            {!hasMore && <Typography variant="body2" align="center" color="text.secondary" sx={{ my: 2 }}>You have reached the end of the list.</Typography>}
          </Box>
        )}
      </Container>

      {/*
       * @dialog DialogCheckout
       * @description Dialog untuk menyelesaikan proses check-out.
       *              Memungkinkan pengguna untuk mengambil foto, melihat lokasi saat ini, dan mengkonfirmasi check-out.
       */}
      <Dialog open={openCheckoutDialog} onClose={handleCloseCheckout} fullWidth maxWidth="sm">
        <DialogTitle>Complete Checkout</DialogTitle>
        <DialogContent>
          {checkoutError && <Alert severity="error" sx={{ mb: 2 }}>{checkoutError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>Take Photo:</Typography>
            <video ref={videoRef} style={{ width: '100%', border: '1px solid #ccc' }} autoPlay playsInline />
            {devices.length > 1 && (
              <FormControl fullWidth>
                <InputLabel id="camera-select-label">Camera</InputLabel>
                <Select labelId="camera-select-label" value={activeDeviceId || ''} label="Camera" onChange={(e) => setActiveDeviceId(e.target.value as string)}>
                  {devices.map(device => <MenuItem key={device.deviceId} value={device.deviceId}>{device.label}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <Button variant="outlined" onClick={takePhoto} disabled={!isVideoStreamReady}>Capture Photo</Button>
            {photoDataUrl && <img src={photoDataUrl} alt="Captured" style={{ width: '100%', border: '1px solid #ccc' }} />}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Typography>Current Location:</Typography>
            {currentLocation ? <Typography>Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}</Typography> : <CircularProgress size={20} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCheckout} disabled={checkoutLoading}>Cancel</Button>
          <Button onClick={handleConfirmCheckout} disabled={checkoutLoading || !photoDataUrl || !currentLocation} variant="contained">
            {checkoutLoading ? <CircularProgress size={24} color="inherit" /> : 'Complete Checkout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*
       * @dialog DialogKonfirmasiJarak
       * @description Dialog yang muncul jika lokasi pengguna terlalu jauh dari lokasi master pelanggan.
       *              Memberikan opsi untuk memperbarui lokasi master pelanggan.
       */}
      <Dialog open={distanceConfirm.isOpen} onClose={() => setDistanceConfirm({ isOpen: false, distance: 0 })}>
        <DialogTitle>Lokasi Terlalu Jauh</DialogTitle>
        <DialogContent>
            {(() => {
                const plan = visitPlans.find(p => p.name === currentPlanName);
                const customerName = plan?.store_name || "customer";
                const customerAddress = plan?.address || "alamat tidak tersedia";

                const FormattedCustomerName = (
                    <Tooltip title={customerAddress} arrow>
                        <Typography component="span" sx={{ fontWeight: 'bold' }}>
                            {customerName}
                        </Typography>
                    </Tooltip>
                );

                let contentToRender;

                if (distanceConfirm.type === 'too_far') {
                    contentToRender = (
                        <>
                            Lokasi Anda berjarak sekitar <Typography component="span" sx={{ fontWeight: 'bold' }}>{formatDistance(distanceConfirm.distance)}</Typography> dari lokasi customer.
                            <br /><br />
                            Lokasi Anda terlalu jauh dengan {FormattedCustomerName}. Silahkan terus berjalan mendekat.
                            <br />
                            Gunakan button refresh untuk memperbaharui.
                        </>
                    );
                } else if (distanceConfirm.type === 'almost_there') {
                    contentToRender = (
                        <>
                            Lokasi Anda berjarak sekitar <Typography component="span" sx={{ fontWeight: 'bold' }}>{formatDistance(distanceConfirm.distance)}</Typography> dari lokasi customer.
                            <br /><br />
                            Terus melangkah lagi lokasi anda sudah dekat.
                            <br />
                            Gunakan button refresh untuk memperbaharui.
                        </>
                    );
                } else {
                    contentToRender = (
                        <>
                            Lokasi Anda berjarak sekitar <Typography component="span" sx={{ fontWeight: 'bold' }}>{formatDistance(distanceConfirm.distance)}</Typography> dari lokasi customer.
                            <br /><br />
                            Silahkan berjalan lagi untuk mendapatkan lokasi yang sesuai.
                        </>
                    );
                }

                return (
                    <DialogContentText>
                        {contentToRender}
                    </DialogContentText>
                );
            })()}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => window.location.reload()} color="primary">Refresh</Button>
        </DialogActions>
      </Dialog>

      {/*
       * @dialog DialogLoadingAwal
       * @description Dialog loading yang ditampilkan saat proses inisialisasi check-out (izin, lokasi, dll.) berlangsung.
       */}
      <Dialog open={isInitialLoading}>
        <DialogContent sx={{display: 'flex', alignItems: 'center', gap: 2}}><CircularProgress /><Typography>Mempersiapkan checkout...</Typography></DialogContent>
      </Dialog>

      {/*
       * @dialog DialogErrorAwal
       * @description Dialog untuk menampilkan pesan error yang terjadi selama proses inisialisasi check-out.
       */}
      <Dialog open={!!initialLoadingError} onClose={() => setInitialLoadingError(null)}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent><DialogContentText>{initialLoadingError}</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setInitialLoadingError(null)}>Tutup</Button></DialogActions>
      </Dialog>
    </>
  );
};

export default VisitSchedulePage;
