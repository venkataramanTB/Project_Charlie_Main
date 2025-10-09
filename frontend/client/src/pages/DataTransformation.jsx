import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { gsap } from "gsap";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  createTheme, // Import createTheme
  ThemeProvider, // Import ThemeProvider
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";

// Define a custom theme for Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A standard blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e', // A standard red
      light: '#ff336e',
      dark: '#9a0036',
      contrastText: '#fff',
    },
    blue: { // Custom blue for the upload button
      500: '#3f51b5',
      600: '#303f9f',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h5: {
      fontSize: '1.8rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded corners for buttons
          textTransform: 'none', // Prevent uppercase text
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // Smooth transition for hover effects
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          borderRadius: 12, // More rounded corners for the main container
        },
      },
    },
  },
});

// Styled component for the visually hidden file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DataTransformation = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info"); // 'success', 'error', 'warning', 'info'

  const componentRef = useRef(null); // Ref for GSAP animation target
  const uploadButtonRef = useRef(null); // Ref for the upload button
  const transformButtonRef = useRef(null); // Ref for the transform button
  const fileNameRef = useRef(null); // Ref for the file name typography

  // Define the API endpoint
  const apiendpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

  // GSAP animation on component mount
  useEffect(() => {
    gsap.fromTo(
      componentRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
  }, []);

  // GSAP animation for button hovers
  useEffect(() => {
    // Using gsap.context for better animation management and cleanup
    const ctx = gsap.context(() => {
      // Upload Button Hover animations
      const uploadButtonHover = gsap.to(uploadButtonRef.current, {
        scale: 1.05,
        boxShadow: "0px 6px 12px rgba(0,0,0,0.2)",
        duration: 0.2,
        paused: true,
      });

      // Transform Button Hover animations
      const transformButtonHover = gsap.to(transformButtonRef.current, {
        scale: 1.05,
        boxShadow: "0px 6px 12px rgba(0,0,0,0.2)",
        duration: 0.2,
        paused: true,
      });

      // Attach mouse enter/leave events
      if (uploadButtonRef.current) {
        uploadButtonRef.current.onmouseenter = () => uploadButtonHover.play();
        uploadButtonRef.current.onmouseleave = () => uploadButtonHover.reverse();
      }
      if (transformButtonRef.current) {
        transformButtonRef.current.onmouseenter = () => transformButtonHover.play();
        transformButtonRef.current.onmouseleave = () => transformButtonHover.reverse();
      }

    }, [uploadButtonRef, transformButtonRef]); // Dependencies for the context

    return () => ctx.revert(); // Clean up GSAP animations on unmount
  }, []);

  // GSAP animation for file name display when a file is selected
  useEffect(() => {
    if (file && fileNameRef.current) {
      gsap.fromTo(
        fileNameRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, [file]);


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSnackbarMessage(`File selected: ${e.target.files[0].name}`);
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    } else {
      setFile(null);
      setSnackbarMessage("No file selected.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setSnackbarMessage("Please select a file first!");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true); // Start loading
    const formData = new FormData();
    formData.append("excel_file", file);

    try {
      const response = await axios.post(`${apiendpoint}/convert-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob", // Expect Excel file as response
      });

      // Download the transformed file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Transformed_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the object URL

      setSnackbarMessage("File transformed and downloaded successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setFile(null); // Clear selected file after successful upload

      // Animate border color to green on success, then back to original
      gsap.to(componentRef.current, {
        borderColor: "#4CAF50", // Green for success
        duration: 0.5,
        repeat: 1, // Flash once
        yoyo: true, // Go back and forth
        onComplete: () => gsap.to(componentRef.current, { borderColor: theme.palette.grey[300], duration: 0.5 }),
      });

    } catch (error) {
      console.error("Upload failed:", error);
      let errorMessage = "Something went wrong during upload!";
      if (error.response && error.response.data) {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const errorJson = JSON.parse(e.target.result);
            errorMessage = errorJson.detail || errorJson.message || errorMessage;
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
          } catch (parseError) {
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
          }
        };
        reader.readAsText(error.response.data);
      } else {
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

      // Animate border color to red on error, then back to original
      gsap.to(componentRef.current, {
        borderColor: "#F44336", // Red for error
        duration: 0.5,
        repeat: 1, // Flash once
        yoyo: true, // Go back and forth
        onComplete: () => gsap.to(componentRef.current, { borderColor: theme.palette.grey[300], duration: 0.5 }),
      });

    } finally {
      setLoading(false); // End loading
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box
      ref={componentRef}
      sx={{
        p: 4,
        border: 1,
        borderColor: "grey.300",
        borderRadius: 2,
        boxShadow: 3,
        width: { xs: '90%', sm: '70%', md: '50%', lg: '40%' }, // Responsive width
        mx: "auto",
        mt: 5,
        textAlign: "center",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
        position: 'relative', // Needed for absolute positioning of potential inner elements
        zIndex: 1, // Ensure the content box is above the background animation
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        📥 Upload Excel for Transformation
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select an .xlsx or .xls file to transform.
      </Typography>

      <Button
        ref={uploadButtonRef} // Attach ref
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        disabled={loading}
        sx={{
          bgcolor: 'blue.500', // Custom blue color from theme
          '&:hover': {
            bgcolor: 'blue.600',
          },
        }}
        // Mouse events are now handled by GSAP context in useEffect
      >
        {file ? file.name : "Choose File"}
        <VisuallyHiddenInput type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      </Button>

      {file && (
        <Typography ref={fileNameRef} variant="body1" sx={{ mt: 1, color: 'text.primary' }}>
          Selected: <span className="font-semibold">{file.name}</span>
        </Typography>
      )}

      <Button
        ref={transformButtonRef} // Attach ref
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || loading}
        sx={{ mt: 2, py: 1.5, px: 4, fontSize: '1.1rem' }}
        // Mouse events are now handled by GSAP context in useEffect
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Upload & Transform"}
      </Button>
    </Box>
  );
};

export default DataTransformation;