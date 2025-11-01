import { Box, Typography, Container, Paper, Avatar, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { get_user_profile_data } from '../api/frappeApi'; // Import API baru

// This interface is provided by the Layout component via context
interface OutletContext {
  employeeId: string | null;
}

// Define the structure of the user details
interface UserDetails {
  employee_name: string;
  designation: string;
  department: string;
  company_email: string;
  cell_number: string;
  image?: string; // URL gambar profil
}

const ProfilePage = () => {
  // Get employeeId from the parent Layout component
  const { employeeId } = useOutletContext<OutletContext>();
  
  // State to hold user details
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!employeeId) {
        setError("Employee ID not available.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await get_user_profile_data(); // Panggil API baru
        if (response.status === "success" && response.data) {
          setUserDetails(response.data);
        } else {
          setError(response.message || "Failed to fetch user profile.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [employeeId]); // Depend on employeeId to re-run if it changes

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : userDetails ? (
        <Paper elevation={3} sx={{ padding: { xs: 2, sm: 3, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            alt={userDetails.employee_name}
            src={userDetails.image || undefined} // Gunakan URL gambar jika ada
            sx={{ width: 100, height: 100, mb: 2, fontSize: '3rem' }}
          >
            {!userDetails.image && userDetails.employee_name ? userDetails.employee_name.charAt(0).toUpperCase() : ''}
          </Avatar>
          
          <Typography variant="h5" component="h1" gutterBottom>
            {userDetails.employee_name}
          </Typography>

          <Typography variant="h6" color="text.secondary" gutterBottom>
            {userDetails.designation}
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            {userDetails.department}
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            Email: {userDetails.company_email}
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            Telepon: {userDetails.cell_number}
          </Typography>
        </Paper>
      ) : (
        <Alert severity="info">No user profile data available.</Alert>
      )}
    </Container>
  );
};

export default ProfilePage;
