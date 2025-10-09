import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { gsap } from 'gsap';

/**
 * A visually appealing error display component.
 * @param {object} props - The component props.
 * @param {string} [props.title="An Error Occurred"] - The title of the error message.
 * @param {string} props.message - The detailed error message to display.
 * @param {Function} [props.onRetry] - A callback function for a "Try Again" button.
 * @param {Function} props.onDismiss - A callback function to dismiss the error message.
 */
const ErrorDisplay = ({ title = "An Error Occurred", message, onRetry, onDismiss }) => {
  const errorRef = useRef(null);

  // Animate the component on mount
  useEffect(() => {
    if (errorRef.current) {
      gsap.fromTo(
        errorRef.current,
        { opacity: 0, y: -30, scale: 0.95, rotationX: -10 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', rotationX: 0 }
      );
    }
  }, []);

  // Animate out and then call the dismiss function
  const handleDismiss = () => {
    if (errorRef.current) {
        gsap.to(errorRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: onDismiss,
      });
    }
  };

  return (
    <Paper
      ref={errorRef}
      elevation={5}
      sx={{
        p: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        borderRadius: '16px',
        borderTop: '4px solid',
        borderColor: 'error.main',
        background: 'linear-gradient(145deg, #fffafa 5%, #ffebee 95%)',
        maxWidth: '550px',
        margin: 'auto',
        boxShadow: '0 8px 32px rgba(211, 47, 47, 0.15)',
      }}
    >
      <Box 
        sx={{ 
          width: 60, 
          height: 60, 
          borderRadius: '50%', 
          display: 'grid', 
          placeItems: 'center', 
          background: 'linear-gradient(145deg, #ef5350, #d32f2f)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          mb: 2 
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 36 }} />
      </Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'error.dark' }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {message}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <Button variant="contained" color="error" onClick={onRetry} sx={{ borderRadius: '8px', fontWeight: 600 }}>
            Try Again
          </Button>
        )}
        {onDismiss && (
          <Button variant="outlined" color="secondary" onClick={handleDismiss} sx={{ borderRadius: '8px' }}>
            Dismiss
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorDisplay;
