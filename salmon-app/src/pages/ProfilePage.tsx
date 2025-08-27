import { Box, Typography, Container, CircularProgress, Alert, Paper, Avatar, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getEmployeeId } from '../api/frappeApi'; // Assuming getEmployeeId can fetch user details

interface OutletContext {
  employeeId: string | null;
}

const ProfilePage = () => {
  const { employeeId } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{ name: string; email: string; role: string; } | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!employeeId) {
        setError("Employee ID not available.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // In a real Frappe app, you'd fetch more user details here.
        // For now, we'll mock some details or use the employeeId as name.
        // A proper API call would be something like frappe.get_doc("Employee", employeeId)
        // For simplicity, we'll just use the employeeId as the name and mock other fields.
        const userEmail = localStorage.getItem('userEmail') || 'user@example.com'; // Assuming email might be stored after login
        setUserDetails({
          name: employeeId, // Using employeeId as name for now
          email: userEmail,
          role: 'Sales Person', // Mock role
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch user details.');
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [employeeId]);

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
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ width: 100, height: 100, mb: 2 }}>
          {userDetails?.name ? userDetails.name.charAt(0).toUpperCase() : ''}
        </Avatar>
        <Typography variant="h5" component="h1" gutterBottom>
          {userDetails?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Email: {userDetails?.email}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Role: {userDetails?.role}
        </Typography>
        <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button variant="outlined" fullWidth>
            Change Password (Coming Soon)
          </Button>
          <Button variant="outlined" fullWidth>
            Update Contact Info (Coming Soon)
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
