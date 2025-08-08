import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import VisitListPage from './pages/VisitListPage';
import { useState, useEffect, useCallback } from 'react';
import { logout } from './api/frappeApi'; // Removed checkSession
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SalesActivityHistoryPage from './pages/SalesActivityHistoryPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Set initial loading to false

  // No longer need useEffect for checkSession

  const handleLoginSuccess = useCallback((userId: string, employeeId: string) => {
    setIsLoggedIn(true);
    setLoggedInUserId(userId);
    setEmployeeId(employeeId);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsLoggedIn(false);
    setLoggedInUserId(null);
    setEmployeeId(null);
  }, []);

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
      <Router>
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
          <Routes>
            <Route path="/" element={isLoggedIn ? <VisitListPage onLogout={handleLogout} userId={loggedInUserId} employeeId={employeeId} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/history/:employeeId/:customer?" element={<SalesActivityHistoryPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;