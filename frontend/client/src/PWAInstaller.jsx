import { useEffect, useState } from 'react';
import {
  Button,
  Slide,
  Snackbar,
  SnackbarContent,
  Grow,
  useTheme,
  IconButton // 💡 Import IconButton
} from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloseIcon from '@mui/icons-material/Close'; // 💡 Import CloseIcon

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install outcome:', outcome);
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  const handleClose = () => { // 💡 Add a function to handle closing the snackbar
    setShowInstall(false);
  };

  return (
    <Snackbar
      open={showInstall}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={Grow}
    >
      <SnackbarContent
        sx={{
          background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
          color: '#fff',
          boxShadow: theme.shadows[8],
          borderRadius: 2,
        }}
        message={
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <InstallMobileIcon style={{ fontSize: '1.4rem' }} />
            Please, try it as an app for a better experience!
          </span>
        }
        action={
          <>
            <Button
              onClick={handleInstall}
              variant="contained"
              sx={{
                ml: 2,
                background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(to right, #ff4b2b, #ff416c)',
                },
              }}
            >
              click to install
            </Button>
            {/* Add the close button */}
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      />
    </Snackbar>
  );
}