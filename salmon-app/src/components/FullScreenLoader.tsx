
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const FullScreenLoader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'background.default',
        color: 'text.primary'
      }}
    >
      <CircularProgress size={50} />
      <Typography variant="h6" component="div" sx={{ mt: 3 }}>
        Memuat Aplikasi...
      </Typography>
    </Box>
  );
};

export default FullScreenLoader;
