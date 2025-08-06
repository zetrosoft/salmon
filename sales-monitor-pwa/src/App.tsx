import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoginPage />
    </ThemeProvider>
  );
}

export default App;