import React, { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(5),
    width: '100%',
    maxWidth: 600,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.shape.borderRadius * 4,
    boxShadow: theme.shadows[4],
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        maxWidth: '95%',
    },
}));

const LookupDataLoad = ({ level1Parent, level2Parent }) => {
    const [isLookupLoading, setIsLookupLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const apiEndPoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

    const handleLookupDataLoad = async () => {
        if (!level1Parent || !level2Parent) {
            setSnackbar({ open: true, message: "Customer and Instance names are required for this action.", severity: "warning" });
            return;
        }

        setIsLookupLoading(true);

        const payload = {
            customerName: level1Parent,
            instanceName: level2Parent,
        };

        try {
            const response = await fetch(`${apiEndPoint}/api/hdl/oracle_fetch/lookupdataload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setSnackbar({ open: true, message: result.results || "Lookup data loaded successfully!", severity: "success" });
            } else {
                setSnackbar({ open: true, message: result.detail || "Failed to load lookup data.", severity: "error" });
            }
        } catch (error) {
            console.error("Error fetching lookup data:", error);
            setSnackbar({ open: true, message: "Network error or server unreachable. Could not load lookup data.", severity: "error" });
        } finally {
            setIsLookupLoading(false);
        }
    };

    const handleCloseSnackbar = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            bgcolor: 'background.default',
            py: { xs: 2, sm: 4, md: 6 },
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <StyledPaper elevation={3}>
                <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Lookup Data Load
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                        This action will load lookup data directly from the Oracle API for the selected instance. Click the button below to initiate the process.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLookupDataLoad}
                        disabled={isLookupLoading || !level1Parent || !level2Parent}
                        sx={{ mt: 2 }}
                        startIcon={isLookupLoading ? <CircularProgress size={20} color="inherit" /> : <CloudDownloadIcon />}
                    >
                        {isLookupLoading ? "Loading..." : "Load Lookup Data"}
                    </Button>
                </Box>
            </StyledPaper>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LookupDataLoad;
