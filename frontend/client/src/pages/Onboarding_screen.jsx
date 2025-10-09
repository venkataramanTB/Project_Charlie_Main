import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, TextField, Typography, Snackbar, Alert, Box, IconButton, Chip, CircularProgress, Divider, Stepper, Step, StepLabel, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { motion, AnimatePresence } from "framer-motion";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { gsap } from "gsap";
import { InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// A custom Material-UI theme for a polished look and consistent styling.
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  palette: {
    primary: { main: '#1A237E' },
    secondary: { main: '#FFD700' },
    background: { default: '#f0f2f5' },
    text: { primary: '#333333', secondary: '#666666' },
    success: { main: '#4caf50' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' },
          transition: 'all 0.3s ease-out',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          backgroundColor: '#ffffffee',
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            transition: 'border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&.Mui-focused fieldset': {
              borderColor: '#1A237E !important',
              boxShadow: '0 0 0 3px rgba(26, 35, 126, 0.08)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&.MuiChip-clickable': { '&:hover': { backgroundColor: '#e0e0e0' } },
        },
      },
    },
  },
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 }
  }
};

const initialInstanceDetailState = {
  id: null,
  instanceName: '',
  oracleUrl: '',
  oracleUsername: '',
  oraclePassword: '',
};

// Moved the StepContent component outside of OnboardingScreen to prevent re-creation
// and fix the cursor issue. We also use React.memo for performance optimization.
const StepContent = React.memo(({
  activeStep,
  newCustomerNameInput,
  setNewCustomerNameInput,
  handleAddNewCustomerName,
  savedCustomers,
  currentCustomer,
  isCustomerComplete,
  handleSelectCustomer,
  handleRemoveCustomer,
  handleNext,
  handleBack,
  handleSaveInstanceDetails,
  handleRemoveInstanceFromCustomer,
  handleFinalizeAndStart,
  isLoading,
  showSnackbar, // Prop passed from OnboardingScreen
}) => {
  const [instanceDetailState, setInstanceDetailState] = useState(initialInstanceDetailState);
  const [isSavingInstance, setIsSavingInstance] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Added a centralized function to handle input changes and filter out underscores
  const handleInstanceDetailFormChange = (field, value) => {
    // Check if the input contains an underscore and show a warning
    if (value.includes('_')) {
      showSnackbar("Underscores are not allowed.", "warning");
    }
    // Filter out underscores before setting the state
    const sanitizedValue = value.replace(/_/g, '');
    setInstanceDetailState(prev => ({ ...prev, [field]: sanitizedValue }));
    setFormErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSaveInstance = async () => {
    setIsSavingInstance(true);
    const isFormValid = await handleSaveInstanceDetails(instanceDetailState, setFormErrors);
    if (isFormValid) {
      setInstanceDetailState(initialInstanceDetailState);
    }
    setIsSavingInstance(false);
  };

  const handleSelectInstanceToEdit = (instance) => {
    setInstanceDetailState(instance);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveInstance();
    }
  };


  // Disable "_" in text fields
  

  switch (activeStep) {
    case 0:
      return (
        <Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Select an existing customer or add a new one to begin.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: '10px', bgcolor: 'background.default' }}>
          <TextField
              fullWidth
              variant="outlined"
              label="New Customer Name"
              value={newCustomerNameInput}
              // Modified onChange to filter out underscores
              onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes('_')) {
                      showSnackbar("Underscores are not allowed.", "warning");
                  }
                  setNewCustomerNameInput(value.replace(/_/g, ''));
              }}
              onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                      handleAddNewCustomerName();
                  }
              }}
          />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddNewCustomerName}
                startIcon={<AddIcon />}
                sx={{ minWidth: 'auto', p: '12px 16px' }}
              > Add </Button>
            </motion.div>
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 1.5, color: 'text.secondary', mt: 4 }}>
            Existing Customers:
          </Typography>
          {savedCustomers.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2, mb: 4, p: 2, border: '1px dashed #ccc', borderRadius: '10px' }}>
                No customers saved yet. Add a new customer above.
              </Typography>
            </motion.div>
          ) : (
            <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
              <AnimatePresence>
                {savedCustomers.map((customer) => (
                  <motion.div key={customer.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                    <Chip
                      label={customer.customerName + (isCustomerComplete(customer) ? ' (Ready)' : ' (Incomplete)')}
                      onClick={() => handleSelectCustomer(customer)}
                      onDelete={() => handleRemoveCustomer(customer.id)}
                      color={currentCustomer?.id === customer.id ? "primary" : "default"}
                      variant="filled"
                      size="medium"
                      deleteIcon={<RemoveIcon />}
                      icon={isCustomerComplete(customer) ? <CheckCircleIcon /> : <ErrorIcon />}
                      sx={{
                        '& .MuiChip-deleteIcon': { color: 'white', '&:hover': { color: 'error.light' } },
                        cursor: 'pointer',
                        backgroundColor: currentCustomer?.id === customer.id ? theme.palette.primary.main : (isCustomerComplete(customer) ? theme.palette.success.main : theme.palette.grey[400]),
                        color: 'white',
                        '&:hover': {
                          backgroundColor: currentCustomer?.id === customer.id ? theme.palette.primary.dark : (isCustomerComplete(customer) ? theme.palette.success.dark : theme.palette.grey[500])
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!currentCustomer || !isCustomerComplete(currentCustomer)}
              startIcon={<ArrowBackIcon style={{ transform: 'scaleX(-1)' }} />}
            >
              Next
            </Button>
          </Box>
        </Box>
      );
    case 1:
      return (
        <Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Now, let's configure the Oracle instances for **{currentCustomer?.customerName}**.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 1 }}>
            <TextField
              fullWidth variant="outlined" label="Instance Name"
              value={instanceDetailState.instanceName}
              onChange={(e) => handleInstanceDetailFormChange('instanceName', e.target.value)}
              error={!!formErrors.instanceName}
              helperText={formErrors.instanceName}
            />
            <TextField
              fullWidth variant="outlined" size="small" label="Oracle URL"
              value={instanceDetailState.oracleUrl}
              onChange={(e) => handleInstanceDetailFormChange('oracleUrl', e.target.value)}
              error={!!formErrors.oracleUrl}
              helperText={formErrors.oracleUrl}
            />
            <TextField
              fullWidth variant="outlined" size="small" label="Oracle Username"
              value={instanceDetailState.oracleUsername}
              onChange={(e) => handleInstanceDetailFormChange('oracleUsername', e.target.value)}
              error={!!formErrors.oracleUsername}
              helperText={formErrors.oracleUsername}
            />
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Oracle Password"
              type={showPassword ? "text" : "password"}
              value={instanceDetailState.oraclePassword}
              onChange={(e) => handleInstanceDetailFormChange('oraclePassword', e.target.value)}
              onKeyPress={handleKeyPress}
              error={!!formErrors.oraclePassword}
              helperText={formErrors.oraclePassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth variant="contained" color="primary" onClick={handleSaveInstance}
                startIcon={isSavingInstance ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={isSavingInstance}
              >
                {instanceDetailState.id ? "Update Instance" : "Add Instance"}
              </Button>
            </motion.div>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Instances for {currentCustomer?.customerName}:
          </Typography>
          {currentCustomer?.assigned_instances.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <AnimatePresence>
                  {currentCustomer?.assigned_instances.map((instance) => (
                    <motion.div key={instance.id} variants={itemVariants} exit="exit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.99 }}>
                      <Chip
                        label={instance.instanceName}
                        onClick={() => handleSelectInstanceToEdit(instance)}
                        onDelete={() => handleRemoveInstanceFromCustomer(instance.id)}
                        color="success"
                        variant="filled"
                        size="small"
                        sx={{ '& .MuiChip-deleteIcon': { color: 'white', '&:hover': { color: 'error.light' } }, cursor: 'pointer' }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            </motion.div>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem', textAlign: 'center', p: 2, border: '1px dashed #ccc', borderRadius: '10px' }}>
              No instances assigned to this customer yet.
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBack} startIcon={<ArrowBackIcon />}> Back </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!isCustomerComplete(currentCustomer)}
              startIcon={<ArrowBackIcon style={{ transform: 'scaleX(-1)' }} />}
            >
              Next
            </Button>
          </Box>
        </Box>
      );
    case 2:
      return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <Box>
            <Typography variant="h5" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
              Review and Finalize
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Please review the details below before getting started.
            </Typography>
            <Card variant="outlined" sx={{ mb: 3, p: 3, borderRadius: '15px', bgcolor: '#e8eaf6', border: '2px solid #1A237E' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountCircleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  Customer: {currentCustomer?.customerName}
                </Typography>
              </Box>
              <Divider sx={{ my: 1.5, borderColor: '#1A237E' }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Assigned Instances:
              </Typography>
                {currentCustomer?.assigned_instances.length > 0 ? (
                  <List dense>
                    {currentCustomer?.assigned_instances.map((instance, index) => (
                      <ListItem key={instance.id} sx={{ mb: 1, p: 1.5, borderRadius: '10px', bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CloudQueueIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {instance.instanceName}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              URL: {instance.oracleUrl}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No instances configured.
                  </Typography>
                )}
            </Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button onClick={handleBack} startIcon={<ArrowBackIcon />}> Back </Button>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="contained" color="primary" size="large" onClick={handleFinalizeAndStart} disabled={isLoading} >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Get Started'}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      );
    default:
      return null;
  }
});

const OnboardingScreen = ({ onRefresh, setonrefresh }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [savedCustomers, setSavedCustomers] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [newCustomerNameInput, setNewCustomerNameInput] = useState("");
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isLoading, setIsLoading] = useState(false);
  const mainCardRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const steps = ['Select Customer', 'Configure Instances', 'Review & Finish'];

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const isCustomerComplete = (customer) => {
    const assignedInstances = customer?.assigned_instances ?? [];
    const allInstancesComplete = assignedInstances.every(instance =>
      (instance?.instanceName ?? '').trim() !== '' &&
      (instance?.oracleUrl ?? '').trim() !== '' &&
      (instance?.oracleUsername ?? '').trim() !== '' &&
      (instance?.oraclePassword ?? '').trim() !== ''
    );
    return (
      (customer?.customerName ?? '').trim() !== '' &&
      assignedInstances.length > 0 &&
      allInstancesComplete
    );
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        const customerData = (data && data.data && Array.isArray(data.data)) ? data.data : data;

        if (!Array.isArray(customerData)) {
            showSnackbar("Received unexpected data format from the server.", "error");
            setSavedCustomers([]);
            setIsLoading(false);
            return;
        }

        const fetchedCustomers = customerData.map(customer => ({
            ...customer,
            id: crypto.randomUUID(),
            assigned_instances: customer.instances?.map(instance => ({
              ...instance,
              id: crypto.randomUUID()
            })) || []
        }));
        setSavedCustomers(fetchedCustomers);

        const savedCustomerState = localStorage.getItem('onboarding_customer');
        if (savedCustomerState) {
          const parsedCustomer = JSON.parse(savedCustomerState);
          setCurrentCustomer(parsedCustomer);
          showSnackbar("Restored progress from previous session!", "info");
        } else {
          showSnackbar("Customer data loaded successfully!", "success");
        }
      } else {
        showSnackbar(`Failed to fetch customer data: ${response.statusText}. Check server status.`, "error");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      showSnackbar(`An error occurred while fetching customers: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mainCardRef.current) {
      gsap.fromTo(mainCardRef.current,
        { opacity: 0, y: -50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
      );
    }
    fetchCustomers();
  }, [apiEndpoint]);

  useEffect(() => {
    if (currentCustomer) {
      localStorage.setItem('onboarding_customer', JSON.stringify(currentCustomer));
    } else {
      localStorage.removeItem('onboarding_customer');
    }
  }, [currentCustomer]);

  const handleNext = () => {
    if (activeStep === 0 && (!currentCustomer || !isCustomerComplete(currentCustomer))) {
      showSnackbar("Please select a customer with at least one configured instance.", "error");
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAddNewCustomerName = () => {
    const name = newCustomerNameInput.trim();
    if (!name) {
      showSnackbar("Customer name cannot be empty.", "error");
      return;
    }
    if (savedCustomers.some(c => c.customerName.toLowerCase() === name.toLowerCase())) {
      showSnackbar(`Customer "${name}" already exists.`, "warning");
      return;
    }

    const newCustomer = { id: crypto.randomUUID(), customerName: name, assigned_instances: [] };
    setSavedCustomers(prevCustomers => [...prevCustomers, newCustomer]);
    setCurrentCustomer(newCustomer);
    setNewCustomerNameInput("");
    showSnackbar(`Customer "${name}" added.`, "info");
    setActiveStep(1);
  };

  const handleSelectCustomer = (customer) => {
    setCurrentCustomer(customer);
  };

  const handleRemoveCustomer = async (customerId) => {
    const customerToRemove = savedCustomers.find(cust => cust.id === customerId);
    if (!customerToRemove) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}/api/customers/${encodeURIComponent(customerToRemove.customerName)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSavedCustomers(prevCustomers => prevCustomers.filter(cust => cust.id !== customerId));
        if (currentCustomer?.id === customerId) {
            setCurrentCustomer(null);
        }
        showSnackbar(`Customer "${customerToRemove.customerName}" removed.`, "info");
      } else {
        const errorData = await response.json();
        showSnackbar(`Failed to remove customer: ${errorData.detail || response.statusText}`, "error");
      }
    } catch (error) {
      console.error("Error removing customer:", error);
      showSnackbar(`An error occurred while removing customer: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInstanceDetails = async (instanceData, setFormErrors) => {
    if (!currentCustomer) return;
    const { id, instanceName, oracleUrl, oracleUsername, oraclePassword } = instanceData;
    const errors = {};
    const urlRegex = /^(http|https):\/\/[^ "]+$/;

    if (!instanceName.trim()) errors.instanceName = "Instance name is required.";
    if (currentCustomer.assigned_instances.some(inst => inst.instanceName === instanceName.trim() && inst.id !== id)) {
      errors.instanceName = "Instance name must be unique.";
    }
    if (!oracleUrl.trim()) {
      errors.oracleUrl = "Oracle URL is required.";
    } else if (!urlRegex.test(oracleUrl)) {
      errors.oracleUrl = "Please enter a valid URL.";
    }
    if (!oracleUsername.trim()) errors.oracleUsername = "Username is required.";
    if (!oraclePassword.trim()) errors.oraclePassword = "Password is required.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showSnackbar("Please correct the form errors.", "error");
      return false;
    }
    setFormErrors({});
    let updatedCustomer = { ...currentCustomer };
    const instanceExists = updatedCustomer.assigned_instances.some(inst => inst.id === id);
    if (instanceExists) {
      updatedCustomer.assigned_instances = updatedCustomer.assigned_instances.map(inst =>
        inst.id === id ? { ...inst, ...instanceData } : inst
      );
      showSnackbar(`Instance "${instanceName}" updated.`, "info");
    } else {
      const newLocalInstance = { ...instanceData, id: crypto.randomUUID() };
      updatedCustomer.assigned_instances = [...updatedCustomer.assigned_instances, newLocalInstance];
      showSnackbar(`Instance "${instanceName}" added.`, "info");
    }
    setCurrentCustomer(updatedCustomer);
    setSavedCustomers(prevCustomers => prevCustomers.map(cust => cust.id === updatedCustomer.id ? updatedCustomer : cust));
    return true;
  };

  const handleRemoveInstanceFromCustomer = async (instanceId) => {
    if (!currentCustomer) return;
    const instanceToRemove = currentCustomer.assigned_instances.find(inst => inst.id === instanceId);
    if (!instanceToRemove) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}/api/customers/${encodeURIComponent(currentCustomer.customerName)}/instances/${encodeURIComponent(instanceToRemove.instanceName)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCurrentCustomer(prevCustomer => {
          const updatedInstances = prevCustomer.assigned_instances.filter(inst => inst.id !== instanceId);
          return { ...prevCustomer, assigned_instances: updatedInstances };
        });
        showSnackbar(`Instance "${instanceToRemove.instanceName}" unassigned.`, "info");
        setSavedCustomers(prevCustomers => prevCustomers.map(cust => cust.id === currentCustomer.id ? { ...currentCustomer, assigned_instances: currentCustomer.assigned_instances.filter(inst => inst.id !== instanceId) } : cust));
      } else {
        const errorData = await response.json();
        showSnackbar(`Failed to unassign instance: ${errorData.detail || response.statusText}`, "error");
      }
    } catch (error) {
      console.error("Error unassigning instance:", error);
      showSnackbar(`An error occurred while unassigning instance: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeAndStart = async () => {
    if (!currentCustomer || !isCustomerComplete(currentCustomer)) {
      showSnackbar("Please ensure the selected customer has at least one complete instance.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const updatedCustomerList = savedCustomers;
      const submittedData = updatedCustomerList.map(customer => ({
        customerName: customer.customerName,
        instances: customer.assigned_instances.map(inst => ({
          instanceName: inst.instanceName,
          oracleUrl: inst.oracleUrl,
          oracleUsername: inst.oracleUsername,
          oraclePassword: inst.oraclePassword
        }))
      }));
      const saveEnvResponse = await fetch(`${apiEndpoint}/api/save-env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submittedData),
      });
      if (saveEnvResponse.ok) {
        const result = await saveEnvResponse.json();
        showSnackbar(`Environment details synced! ${result.message || ''}`, "success");
        navigate('/');
        window.location.reload(true);
        localStorage.removeItem('onboarding_customer');
        if (typeof onRefresh === 'function') {
          onRefresh(true);
        }
      } else {
        const errorData = await saveEnvResponse.json();
        showSnackbar(`Failed to sync environment data: ${errorData.detail || saveEnvResponse.statusText}`, "error");
      }
    } catch (error) {
      console.error("Error during save operation:", error);
      showSnackbar(`An error occurred during save: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to right bottom, #4A00E0, #8E2DE2)' }}>
        <CircularProgress color="secondary" />
        <Typography variant="h6" sx={{ ml: 2, color: 'white' }}>Loading data...</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(to right bottom, #4A00E0, #8E2DE2)',
          padding: { xs: 2, sm: 4 }, boxSizing: 'border-box', overflowY: 'auto',
          '@keyframes gradientShift': { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
          backgroundSize: '200% 200%', animation: 'gradientShift 15s ease infinite',
        }}
      >
        <motion.div ref={mainCardRef} style={{ width: '100%', maxWidth: '900px' }}>
          <Card elevation={8}>
            <CardContent sx={{ padding: { xs: '24px', sm: '32px' } }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center', mb: 2 }}>
                Customer Onboarding
              </Typography>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Divider sx={{ mb: 4 }} />
              <Box>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StepContent
                      activeStep={activeStep}
                      newCustomerNameInput={newCustomerNameInput}
                      setNewCustomerNameInput={setNewCustomerNameInput}
                      handleAddNewCustomerName={handleAddNewCustomerName}
                      savedCustomers={savedCustomers}
                      currentCustomer={currentCustomer}
                      isCustomerComplete={isCustomerComplete}
                      handleSelectCustomer={handleSelectCustomer}
                      handleRemoveCustomer={handleRemoveCustomer}
                      handleNext={handleNext}
                      handleBack={handleBack}
                      handleSaveInstanceDetails={handleSaveInstanceDetails}
                      handleRemoveInstanceFromCustomer={handleRemoveInstanceFromCustomer}
                      handleFinalizeAndStart={handleFinalizeAndStart}
                      isLoading={isLoading}
                      showSnackbar={showSnackbar}
                    />
                  </motion.div>
                </AnimatePresence>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default OnboardingScreen;
