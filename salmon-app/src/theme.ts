
import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF7043', // Deep Orange (Senja)
      contrastText: '#fff',
    },
    secondary: {
      main: '#00796B', // Deep Teal (Laut)
    },
    error: {
      main: '#d32f2f', // Standard red
    },
    background: {
      default: '#FFF8E1', // Sandy Beige (Pasir)
      paper: '#FFFFFF',
    },
    text: {
      primary: '#343A40',
      secondary: '#6C757D',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: '8px',
          // Pure, more diffuse glow effect
          boxShadow: '0 0 15px 5px rgba(255, 99, 71, 0.4), 0 0 30px 10px rgba(0, 121, 107, 0.2)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 112, 67, 0.8)', // Primary color with opacity
            color: '#fff',
            '& .MuiSvgIcon-root': {
              color: '#fff',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 112, 67, 0.9)', // Darker on hover
            },
          },
        },
      },
    },
  },
});

export default theme;
