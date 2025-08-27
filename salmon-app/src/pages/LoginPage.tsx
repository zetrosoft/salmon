import { Box, Button, Container, TextField, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';
import { login, fetchCsrfToken } from '../api/frappeApi';

interface LoginPageProps {
  onLoginSuccess: (userId: string, employeeId: string) => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fetch CSRF token before attempting login
      await fetchCsrfToken();

      const response = await login(username, password);
      if (response.success && response.userId && response.salesName) {
        onLoginSuccess(response.userId, response.salesName);
      } else {
        const backendMessage = typeof response.message === 'string' ? response.message : '';
        if (backendMessage === 'Invalid login credentials.') {
          setError('Invalid username or password.');
        } else {
          setError(backendMessage || 'Login failed');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo-siumang@0.33x.svg" alt="Siumang Logo" style={{ width: '100px', marginBottom: '16px' }} />
        <Typography component="h1" variant="h5" sx={{ marginBottom: 2 }}>
          Sales Monitor Login
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;