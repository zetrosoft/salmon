import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import VisitListPage from './pages/VisitListPage';
import { useState, useCallback } from 'react';
import { logout } from './api/frappeApi';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SalesActivityHistoryPage from './pages/SalesActivityHistoryPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const handleLoginSuccess = useCallback((_userId: string, employeeId: string) => {
    setIsLoggedIn(true);
    setEmployeeId(employeeId);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsLoggedIn(false);
    setEmployeeId(null);
  }, []);

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
            <Route path="/" element={isLoggedIn ? <VisitListPage onLogout={handleLogout} employeeId={employeeId} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/history/:employeeId/:customer?" element={<SalesActivityHistoryPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;