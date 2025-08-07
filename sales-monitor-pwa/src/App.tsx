
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import VisitListPage from './pages/VisitListPage';
import { useState, useEffect } from 'react';
import { checkSession, logout } from './api/frappeApi';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const { userId, employeeId } = await checkSession();
      if (userId && employeeId) {
        setIsLoggedIn(true);
        setLoggedInUserId(userId);
      } else {
        setIsLoggedIn(false);
        setLoggedInUserId(null);
      }
      setLoading(false);
    };
    verifySession();
  }, []);

  const handleLoginSuccess = (userId: string) => {
    setIsLoggedIn(true);
    setLoggedInUserId(userId);
  };

  const handleLogout = async () => {
    await logout(); // Call the logout API
    setIsLoggedIn(false);
    setLoggedInUserId(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.background.default, // Use theme background color
        }}
      >
        {isLoggedIn ? <VisitListPage onLogout={handleLogout} userId={loggedInUserId} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
