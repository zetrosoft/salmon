import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import VisitSchedulePage from './pages/VisitSchedulePage';
import SalesActivityHistoryPage from './pages/SalesActivityHistoryPage';
import DashboardPage from './pages/DashboardPage'; // New
import ActivityReportPage from './pages/ActivityReportPage'; // New
import ProfilePage from './pages/ProfilePage'; // New
import InputVisitPage from './pages/InputVisitPage';
import Layout from './components/Layout'; // New
import { useState, useCallback, useEffect } from 'react';
import { logout } from './api/frappeApi';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Check login status on app load from session storage
  useEffect(() => {
    const loggedInStatus = sessionStorage.getItem('isLoggedIn');
    const storedEmployeeId = sessionStorage.getItem('employeeId');
    if (loggedInStatus === 'true' && storedEmployeeId) {
      setIsLoggedIn(true);
      setEmployeeId(storedEmployeeId);
    }
  }, []);

  const handleLoginSuccess = useCallback((_userId: string, employeeId: string) => {
    setIsLoggedIn(true);
    setEmployeeId(employeeId);
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('employeeId', employeeId);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsLoggedIn(false);
    setEmployeeId(null);
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('employeeId');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
          {isLoggedIn ? (
            <Route path="/" element={<Layout onLogout={handleLogout} employeeId={employeeId} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="schedule" element={<VisitSchedulePage />} />
              <Route path="activity" element={<SalesActivityHistoryPage />} />
              <Route path="report" element={<ActivityReportPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="input-visit" element={<InputVisitPage />} />
              <Route path="history/:customer?" element={<SalesActivityHistoryPage />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;