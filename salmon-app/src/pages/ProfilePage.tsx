import { Box, Typography, Container, Paper, Avatar } from '@mui/material';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// This interface is provided by the Layout component via context
interface OutletContext {
  employeeId: string | null;
}

// Define the structure of the user details
interface UserDetails {
  employeeId: string | null;
  name: string | null;
  email: string | null;
  initial: string;
}

const ProfilePage = () => {
  // Get employeeId from the parent Layout component
  const { employeeId } = useOutletContext<OutletContext>();
  
  // State to hold user details
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    // Retrieve user data from sessionStorage
    const fullName = sessionStorage.getItem('frappe_full_name');
    const userEmail = sessionStorage.getItem('frappe_user_id'); // user_id is the email

    // Set all details in state, including employeeId from context
    setUserDetails({
      employeeId: employeeId,
      name: fullName,
      email: userEmail,
      initial: fullName ? fullName.charAt(0).toUpperCase() : (employeeId ? employeeId.charAt(0) : '?'),
    });
    
  }, [employeeId]); // Depend on employeeId to re-run if it changes

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {/* Add responsive padding to the Paper component */}
      <Paper elevation={3} sx={{ padding: { xs: 2, sm: 3, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ width: 100, height: 100, mb: 2, fontSize: '3rem' }}>
          {userDetails?.initial}
        </Avatar>
        
        {/* Display Employee ID */}
        <Typography variant="h6" color="text.secondary">
          {userDetails?.employeeId}
        </Typography>

        {/* Display Full Name */}
        <Typography variant="h5" component="h1" gutterBottom>
          {userDetails?.name}
        </Typography>

        {/* Display Email */}
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {userDetails?.email}
        </Typography>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
