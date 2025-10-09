import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    TextField,
    Typography,
    Box,
    Paper,
    Avatar,
    Snackbar,
    Alert,
    Chip,
    Stack,
    IconButton,
    CircularProgress,
    Grid,
    Stepper,
    Step,
    StepLabel,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import WorkIcon from '@mui/icons-material/Work';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Function to define the steps in the wizard
const getSteps = () => [
    'Action Code Setup',
    'Assignment Status Setup',
    'Review and Save',
];

const Setup = ({ onSetupComplete, level1Parent, level2Parent }) => {
    const [activeStep, setActiveStep] = useState(0);
    const steps = getSteps();

    // Ref for the main paper component
    const paperRef = useRef(null);

    // State for managing action codes (Hire, Term, etc.)
    const [hireActions, setHireActions] = useState([]);
    const [newHireActionInput, setNewHireActionInput] = useState("");
    const [termActions, setTermActions] = useState([]);
    const [newTermActionInput, setNewTermActionInput] = useState("");
    const [globalTransferActions, setGlobalTransferActions] = useState([]);
    const [newGlobalTransferActionInput, setNewGlobalTransferActionInput] = useState("");
    const [rehireActions, setRehireActions] = useState([]);
    const [newRehireActionInput, setNewRehireActionInput] = useState("");

    // State for managing assignment status rules
    const [statusType1, setStatusType1] = useState("");
    const [statusType2, setStatusType2] = useState("");
    const [statusType3, setStatusType3] = useState("");
    const [statusType4, setStatusType4] = useState("");
    const [statusType5] = useState("Else");
    const [statusType6, setStatusType6] = useState("");

    // Loading states for API calls to prevent double-submission and provide feedback
    const [isSaving, setIsSaving] = useState(false);
    const [isLookupLoading, setIsLookupLoading] = useState(false);
    const [isFetchingSetupData, setIsFetchingSetupData] = useState(true);
    const [isLookupDataAvailable, setIsLookupDataAvailable] = useState(false);
    const [isMandatoryFieldsAvailable, setIsMandatoryFieldsAvailable] = useState(false);
    const [isCheckingMandatoryFields, setIsCheckingMandatoryFields] = useState(false);
    const [isMandatoryLoading, setIsMandatoryLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);



    // Snackbar state for displaying messages to the user
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // API endpoint from environment variables with a fallback
    const apiEndPoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

    const navigate = useNavigate();

    // Helper function to handle adding a new action code chip
    const handleAddAction = (setActions, inputValue, setInput) => {
        if (inputValue.trim() !== "") {
            setActions(prev => {
                const newActions = [...prev, inputValue.trim().toUpperCase()];
                return Array.from(new Set(newActions));
            });
            setInput("");
        }
    };

    // Helper function to handle removing an action code chip
    const handleRemoveAction = (setActions, actionToRemove) => {
        setActions(prev => prev.filter(action => action !== actionToRemove));
    };

    // Helper function to check for lookup data availability
const checkLookupDataAvailability = async () => {
    try {
        const response = await fetch(`${apiEndPoint}/api/lookupdata/available`);
        const data = await response.json();
        const files = data.files || [];

        if (level1Parent && level2Parent) {
            // expected file name pattern like "General_Test"
            const expectedPrefix = `${level1Parent}_${level2Parent}`.toLowerCase();

            // check if any available file includes the pattern
            const found = files.some(file =>
                file.toLowerCase().includes(expectedPrefix)
            );

            return found; // true → available, false → not available
        }

        return false;
    } catch (error) {
        console.error("Error checking lookup data availability:", error);
        return false;
    }
};



useEffect(() => {
    const fetchData = async () => {
        const isAvailable = await checkLookupDataAvailability();
        setIsLookupDataAvailable(isAvailable);
        setSnackbar({
            open: true,
            message: isAvailable
                ? "Lookup data already available for this customer/instance."
                : "Lookup data not available. Please load it first.",
            severity: isAvailable ? "success" : "warning"
        });
    };
    fetchData();
}, [apiEndPoint, level1Parent, level2Parent]);


    // Main function to save all setup data to the backend
    const handleSaveAllSetup = async (e) => {
        e.preventDefault();

        if (!level1Parent || !level2Parent) {
            setSnackbar({ open: true, message: "Customer and Instance names are required.", severity: "error" });
            return;
        }

        setIsSaving(true);

        const assignmentStatusRules = [
            { key: "if", value: statusType1, result: statusType2 },
            { key: "else if", value: statusType3, result: statusType4 },
            { key: "else", value: statusType5, result: statusType6 },
        ];

        const payload = {
            customerName: level1Parent,
            instanceName: level2Parent,
            hireActions: hireActions,
            rehireActions: rehireActions,
            termActions: termActions,
            globalTransferActions: globalTransferActions,
            statusTypes: [statusType1, statusType2, statusType3, statusType4, statusType5, statusType6],
            assignmentStatusRules: assignmentStatusRules,
        };

        try {
            const response = await fetch(`${apiEndPoint}/api/hdl/save-setup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setSnackbar({ open: true, message: result.message || "Setup saved successfully!", severity: "success" });
                setIsSaved(true);
                if (onSetupComplete) {
                    onSetupComplete(payload);
                }
            } else {
                setSnackbar({ open: true, message: result.detail || "Failed to save setup.", severity: "error" });
            }
        } catch (error) {
            console.error("Error saving setup:", error);
            setSnackbar({ open: true, message: "Network error or server unreachable. Please try again.", severity: "error" });
        } finally {
            setIsSaving(false);
        }
    };

// Function to handle the lookup data API call
const handleLookupDataLoad = async () => {
    if (!level1Parent || !level2Parent) {
        setSnackbar({ open: true, message: "Customer and Instance names are required for this action.", severity: "warning" });
        return;
    }

    setIsLookupLoading(true);

    const payload = { customerName: level1Parent, instanceName: level2Parent };

    try {
        const response = await fetch(`${apiEndPoint}/api/hdl/oracle_fetch/lookupdataload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
            setSnackbar({ open: true, message: result.results || "Lookup data loaded successfully!", severity: "success" });
            setIsLookupDataAvailable(true);
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

const handleMandatoryFieldsCheck = async () => {
    if (!level1Parent || !level2Parent) {
        setSnackbar({ open: true, message: "Customer and Instance names are required for this action.", severity: "warning" });
        return;
    }

    setIsMandatoryLoading(true);

    const payload = { customerName: level1Parent, instanceName: level2Parent };

    try {
        const response = await fetch(`${apiEndPoint}/api/hdl/oracle_fetch/mandatoryFields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
            setSnackbar({ open: true, message: result.results || "Mandatory fields data loaded successfully!", severity: "success" });
            setIsMandatoryFieldsAvailable(true);
        } else {
            setSnackbar({ open: true, message: result.detail || "Failed to load mandatory fields data.", severity: "error" });
        }
    } catch (error) {
        console.error("Error fetching Mandatory Fields data:", error);
        setSnackbar({ open: true, message: "Network error or server unreachable. Could not load mandatory fields data.", severity: "error" });
    } finally {
        setIsMandatoryLoading(false);
    }
};

    // useEffect hook to fetch existing setup data from the backend on component load
    useEffect(() => {
        const fetchSetupData = async () => {
            if (!level1Parent || !level2Parent) {
                setHireActions([]);
                setTermActions([]);
                setGlobalTransferActions([]);
                setRehireActions([]);
                setStatusType1("");
                setStatusType2("");
                setStatusType3("");
                setStatusType4("");
                setStatusType6("");
                setIsFetchingSetupData(false);
                return;
            }

            try {
                const response = await fetch(`${apiEndPoint}/api/hdl/get-setup/${level1Parent}/${level2Parent}`);
                const data = await response.json();

                if (response.ok) {
                    setHireActions(data.hireActions || []);
                    setRehireActions(data.rehireActions || []);
                    setTermActions(data.termActions || []);
                    setGlobalTransferActions(data.globalTransferActions || []);
                    if (data.assignmentStatusRules && Array.isArray(data.assignmentStatusRules)) {
                        data.assignmentStatusRules.forEach((rule) => {
                            if (rule.key === "if") {
                                setStatusType1(rule.value || "");
                                setStatusType2(rule.result || "");
                            } else if (rule.key === "else if") {
                                setStatusType3(rule.value || "");
                                setStatusType4(rule.result || "");
                            } else if (rule.key === "else") { 
                                setStatusType6(rule.result || "");
                            }
                        });
                    }
                    // setSnackbar({ open: true, message: "Setup data loaded successfully!", severity: "success" });
                } else {
                    setHireActions([]);
                    setTermActions([]);
                    setGlobalTransferActions([]);
                    setRehireActions([]);
                    setStatusType1("");
                    setStatusType2("");
                    setStatusType3("");
                    setStatusType4("");
                    setStatusType6("");
                    // setSnackbar({ open: true, message: data.detail || "Failed to load setup data. Starting with a blank form.", severity: "info" });
                }
            } catch (error) {
                console.error("Error fetching setup data:", error);
                setHireActions([]);
                setTermActions([]);
                setGlobalTransferActions([]);
                setRehireActions([]);
                setStatusType1("");
                setStatusType2("");
                setStatusType3("");
                setStatusType4("");
                setStatusType6("");
               // setSnackbar({ open: true, message: "Network error or server unreachable. Could not load setup data.", severity: "error" });
            } finally {
                setIsFetchingSetupData(false);
            }
        };

        fetchSetupData();
    }, [level1Parent, level2Parent, apiEndPoint]);

    // Function to close the snackbar
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    // New functions to handle step navigation
    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // Function to handle clicking on a stepper step
    const handleStepClick = (stepIndex) => {
        setActiveStep(stepIndex);
    };

    // Render content based on the current step
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto' }}>
                        <Avatar
                            sx={{
                                m: 2,
                                bgcolor: 'primary.light',
                                width: '7 * 8px',
                                height: '7 * 8px',
                                boxShadow: 3,
                            }}
                        >
                            <LockOutlinedIcon />
                        </Avatar>

                        {/* Action Code Setup Section */}
                        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Action Code Setup
                        </Typography>
                        <form style={{ width: 'auto' }}>
                            {/* Hire and Rehire Actions */}
                            <Box
                                sx={{
                                    padding: 3,
                                    marginBottom: 3,
                                    width: '100%',
                                    backgroundColor: 'grey.50',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    borderRadius: 2,
                                    boxShadow: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    <WorkIcon color="primary" sx={{ fontSize: '2rem' }} />
                                    <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'medium' }}>
                                        Hiring & Rehiring Actions
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Add Hire Action"
                                        type="text"
                                        value={newHireActionInput}
                                        onChange={(e) => setNewHireActionInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddAction(setHireActions, newHireActionInput, setNewHireActionInput);
                                            }
                                        }}
                                        helperText="Type and press Enter or click '+'"
                                        size="small"
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleAddAction(setHireActions, newHireActionInput, setNewHireActionInput)}
                                        aria-label="add hire action"
                                    >
                                        <AddCircleOutlineIcon />
                                    </IconButton>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, mb: 2 }}>
                                    {hireActions.map((action) => (
                                        <Chip
                                            key={action}
                                            label={action}
                                            onDelete={() => handleRemoveAction(setHireActions, action)}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderRadius: '8px' }}
                                        />
                                    ))}
                                </Stack>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Add Rehire Action"
                                        type="text"
                                        value={newRehireActionInput}
                                        onChange={(e) => setNewRehireActionInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddAction(setRehireActions, newRehireActionInput, setNewRehireActionInput);
                                            }
                                        }}
                                        helperText="Type and press Enter or click '+'"
                                        size="small"
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleAddAction(setRehireActions, newRehireActionInput, setNewRehireActionInput)}
                                        aria-label="add rehire action"
                                    >
                                        <AddCircleOutlineIcon />
                                    </IconButton>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, mb: 2 }}>
                                    {rehireActions.map((action) => (
                                        <Chip
                                            key={action}
                                            label={action}
                                            onDelete={() => handleRemoveAction(setRehireActions, action)}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderRadius: '8px' }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            {/* Termination and Global Transfer Actions */}
                            <Box
                                sx={{
                                    padding: 3,
                                    marginBottom: 3,
                                    width: '100%',
                                    backgroundColor: 'grey.50',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    borderRadius: 2,
                                    boxShadow: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    <PersonRemoveIcon color="secondary" sx={{ fontSize: '2rem' }} />
                                    <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'medium' }}>
                                        Termination & Transfer Actions
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Add Term Action"
                                        type="text"
                                        value={newTermActionInput}
                                        onChange={(e) => setNewTermActionInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddAction(setTermActions, newTermActionInput, setNewTermActionInput);
                                            }
                                        }}
                                        helperText="Type and press Enter or click '+'"
                                        size="small"
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleAddAction(setTermActions, newTermActionInput, setNewTermActionInput)}
                                        aria-label="add term action"
                                    >
                                        <AddCircleOutlineIcon />
                                    </IconButton>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, mb: 2 }}>
                                    {termActions.map((action) => (
                                        <Chip
                                            key={action}
                                            label={action}
                                            onDelete={() => handleRemoveAction(setTermActions, action)}
                                            color="secondary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderRadius: '8px' }}
                                        />
                                    ))}
                                </Stack>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Add Global Transfer Action"
                                        type="text"
                                        value={newGlobalTransferActionInput}
                                        onChange={(e) => setNewGlobalTransferActionInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddAction(setGlobalTransferActions, newGlobalTransferActionInput, setNewGlobalTransferActionInput);
                                            }
                                        }}
                                        helperText="Type and press Enter or click '+'"
                                        size="small"
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleAddAction(setGlobalTransferActions, newGlobalTransferActionInput, setNewGlobalTransferActionInput)}
                                        aria-label="add global transfer action"
                                    >
                                        <AddCircleOutlineIcon />
                                    </IconButton>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, mb: 2 }}>
                                    {globalTransferActions.map((action) => (
                                        <Chip
                                            key={action}
                                            label={action}
                                            onDelete={() => handleRemoveAction(setGlobalTransferActions, action)}
                                            color="info"
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderRadius: '8px' }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </form>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <Avatar
                            sx={{
                                m: 2,
                                bgcolor: 'primary.light',
                                width: '7 * 8px',
                                height: '7 * 8px',
                                boxShadow: 3,
                            }}
                        >
                            <LockOutlinedIcon />
                        </Avatar>

                        {/* Assignment Status Type Setup Section */}
                        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Assignment Status Type Setup
                        </Typography>
                        <form style={{ width: '100%' }}>
                            <Box
                                sx={{
                                    padding: 3,
                                    marginBottom: 3,
                                    width: 'auto',
                                    backgroundColor: 'grey.50',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    borderRadius: 2,
                                    boxShadow: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    <SwapHorizIcon color="secondary" sx={{ fontSize: '2rem' }} />
                                    <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'medium' }}>
                                        Rule-Based Status Mapping
                                    </Typography>
                                </Box>
                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            label="If Action Code (comma-separated)"
                                            value={statusType1}
                                            onChange={(e) => setStatusType1(e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                        <ArrowRightIcon color="action" />
                                        <TextField
                                            label="Result Value"
                                            value={statusType2}
                                            onChange={(e) => setStatusType2(e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            label="Else If Action Code (comma-separated)"
                                            value={statusType3}
                                            onChange={(e) => setStatusType3(e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                        <ArrowRightIcon color="action" />
                                        <TextField
                                            label="Result Value"
                                            value={statusType4}
                                            onChange={(e) => setStatusType4(e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            label="Else Action Code"
                                            value={statusType5}
                                            disabled
                                            fullWidth
                                            size="small"
                                        />
                                        <ArrowRightIcon color="action" />
                                        <TextField
                                            label="Result Value"
                                            value={statusType6}
                                            onChange={(e) => setStatusType6(e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </Box>
                                </Stack>
                            </Box>
                        </form>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                        <Avatar
                            sx={{
                                m: 2,
                                bgcolor: 'primary.light',
                                width: '7 * 8px',
                                height: '7 * 8px',
                                boxShadow: 3,
                            }}
                        >
                            <SaveIcon />
                        </Avatar>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Review and Save
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary', maxWidth: 400 }}>
                            You have completed the setup steps. Click the button below to save all your configurations.
                        </Typography>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    // If data is still loading, show a loading indicator
    if (isFetchingSetupData) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #f0f4f7 0%, #e9edf2 100%)',
            }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                bgcolor: 'background.default',
                py: { xs: 2, sm: 4, md: 6 },
                background: 'linear-gradient(135deg, #f0f4f7 0%, #e9edf2 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {/* Header with Customer and Instance names */}
            {(level1Parent || level2Parent) && (
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 650,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 2,
                        boxShadow: 1,
                        backdropFilter: 'blur(5px)',
                        border: '1px solid',
                        borderColor: 'grey.100',
                        '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 1,
                            maxWidth: '95%',
                        },
                    }}
                >
                    <Box>
                        {level1Parent && (
                            <Typography
                                variant="h6"
                                component="h1"
                                sx={{
                                    fontWeight: 'bold',
                                    color: 'primary.main',
                                }}
                            >
                                Customer: {level1Parent}
                            </Typography>
                        )}
                        {level2Parent && (
                            <Typography variant="body1" component="h2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Instance: {level2Parent}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                            Configure your application settings
                        </Typography>
                    </Box>
                </Box>
            )}
            <Grid container spacing={3} justifyContent="center" sx={{ mb: 12 }}>
            {/* Lookup Data Load */}
            <Grid item xs={12} md={12}>
                <Paper
                elevation={3}
                sx={{
                    p: 4,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 3,
                    boxShadow: 4,
                    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                    "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 8,
                    },
                }}
                >
                <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
                    Lookup Data Load
                    </Typography>
                    <Typography
                    variant="body1"
                    align="center"
                    sx={{ mb: 4, color: "text.secondary", maxWidth: 400, mx: "auto" }}
                    >
                    This action will load lookup data directly from the Oracle API for the selected instance.
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                    <Grid item>
                        <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLookupDataLoad}
                        disabled={isLookupLoading || !level1Parent || !level2Parent || isLookupDataAvailable}
                        startIcon={
                            isLookupLoading ? (
                            <CircularProgress size={20} color="inherit" />
                            ) : (
                            <CloudDownloadIcon />
                            )
                        }
                        >
                        {isLookupLoading
                            ? "Loading..."
                            : isLookupDataAvailable
                            ? "Lookup Loaded Already"
                            : "Load Lookup Data"}
                        </Button>
                    </Grid>
                    {isLookupDataAvailable && (
                        <Grid item>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleLookupDataLoad}
                            disabled={isLookupLoading}
                            startIcon={<RefreshIcon />}
                        >
                            Reload Data
                        </Button>
                        </Grid>
                    )}
                    </Grid>
                </Box>
                </Paper>
            </Grid>

            {/* Mandatory Fields Load */}
            <Grid item xs={12} md={6}>
                <Paper
                elevation={3}
                sx={{
                    p: 4,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 3,
                    boxShadow: 4,
                    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                    "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 8,
                    },
                }}
                >
                <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
                    Mandatory Fields Load
                    </Typography>
                    <Typography
                    variant="body1"
                    align="center"
                    sx={{ mb: 4, color: "text.secondary", maxWidth: 400, mx: "auto" }}
                    >
                    This action will check if mandatory fields configuration is available for the selected
                    instance.
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                    <Grid item>
                        <Button
                        variant="contained"
                        color="primary"
                        onClick={handleMandatoryFieldsCheck}
                        disabled={isMandatoryLoading || !level1Parent || !level2Parent || isMandatoryFieldsAvailable}
                        startIcon={
                            isMandatoryLoading ? (
                            <CircularProgress size={20} color="inherit" />
                            ) : (
                            <CloudDownloadIcon />
                            )
                        }
                        >
                        {isMandatoryLoading
                            ? "Loading..."
                            : isMandatoryFieldsAvailable
                            ? "Mandatory Fields Loaded"
                            : "Load Mandatory Fields"}
                        </Button>
                    </Grid>
                    {isMandatoryFieldsAvailable && (
                        <Grid item>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleMandatoryFieldsCheck}
                            disabled={isMandatoryLoading}
                            startIcon={<RefreshIcon />}
                        >
                            Reload Data
                        </Button>
                        </Grid>
                    )}
                    </Grid>
                </Box>
                </Paper>
            </Grid>
            </Grid>

            <Paper
                ref={paperRef}
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 650,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 3,
                    boxShadow: 4,
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 8,
                    },
                    '@media (max-width: 600px)': {
                        p: 2,
                        maxWidth: '95%',
                    },
                }}
            >
                <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label} onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {getStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                        color="primary"
                        startIcon={<NavigateBeforeIcon />}
                    >
                        Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                    <Button
                        variant="contained"
                        color={isSaved ? "success" : "primary"}
                        onClick={handleSaveAllSetup}
                        disabled={isSaving || isFetchingSetupData || isSaved}
                        endIcon={
                            isSaved 
                                ? <CheckCircleIcon /> 
                                : isSaving 
                                    ? <CircularProgress size={18} color="inherit" /> 
                                    : <SaveIcon />
                        }
                    >
                        {isSaved 
                            ? "Saved Successfully" 
                            : isSaving 
                                ? "Saving..." 
                                : "Save All Setup Data"}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        endIcon={<NavigateNextIcon />}
                    >
                        Next
                    </Button>
                )}

                </Box>
            </Paper>
        </Box>
    );
};

export default Setup;
