import React, { useState, useEffect, useRef, use } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, CircularProgress,
  Box, Chip, Stack, Fade, Slide, Grid, Divider, IconButton
} from '@mui/material';
import {
  CloudUpload, PlayCircle, ErrorOutline, DoneAll, Schedule, FolderZip,
  FilePresent, BackupTable, CheckCircleOutline, Visibility,
  Bolt, PauseCircleFilled, PlayCircleFilled,
  PasswordOutlined
} from '@mui/icons-material';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow'; // Import DoubleArrowIcon
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import ErrorDetailsDialog from './Trigger-Error'; // Import the new error dialog

// AnimatedButton component is now defined locally within this file
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
    // Text shuffle animation
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

    // Icon animation
    if (startIconRef.current) {
      gsap.to(startIconRef.current, {
        x: -5, // Move left
        rotation: -10, // Rotate left for back arrow
        ease: "power1.out",
        duration: 0.2,
        onComplete: () => { // Animate back to original position on completion
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
        x: 5, // Move right
        rotation: 10, // Rotate right for forward arrow
        ease: "power1.out",
        duration: 0.2,
        onComplete: () => { // Animate back to original position on completion
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
    // Text shuffle animation reset (if it hasn't completed yet)
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

    // Icon animation reset (if it hasn't completed yet)
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


const TriggerDialog = ({ open, onClose, rowData, apiEndpoint, onUpdateRow, customerName, instanceName, triggerId }) => {
  // Moved steps array inside the component to ensure scope
  const steps = [
    { label: 'Convert to ZIP', icon: <FolderZip color="primary" /> },
    { label: 'Convert ZIP to Base64', icon: <BackupTable color="primary" /> },
    { label: 'Upload to Oracle HDL', icon: <CloudUpload color="primary" /> },
    { label: 'Trigger HCM Job', icon: <PlayCircle color="primary" /> },
    { label: 'Check Job Status', icon: <Schedule color="primary" /> }
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zipFileName, setZipFileName] = useState('');
  const [base64Zip, setBase64Zip] = useState('');
  const [oracleContentId, setOracleContentId] = useState(null);
  const [oracleRequestId, setOracleRequestId] = useState(null);
  const [oracleStatus, setOracleStatus] = useState('');
  const [oracleJobSummary, setOracleJobSummary] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(0); // Changed to number for countdown
  const [countdown, setCountdown] = useState(0);
  const [openErrorDialog, setOpenErrorDialog] = useState(false); // New state for error dialog

  const [oracle_env,setoracle_env] = useState("");
  const [username, setusername] = useState("") ;
  const [password, setpassword] = useState ("");
  // States for bolt icon animation
  const [boltColor, setBoltColor] = useState('#1976d2'); // Default MUI primary color
  const [boltFilter, setBoltFilter] = useState('none');

  const statusRef = useRef();
  const confettiCanvasRef = useRef(null);
  const confettiIntervalRef = useRef(null);
  const dialogRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const boltIconRef = useRef(null); // Ref for the Box wrapping the Bolt icon
  const boltAnimation = useRef(null); // Ref to store the GSAP animation instance

  // Effect to update parent's row data
  useEffect(() => {
    if (onUpdateRow) {
      onUpdateRow(oracleContentId || 'N/A', oracleStatus || 'N/A', oracleRequestId || 'N/A', oracleJobSummary || null);
    }
  }, [oracleContentId, oracleStatus, oracleRequestId, oracleJobSummary, onUpdateRow]);



  useEffect(() => {
    if (open && boltIconRef.current) {
      boltAnimation.current = gsap.to(boltIconRef.current, {
        scale: 1.2,
        rotation: 10,
        repeat: -1,
        yoyo: true,
        duration: 0.3,
        ease: "power1.inOut",
        stagger: {
          each: 0.1,
          from: "random"
        }
      });
    } else if (!open && boltIconRef.current) {
      if (boltAnimation.current) {
        boltAnimation.current.kill();
        boltAnimation.current = null;
      }
      gsap.set(boltIconRef.current, { scale: 1, rotation: 0 });
    }
    return () => {
      if (boltAnimation.current) {
        boltAnimation.current.kill();
        boltAnimation.current = null;
      }
    };
  }, [open]);


  const clearTimers = () => {
    if (confettiIntervalRef.current) {
      clearInterval(confettiIntervalRef.current);
      confettiIntervalRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleClose = () => {
    clearTimers();
    if (onUpdateRow) {
      onUpdateRow(oracleContentId || 'N/A', oracleStatus || 'N/A', oracleRequestId || 'N/A', oracleJobSummary || null);
    }
    onClose();
  };

  const handleOpenErrorDialog = () => {
    setOpenErrorDialog(true);
  };

  const handleCloseErrorDialog = () => {
    setOpenErrorDialog(false);
  };

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setLoading(false);
      setZipFileName('');
      setBase64Zip('');
      setOracleContentId(null);
      setOracleRequestId(null);
      setOracleStatus('');
      setOracleJobSummary(null);
      setAutoPlay(false);
      setOpenErrorDialog(false); // Ensure error dialog is closed on main dialog open
      setIsCooldownActive(0);
      setCountdown(0);

      clearTimers();

      if (dialogRef.current) {
        gsap.fromTo(dialogRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      }
    }
  }, [open]);

  useEffect(() => {
    // Only apply cooldown logic for step 4 (Check Job Status)
    if (activeStep === steps.length - 1) { // This is step 4
      // Only start cooldown if there's no ongoing polling or error
      if (!loading && oracleStatus === '') {
        setIsCooldownActive(10); // Set cooldown duration to 10 seconds
        setCountdown(10);

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }

        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              setIsCooldownActive(0); // End cooldown
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        if (cooldownTimerRef.current) {
          clearTimeout(cooldownTimerRef.current);
        }

        cooldownTimerRef.current = setTimeout(() => {
          setIsCooldownActive(0); // End cooldown
          cooldownTimerRef.current = null;
          setCountdown(0);
          // After cooldown, if still on step 4 and not loading, re-run polling
          if (activeStep === steps.length - 1 && !loading && !oracleStatus) {
            performPolling();
          }
        }, 10000); // 10 seconds
      }
    } else { // Reset cooldown if not on the last step
      setIsCooldownActive(0);
      setCountdown(0);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }
  }, [activeStep, loading, oracleStatus]); // Depend on activeStep, loading, oracleStatus

  useEffect(() => {
    if (autoPlay && activeStep < steps.length && !loading && !oracleStatus && isCooldownActive === 0) {
      handleNext();
    }
  }, [activeStep, autoPlay, loading, oracleStatus, isCooldownActive]);

  const getColorForStatus = (status) => {
    const val = (status || '').toUpperCase();
    if (val.includes('ERROR') || val === 'FAILED') return 'error';
    if (val.includes('WARNING')) return 'warning';
    if (val.includes('COMPLETED') || val === 'SUCCESS') return 'success';
    if (val.includes('READY') || val.includes('IN_PROGRESS')) return 'info';
    return 'default';
  };

  const triggerConfetti = () => {
    if (!confettiCanvasRef.current) return;
    const instance = confetti.create(confettiCanvasRef.current, { resize: true, useWorker: true });

    if (confettiIntervalRef.current) return;

    confettiIntervalRef.current = setInterval(() => {
      instance({ particleCount: 150, spread: 200, origin: { y: 0.6 }});
    }, 800);
  };

  const handleNext = async () => {
    setLoading(true);
    setOracleStatus(''); // Clear status when starting a new step or retry to avoid stale display

    // If we are on the last step and have a request ID, we are polling or retrying polling
    if (activeStep === steps.length - 1 && oracleRequestId) {
      // This block handles the cooldown before polling again
      setIsCooldownActive(10); // Set cooldown duration to 10 seconds
      setCountdown(10);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setIsCooldownActive(0); // End cooldown
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      cooldownTimerRef.current = setTimeout(() => {
        setIsCooldownActive(0); // End cooldown
        cooldownTimerRef.current = null;
        setCountdown(0);
        // After cooldown, if still on step 4 and not loading, re-run polling
        if (activeStep === steps.length - 1 && !loading && !oracleStatus) {
          performPolling();
        }
      }, 10000); // 10 seconds
      return; // Exit to let cooldown timer handle the next action
    }

    try {
      const datFileName = rowData.fileName;
      const componentName = rowData.component;
      const bundleGroup = rowData.group;

      let zipFileNameToUse = `${datFileName.replace(/\.dat$/i, '')}.zip`;

      switch (activeStep) {
        case 0: {
          const formData = new FormData();
          formData.append('fileName', datFileName);
          formData.append('componentName', componentName);
          formData.append('group', bundleGroup);

          const res = await fetch(`${apiEndpoint}/api/hdl/zip-dat`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error during ZIP conversion.' }));
            throw new Error(`ZIP conversion failed: ${res.status} ${res.statusText} - ${errorData.message}`);
          }

          const contentDisposition = res.headers.get('content-disposition');
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="([^"]+)"|filename=([^;]+)/);
            if (match && (match[1] || match[2])) {
              zipFileNameToUse = match[1] || match[2];
              setZipFileName(zipFileNameToUse);
            } else {
              console.warn("Filename pattern not found in content-disposition header:", contentDisposition);
              setZipFileName(zipFileNameToUse);
            }
          } else {
            console.warn("Content-Disposition header not found in response for ZIP conversion.");
            setZipFileName(zipFileNameToUse);
          }

          setActiveStep(prev => prev + 1);
          break;
        }
        case 1: {
          const formData = new FormData();
          formData.append('fileName', zipFileName);
          const res = await fetch(`${apiEndpoint}/api/hdl/zip-to-base64-by-name`, { method: 'POST', body: formData });
          const result = await res.json();

          if (!res.ok || !result.content) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error during Base64 conversion.' }));
            throw new Error(`Base64 conversion failed: ${res.status} ${res.statusText} - ${errorData.message || 'Missing content'}`);
          }
          setBase64Zip(result.content);
          setActiveStep(prev => prev + 1);
          break;
        }
        case 2: {
          const payload = { 
            content: base64Zip, 
            fileName: zipFileName, 
            contentId: null, 
            fileEncryption: "NONE", 
            customerName: customerName, 
            instanceName: instanceName 
          };

          const res = await fetch(`${apiEndpoint}/api/hdl/upload-to-oracle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const result = await res.json();
          console.log("Upload-to-Oracle raw response:", result);  // 🔍 for debugging

          const contentId = result?.response_text?.result?.ContentId;
          const status = result?.response_text?.result?.Status;

          // also capture env creds if available
          const envCreds = result?.env_creds || {};
          setoracle_env(envCreds.oracle_env || "");
          setusername(envCreds.username || "");
          setpassword(envCreds.password || "");

          if (!res.ok || !["SUCCESS"].includes((status || "").toUpperCase()) || !contentId) {
            throw new Error(`Oracle upload failed: ${status || 'ContentId missing'}. Details: ${JSON.stringify(result)}`);
          }

          setOracleContentId(contentId);
          setActiveStep(prev => prev + 1);
          break;
        }
        case 3: {
          const payload = {
            customerName,   
            instanceName,    
            contentId: oracleContentId,  
            dataSetName: zipFileName,    
            fileAction: "IMPORT_AND_LOAD",
            fileEncryption: "NONE" 
          };

          const res = await fetch(`${apiEndpoint}/api/hdl/trigger-oracle-job`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await res.json();
          const requestId = result.RequestId;

          if (!res.ok || !requestId) {
            throw new Error(
              `Trigger failed or missing RequestId. Details: ${JSON.stringify(result)}`
            );
          }

          setOracleRequestId(requestId);
          setActiveStep((prev) => prev + 1);
          break;
        }
        case 4: {
          await performPolling();
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error("Operation failed:", err);
      setOracleStatus('ERROR');
      setAutoPlay(false);
      setOpenErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const performPolling = async () => {
    setLoading(true);
    setOracleStatus('');
    try {
      let attempts = 0;
      let status = '';
      const maxAttempts = 30;
      const pollInterval = 5000;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, pollInterval));
        const pollUrl = `${apiEndpoint}/api/hdl/status/${customerName}/${instanceName}/${oracleRequestId}`;
        const pollRes = await fetch(pollUrl);

        if (!pollRes.ok) {
          const errorData = await pollRes.json().catch(() => ({ message: 'Unknown error during status polling.' }));
          setOracleStatus('ERROR');
          setOpenErrorDialog(true); 
          setLoading(false);
          return;
        }

        const pollData = await pollRes.json();
        const oracleRaw = pollData.oracle_response || pollData;

        setOracleJobSummary(oracleRaw);
        status = oracleRaw?.DataSetStatusCode || oracleRaw?.Status || 'UNKNOWN';
        setOracleStatus(status); 

        if (['COMPLETED', 'ORA_SUCCESS', 'SUCCESS'].includes(status)) {
          setOracleStatus('COMPLETED');
          triggerConfetti();
          setLoading(false);
          return;
        } else if (["ERROR", "ORA_IN_ERROR", "FAILED", "WARNING"].includes(status)) {
          setOracleStatus('ERROR');
          setOpenErrorDialog(true); 
          setLoading(false);
          return;
        }
        attempts++;
      }
      setOracleStatus('TIMEOUT');
      setOpenErrorDialog(true); 
      setLoading(false);
      return;
    } catch (err) {
      console.error("Polling failed:", err);
      setOracleStatus('ERROR');
      setOpenErrorDialog(true); 
    } finally {
      setLoading(false);
    }
  };


  const handleRetryPolling = () => {
    setOracleStatus('');
    setOpenErrorDialog(false); // Close error dialog if open
    setIsCooldownActive(0);
    setCountdown(0);
    // Directly call performPolling as we are already on step 4 and have requestId
    performPolling();
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

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          ref: dialogRef,
          sx: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.62))',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
            padding: 2,
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }
        }}
      >
        <canvas ref={confettiCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                ref={boltIconRef}
                onMouseEnter={() => {
                  if (boltAnimation.current) boltAnimation.current.pause(); // Pause initial animation
                  setBoltColor('gold');
                  setBoltFilter('drop-shadow(0 0 4px gold) drop-shadow(0 0 8px gold)');
                  gsap.to(boltIconRef.current, { // Apply hover animation
                    scale: 1.3,
                    rotation: 15,
                    duration: 0.2,
                    ease: "power1.out"
                  });
                }}
                onMouseLeave={() => {
                  setBoltColor('#1976d2'); // Reset to original primary color
                  setBoltFilter('none');
                  gsap.to(boltIconRef.current, { // Animate back to original scale/rotation
                    scale: 1,
                    rotation: 0,
                    duration: 0.2,
                    ease: "power1.out",
                    onComplete: () => {
                      if (boltAnimation.current) boltAnimation.current.resume(); // Resume initial animation
                    }
                  });
                }}
                sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              >
                <Bolt sx={{ color: boltColor, filter: boltFilter }}/>
              </Box>
              <AnimatedTitleText>
                {`Trigger HDL Job – ${rowData.component} (${rowData.group})`}
              </AnimatedTitleText>
            </Stack>
            <IconButton
              onClick={() => setAutoPlay(prev => !prev)}
              title={autoPlay ? "Pause Autoplay" : "Start Autoplay"}
              sx={buttonHoverActiveStyles}
            >
              {autoPlay ? <PauseCircleFilled color="warning" /> : <PlayCircleFilled color="success" />}
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} justifyContent="space-around">
            {steps.map((step, index) => (
              <Grid item key={index}>
                <Stack direction="column" alignItems="center" spacing={1}>
                  <Fade in={activeStep >= index}>
                    <div>
                      {activeStep > index ? <DoneAll color="success" /> : step.icon}
                    </div>
                  </Fade>
                  <Typography
                    variant={activeStep === index ? 'subtitle1' : 'body2'}
                    fontWeight={activeStep === index ? 'bold' : 'normal'}
                    color={activeStep === index ? 'primary' : 'textSecondary'}
                  >
                    {step.label}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" mt={5} textAlign="center" fontWeight="bold" minHeight={20}>
            {activeStep === 0 && `Preparing to zip file: ${rowData.fileName}`}
            {activeStep === 1 && `Encoding ${zipFileName} to Base64...`}
            {activeStep === 2 && `Uploading ZIP to Oracle HDL: ${zipFileName}`}
            {activeStep === 3 && `Triggering HDL job with Content ID: ${oracleContentId || 'N/A'}`}
            {activeStep === 4 && `Polling status for Request ID: ${oracleRequestId || 'N/A'}`}
          </Typography>

          <Slide direction="up" in={true} mountOnEnter unmountOnExit>
            <Box mt={2} ref={statusRef} textAlign="center">
              {/* Only show status for COMPLETED or TIMEOUT */}
              {oracleStatus === 'COMPLETED' && (
                <Typography mb={2} color="success.main" fontWeight="bold">
                  <CheckCircleOutline sx={{ verticalAlign: 'middle', mr: 0.5 }} fontSize="small" /> Oracle HDL Status: COMPLETED
                </Typography>
              )}
              {oracleStatus === 'TIMEOUT' && (
                <Typography mb={2} color="warning.main" fontWeight="bold">
                  <ErrorOutline sx={{ verticalAlign: 'middle', mr: 0.5 }} fontSize="small" /> Oracle HDL Status: TIMEOUT
                </Typography>
              )}
            </Box>
          </Slide>

          {activeStep === 4 && oracleJobSummary && (
            <Fade in={true} timeout={600}>
              <Box
                mt={3} p={2} borderRadius={4}
                sx={{
                  background: 'rgba(240, 245, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" mb={1}><FilePresent fontSize="small" /> Oracle Job Summary</Typography>
                <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
                  <Chip label={oracleJobSummary?.DataSetStatusMeaning || 'N/A'} color={getColorForStatus(oracleJobSummary?.DataSetStatusCode)} />
                  <Chip label={`Import: ${oracleJobSummary?.ImportStatusMeaning || 'N/A'}`} color={getColorForStatus(oracleJobSummary?.ImportStatusCode)} />
                  <Chip label={`Load: ${oracleJobSummary?.LoadStatusMeaning || 'N/A'}`} color={getColorForStatus(oracleJobSummary?.LoadStatusCode)} />
                </Stack>
                <Typography variant="body2"><strong>File:</strong> {oracleJobSummary?.DataSetName || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Content ID:</strong> {oracleJobSummary?.ContentId || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Request ID:</strong> {oracleJobSummary?.RequestId || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Success :</strong> {oracleJobSummary?.ImportSuccessPercentage !== undefined ? `${oracleJobSummary.ImportSuccessPercentage}%` : 'N/A'}</Typography>
                <Typography variant="body2"><strong>Created by:</strong> {oracleJobSummary?.CreatedBy || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Timestamp:</strong> {oracleJobSummary?.CreationDate ? new Date(oracleJobSummary.CreationDate).toLocaleString() : 'N/A'}</Typography>
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
                  {(oracleStatus === 'ERROR' || oracleStatus === 'TIMEOUT') && (
                    <AnimatedButton
                      variant="outlined"
                      color="warning"
                      onClick={handleOpenErrorDialog} // Call the new error dialog
                      disabled={!oracleRequestId}
                      sx={buttonHoverActiveStyles}
                    >
                      Check Oracle Errors
                    </AnimatedButton>
                  )}
                </Stack>
              </Box>
            </Fade>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <AnimatedButton
            onClick={handleClose}
            disabled={loading}
            sx={buttonHoverActiveStyles}
          >
            {oracleStatus ? 'Close' : 'Cancel'}
          </AnimatedButton>
          <Stack direction="row" spacing={1}>
            {(oracleStatus === 'ERROR' || oracleStatus === 'TIMEOUT') && (
              <AnimatedButton
                onClick={handleRetryPolling}
                variant="outlined"
                color="info"
                disabled={loading || isCooldownActive > 0} // Disable if loading or cooldown active
                sx={buttonHoverActiveStyles}
              >
                {isCooldownActive > 0 ? `Retry (${countdown})` : 'Retry'}
              </AnimatedButton>
            )}
            {!oracleStatus && (
            <AnimatedButton
              onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
              disabled={activeStep === 0 || loading}
              variant="outlined"
              startIcon={<DoubleArrowIcon sx={{ transform: 'rotate(180deg)' }} />} // Rotated for 'Previous'
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
              Back
            </AnimatedButton>
            )}
            {activeStep < steps.length && !oracleStatus && (
              <AnimatedButton
                onClick={handleNext}
                variant="contained"
                disabled={loading || (activeStep === steps.length - 1 && isCooldownActive > 0)}
                sx={buttonHoverActiveStyles}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : activeStep === steps.length - 1 ? (
                  isCooldownActive > 0 ? `Check Status (${countdown})` : 'Check Status'
                ) : (
                  'Next'
                )}
              </AnimatedButton>
            )}
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Render the new ErrorDetailsDialog */}
      {openErrorDialog && (
        <ErrorDetailsDialog
          open={openErrorDialog}
          onClose={handleCloseErrorDialog}
          apiEndpoint={apiEndpoint}
          oracleRequestId={oracleRequestId}
          oracleJobSummary={oracleJobSummary}
          customerName={customerName}
          instanceName={instanceName}
        />
      )}
    </>
  );
};

export default TriggerDialog;
