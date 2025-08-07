
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import VisitListPage from './pages/VisitListPage';
import { useState } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

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
        {isLoggedIn ? <VisitListPage onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
