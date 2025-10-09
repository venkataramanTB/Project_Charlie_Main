import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, CircularProgress,
  Box, Chip, Stack, IconButton
} from '@mui/material';
import {
  ErrorOutline, DoubleArrow as DoubleArrowIcon, Visibility
} from '@mui/icons-material';
import gsap from 'gsap';

// AnimatedButton component (copied for consistency)
const AnimatedButton = ({ children, ...props }) => {
  const buttonRef = useRef(null);
  const textWrapperRef = useRef(null);
  const charsRef = useRef([]);
  const startIconRef = useRef(null);
  const endIconRef = useRef(null);

  const isReactElement = React.isValidElement(children);

  useEffect(() => {
    if (!isReactElement && textWrapperRef.current) {
      const text = children ? children.toString() : '';
      textWrapperRef.current.innerHTML = '';
      charsRef.current = text.split('').map((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.position = 'relative';
        span.style.willChange = 'transform, opacity';
        textWrapperRef.current.appendChild(span);
        return span;
      });
    }
  }, [children, isReactElement]);

  const handleMouseEnter = () => {
    if (!isReactElement) {
      gsap.to(charsRef.current, {
        x: () => Math.random() * 6 - 3,
        y: () => Math.random() * 6 - 3,
        opacity: 0.8,
        rotation: () => Math.random() * 10 - 5,
        stagger: 0.01,
        ease: "power1.out",
        duration: 0.1,
        onComplete: () => {
          gsap.to(charsRef.current, {
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0,
            stagger: 0.01,
            ease: "power1.out",
            duration: 0.1
          });
        }
      });
    }

    if (startIconRef.current) {
      gsap.to(startIconRef.current, {
        x: -5,
        rotation: -10,
        ease: "power1.out",
        duration: 0.2,
        onComplete: () => {
          gsap.to(startIconRef.current, {
            x: 0,
            rotation: 0,
            ease: "power1.out",
            duration: 0.2
          });
        }
      });
    }
    if (endIconRef.current) {
      gsap.to(endIconRef.current, {
        x: 5,
        rotation: 10,
        ease: "power1.out",
        duration: 0.2,
        onComplete: () => {
          gsap.to(endIconRef.current, {
            x: 0,
            rotation: 0,
            ease: "power1.out",
            duration: 0.2
          });
        }
      });
    }
  };

  const handleMouseLeave = () => {
    if (!isReactElement) {
      gsap.to(charsRef.current, {
        x: 0,
        y: 0,
        opacity: 1,
        rotation: 0,
        stagger: 0.01,
        ease: "power1.out",
        duration: 0.1
      });
    }

    if (startIconRef.current) {
      gsap.to(startIconRef.current, {
        x: 0,
        rotation: 0,
        ease: "power1.out",
        duration: 0.2
      });
    }
    if (endIconRef.current) {
      gsap.to(endIconRef.current, {
        x: 0,
        rotation: 0,
        ease: "power1.out",
        duration: 0.2
      });
    }
  };

  return (
    <Button
      {...props}
      onMouseEnter={props.disabled ? null : handleMouseEnter}
      onMouseLeave={props.disabled ? null : handleMouseLeave}
      ref={buttonRef}
      sx={{
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...props.sx
      }}
    >
      {props.startIcon && <span ref={startIconRef} style={{ marginRight: '8px', display: 'inline-flex', position: 'relative' }}>{props.startIcon}</span>}
      {isReactElement ? children : <span ref={textWrapperRef} style={{ display: 'inline-flex', alignItems: 'center' }} />}
      {props.endIcon && <span ref={endIconRef} style={{ marginLeft: '8px', display: 'inline-flex', position: 'relative' }}>{props.endIcon}</span>}
    </Button>
  );
};

