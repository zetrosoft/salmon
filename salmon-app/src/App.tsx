import { ThemeProvider, CssBaseline } from '@mui/material'; // Re-added import
import theme from './theme'; // Re-added import
import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react'; // Added lazy, Suspense
import { initializeApi, logout } from './api/frappeApi';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout'; // New
import FullScreenLoader from './components/FullScreenLoader';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Lazy-loaded components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const VisitSchedulePage = lazy(() => import('./pages/VisitSchedulePage'));
const SalesActivityHistoryPage = lazy(() => import('./pages/SalesActivityHistoryPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ActivityReportPage = lazy(() => import('./pages/ActivityReportPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VisitPlanner = lazy(() => import('./pages/VisitPlanner'));
const AddCustomerPage = lazy(() => import('./pages/AddCustomerPage'));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null); // New state for employee name
  const [isApiInitialized, setIsApiInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeApi();
      setIsApiInitialized(true);
      
      const loggedInStatus = sessionStorage.getItem('isLoggedIn');
      const storedEmployeeId = sessionStorage.getItem('employeeId');
      const storedEmployeeName = sessionStorage.getItem('employeeName'); // Ambil employeeName
      if (loggedInStatus === 'true' && storedEmployeeId) {
        setIsLoggedIn(true);
        setEmployeeId(storedEmployeeId);
        setEmployeeName(storedEmployeeName); // Set employeeName
      }
    }
    init();
  }, []);

  const handleLoginSuccess = useCallback((_userId: string, employeeId: string, employeeName: string) => {
    setIsLoggedIn(true);
    setEmployeeId(employeeId);
    setEmployeeName(employeeName); // Simpan employeeName
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('employeeId', employeeId);
    sessionStorage.setItem('employeeName', employeeName); // Simpan employeeName ke sessionStorage
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsLoggedIn(false);
    setEmployeeId(null);
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('employeeId');
    sessionStorage.removeItem('employeeName'); // Hapus employeeName
  }, []);

  if (!isApiInitialized) {
    return <FullScreenLoader />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
            {isLoggedIn ? (
              <Route path="/" element={<Layout onLogout={handleLogout} employeeId={employeeId} employeeName={employeeName} />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="schedule" element={<VisitSchedulePage />} />
                <Route path="activity" element={<SalesActivityHistoryPage />} />
                <Route path="report" element={<ActivityReportPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="input-visit" element={<VisitPlanner />} />
                <Route path="add-customer" element={<AddCustomerPage />} />
                <Route path="history/:customer?" element={<SalesActivityHistoryPage />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