const AnimatedTitleText = ({ children }) => {
  const textWrapperRef = useRef(null);
  const charsRef = useRef([]);

  useEffect(() => {
    if (textWrapperRef.current) {
      const text = children ? children.toString() : '';
      textWrapperRef.current.innerHTML = '';
      charsRef.current = text.split('').map((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.position = 'relative';
        span.style.willChange = 'transform, opacity';
        textWrapperRef.current.appendChild(span);
        return span;
      });
    }
  }, [children]);

  const handleMouseEnter = () => {
    gsap.to(charsRef.current, {
      x: () => Math.random() * 6 - 3,
      y: () => Math.random() * 6 - 3,
      opacity: 0.8,
      rotation: () => Math.random() * 10 - 5,
      stagger: 0.01,
      ease: "power1.out",
      duration: 0.1,
      onComplete: () => {
        gsap.to(charsRef.current, {
          x: 0,
          y: 0,
          opacity: 1,
          rotation: 0,
          stagger: 0.01,
          ease: "power1.out",
          duration: 0.1
        });
      }
    });
  };

  const handleMouseLeave = () => {
    gsap.to(charsRef.current, {
      x: 0,
      y: 0,
      opacity: 1,
      rotation: 0,
      stagger: 0.01,
      ease: "power1.out",
      duration: 0.1
    });
  };

  return (
    <Typography
      variant="h6"
      fontWeight={600}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <span ref={textWrapperRef} style={{ display: 'inline-flex' }} />
    </Typography>
  );
};


const ErrorDetailsDialog = ({ open, onClose, apiEndpoint, oracleRequestId, oracleJobSummary, customerName, instanceName }) => {
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [errors, setErrors] = useState([]);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);

  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCurrentErrorIndex(0); 
      fetchErrors();
      if (dialogRef.current) {
        gsap.fromTo(dialogRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      }
    }
  }, [open, oracleRequestId]); 

const fetchErrors = async () => {
  if (!oracleRequestId || oracleRequestId === 'N/A') {
    setErrors([{ MessageText: 'No Oracle Request ID available to check for errors.' }]);
    setLoadingErrors(false); 
    return;
  }

  setLoadingErrors(true);
  setErrors([]);

  try {
    const res = await fetch(`${apiEndpoint}/api/hdl/errors/${customerName}/${instanceName}/${oracleRequestId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Failed to parse error response.' }));
      throw Object.assign(new Error(`Failed to fetch error details from Oracle.`), { oracleRaw: errorData });
    }

    const result = await res.json();

    // ✅ Oracle puts errors inside oracle_response.items, not top-level
    const oracleItems = result?.oracle_response?.items || [];

    if (Array.isArray(oracleItems) && oracleItems.length > 0) {
      setErrors(oracleItems);
    } else {
      setErrors([{ MessageText: 'No specific error details were found for this request.' }]);
    }
  } catch (err) {
    console.error("Error fetching Oracle errors:", err);
    let displayMessage = err.message || 'An unknown error occurred while checking Oracle errors.';
    let errorsToDisplay = [];

    if (err.oracleRaw && (err.oracleRaw.items || err.oracleRaw.message)) {
      if (err.oracleRaw.items && Array.isArray(err.oracleRaw.items) && err.oracleRaw.items.length > 0) {
        errorsToDisplay = err.oracleRaw.items;
      } else if (err.oracleRaw.MessageText) {
        errorsToDisplay.push({ MessageText: err.oracleRaw.MessageText });
      } else if (err.oracleRaw.message) {
        errorsToDisplay.push({ MessageText: err.oracleRaw.message });
      } else {
        errorsToDisplay.push({ MessageText: displayMessage });
      }
    } else {
      errorsToDisplay.push({ MessageText: displayMessage });
    }

    setErrors(errorsToDisplay);
  } finally {
    setLoadingErrors(false);
  }
};


  const handleNextError = () => {
    setCurrentErrorIndex(prev => Math.min(prev + 1, errors.length - 1));
  };

  const handlePreviousError = () => {
    setCurrentErrorIndex(prev => Math.max(prev - 1, 0));
  };

  const handleDownloadFailedLines = () => {
    const contentId = oracleJobSummary?.FailedLinesFileContentId;
    if (!contentId) {
      console.warn("FailedLinesFileContentId is missing for download.");
      return;
    }
    const link = `${apiEndpoint}/api/hdl/download-failed-lines/${contentId}`;
    window.open(link, '_blank');
  };

  const handleViewInOracle = () => {
    const submissionRef = oracleJobSummary?.SubmissionReference;
    if (!submissionRef) {
      console.warn("SubmissionReference is missing for viewing in Oracle.");
      return;
    }
    const baseUrl = process.env.REACT_APP_ORACLE_UI_URL || "https://ejir-test.fa.us6.oraclecloud.com";
    const url = `${baseUrl}/hcmUI/faces/FndJobStatus?submissionRef=${submissionRef}`;
    window.open(url, '_blank');
  };

  const buttonHoverActiveStyles = {
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.03)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    },
    '&:active': {
      transform: 'scale(0.97) translateY(1px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
  };

  const currentError = errors[currentErrorIndex];
  const totalErrors = errors.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        ref: dialogRef,
        sx: {
          background: '#1e1e1e',
          color: '#d4d4d4',
          fontFamily: 'monospace',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
          padding: 2,
          border: '1px solid #3c3c3c',
        }
      }}
      sx={{ zIndex: 1400 }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #3c3c3c' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ErrorOutline sx={{ color: '#ffcc00' }} />
          <AnimatedTitleText>
            Oracle Error Details
            {totalErrors > 0 && ` (${currentErrorIndex + 1} of ${totalErrors})`}
          </AnimatedTitleText>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 2, mt: 2 }}>
        {loadingErrors ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
            <CircularProgress color="warning" />
          </Box>
        ) : totalErrors > 0 && currentError ? (
          <Box sx={{
            background: '#252526',
            borderRadius: '4px',
            p: 1.5,
            borderLeft: '3px solid #ffcc00',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#569cd6' }}>
              {currentError.DatFileName && `File: ${currentError.DatFileName}`}
              {currentError.FileLine && `, Line: ${currentError.FileLine}`}
              {currentError.BusinessObjectDiscriminator && `, Object: ${currentError.BusinessObjectDiscriminator}`}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#f8f8f2' }}>
              <span style={{ color: '#f44747' }}>Error:</span> {currentError.MessageText || 'N/A'}
            </Typography>
            {currentError.MessageUserDetails && (
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#9cdcfe' }}>
                Details: {currentError.MessageUserDetails}
              </Typography>
            )}
            {currentError.ConcatenatedUserKey && (
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#9cdcfe' }}>
                User Key: {currentError.ConcatenatedUserKey}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#f8f8f2' }}>
            No specific error details found.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', pt: 2, borderTop: '1px solid #3c3c3c' }}>
        <AnimatedButton
          onClick={handlePreviousError}
          disabled={currentErrorIndex === 0 || totalErrors <= 1 || loadingErrors}
          variant="outlined"
          startIcon={<DoubleArrowIcon sx={{ transform: 'rotate(180deg)' }} />}
          sx={{
            color: '#007acc',
            borderColor: '#007acc',
            '&:hover': {
              backgroundColor: 'rgba(0, 122, 204, 0.1)',
              borderColor: '#007acc',
            },
            ...buttonHoverActiveStyles
          }}
        >
          Previous
        </AnimatedButton>
        <Stack direction="row" spacing={1}>
          {oracleJobSummary?.FailedLinesFileContentId && (
            <AnimatedButton
              variant="outlined"
              color="error"
              onClick={handleDownloadFailedLines}
              sx={buttonHoverActiveStyles}
            >
              Download Failed Lines
            </AnimatedButton>
          )}
          {oracleJobSummary?.SubmissionReference && (
            <AnimatedButton
              variant="outlined"
              color="secondary"
              onClick={handleViewInOracle}
              startIcon={<Visibility />}
              sx={buttonHoverActiveStyles}
            >
              View in Oracle
            </AnimatedButton>
          )}
          <AnimatedButton
            onClick={onClose}
            variant="contained"
            sx={{
              backgroundColor: '#007acc',
              '&:hover': {
                backgroundColor: '#005f99',
              },
              ...buttonHoverActiveStyles
            }}
          >
            Close
          </AnimatedButton>
        </Stack>
        <AnimatedButton
          onClick={handleNextError}
          disabled={currentErrorIndex === totalErrors - 1 || totalErrors <= 1 || loadingErrors}
          variant="outlined"
          endIcon={<DoubleArrowIcon />}
          sx={{
            color: '#007acc',
            borderColor: '#007acc',
            '&:hover': {
              backgroundColor: 'rgba(0, 122, 204, 0.1)',
              borderColor: '#007acc',
            },
            ...buttonHoverActiveStyles
          }}
        >
          Next
        </AnimatedButton>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDetailsDialog;
