import React, { useEffect, useState, useCallback, useMemo, useRef, use } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions,
  Snackbar,
  Alert as MuiAlert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Tooltip,
  
} from "@mui/material";
import FilePreviewer from "../Components/FilePreviewer"; // Assuming this component exists
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { setSourceKey, deleteSourceKey } from '../utils/indexedDBUtils';
import { getSourceKey } from '../utils/indexedDBUtils';
import DataTable from "../Components/Table"; // Assuming this component exists
import Lookup from "../Components/Lookup"; // Assuming this component exists
import { Close as GridCloseIcon } from "@mui/icons-material"; // Corrected import for Close icon
import DataTransformationDialog from "../Components/DataTransformationDialog"; // Assuming this component exists
import axios from "axios";
import ChatBotComponent from "../Components/NLP_Component"; // Assuming this component exists
import RedInfoBox from "../Components/RedInfoBox"; // Assuming this component exists
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

import OracleValueCheck from '../Components/Oracle_Value_check';
gsap.registerPlugin(ScrollTrigger);

const drawerWidth = 25;
const collapsedWidth = 0;

// Define the single base URL from environment variable, with fallback
const BASE_URL = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

// Helper component for Tab Panels
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`validation-tabpanel-${index}`}
      aria-labelledby={`validation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HDL = ({
  selectedItem = { text: "Global", hierarchy: [""] },
  collapsed = false,
}) => {
  // --- State Management ---
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [datFile, setDatFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [pythonFileName, setPythonFileName] = useState("");
  const [columnDataTypes, setColumnDataTypes] = useState({});
  // States for fetched setup data
  const [hire_actions, setHireActions] = useState([]);
  const [rehire_actions, setRehireActions] = useState([]);
  const [term_actions, setTermActions] = useState([]);
  const [globalTransferAction, setGlobalTransferAction] = useState([]);
  const [assignmentStatusRules, setAssignmentStatusRules] = useState([]);
  const customerName = selectedItem.hierarchy[0];
  const InstanceName = selectedItem.hierarchy[1] || "Not selected"; 
  const [transformationclicked, setTransformationClicked] = useState(false);
  const [oracleValidationPassed, setOracleValidationPassed] = useState(false);
  const [oracleValidationsets, setOracleValidationSets] = useState([]);
  // Snackbar States for global notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = useCallback((message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Memoized Helper Functions
  const getComponentName = useMemo(() => {
    if (selectedItem?.hierarchy && selectedItem.hierarchy.length > 0) {
      return selectedItem.hierarchy[selectedItem.hierarchy.length - 1];
    }
    return selectedItem?.text || "Global";
  }, [selectedItem]);

  const componentName = getComponentName;


  // useEffect to fetch setup data from backend
  useEffect(() => {
    const fetchSetupData = async () => {
      // Only fetch if both customerName and InstanceName are valid and selected
      if (customerName && InstanceName !== "Not selected" && componentName) { // Added componentName to condition
        try {
          const response = await axios.get(
            `${BASE_URL}/api/hdl/get-setup/${encodeURIComponent(customerName)}/${encodeURIComponent(InstanceName)}` // Included componentName
          );
          const data = response.data;
          // Update states with fetched data, defaulting to empty arrays if not present
          setHireActions(data.hireActions || []);
          setRehireActions(data.rehireActions || []);
          setTermActions(data.termActions || []);
          setGlobalTransferAction(data.globalTransferActions || []);
          setAssignmentStatusRules(data.assignmentStatusRules || []);
          showSnackbar("Setup data loaded successfully!", "success");
        } catch (error) {
          console.error("Error fetching setup data:", error);
          // If setup data is not found or an error occurs, initialize with empty arrays
          setHireActions([]);
          setRehireActions([]);
          setTermActions([]);
          setGlobalTransferAction([]);
          setAssignmentStatusRules([]);
          showSnackbar("No setup data found for this customer/instance/component. Using default empty values.", "info"); // Updated message
        }
      } else {
        // Clear setup data if no valid customer/instance/component is selected
        setHireActions([]);
        setRehireActions([]);
        setTermActions([]);
        setGlobalTransferAction([]);
        setAssignmentStatusRules([]);
        // Optionally, show a snackbar if selection is incomplete
        // showSnackbar("Please select a customer, instance, and component to load setup data.", "info"); // Updated message
      }
    };

    fetchSetupData();
  }, [customerName, InstanceName, componentName, showSnackbar]); // Added componentName to dependencies


  // Loading and Error States
  const [datProcessingLoading, setDatProcessingLoading] = useState(false);
  const [datProcessingError, setDatProcessingError] = useState(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validateError, setValidateError] = useState(null);
  const [transformationLoading, setTransformationLoading] = useState(false);
  // customerOracleReplacements is passed to DataTransformationDialog, not directly used here for transformation logic
  const [customerOracleReplacements, setCustomerOracleReplacements] = useState({});
  const [DatRows, setDatRows] = useState({}); // This state seems unused based on snippets, consider removal if not needed elsewhere
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Validation state
  const [isValidated, setIsValidated] = useState(false);
  const [DatIncluded, setDatIncluded] = useState({}) // This state seems unused based on snippets, consider removal if not needed elsewhere

  // Lookup Dialog States
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedAttributeForLookup, setSelectedAttributeForLookup] = useState("");
  const [allLookups, setAllLookups] = useState({});
  const [transaction, setTransaction] = useState(false); // State to track if transaction is enabled
  // If the selectedItems is defined and then iterating it over we get the Transaction value from the selectedItem then the tranasaction state has to be true
  useEffect(() => {
    if (selectedItem && selectedItem.hierarchy.includes("Transactional Data") ) {
      setTransaction(true);
    } else {
      setTransaction(false);
    }
  }, [selectedItem]);

  // Data Transformation Dialog States
  const [transformationOpen, setTransformationOpen] = useState(false);
  const [selectedAttributeForTransformation, setSelectedAttributeForTransformation] = useState("");
  const [allMapping, setAllMapping] = useState({});

  // RedInfoBox Dialog State
  const [redInfoBoxOpen, setRedInfoBoxOpen] = useState(false);

  
  const [nlrRulesDict, setNlrRulesDict] = useState({}); 
  const [removePersonNumberList, setRemovePersonNumberList] = useState([]); 

  // State for global chatbot button
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  // State for Oracle Check Dialog
  const [oracleDialogOpen, setOracleDialogOpen] = useState(false);

  // State for skipped columns
  const [skippedColumns, setSkippedColumns] = useState([]);

  // State to track if Excel file has been transformed
  const [isTransformed, setIsTransformed] = useState(false);

  // State to store RedInfoBox mapping (source keys)
  const [redInfoBoxMapping, setRedInfoBoxMapping] = useState({});
  const [initialLoadDone, setInitialLoadDone] = useState(false);


  // --- NEW: Validation Result State for dialog ---
  // This state will hold a combined result from all validation steps
  const [validationResult, setValidationResult] = useState(null);
  const [validationFailedDialogOpen, setValidationFailedDialogOpen] = useState(false);
  const [validationTabValue, setValidationTabValue] = useState(0);
  const [failedExcelDialogOpen, setFailedExcelDialogOpen] = useState(false);
  const [failedExcelUrl, setFailedExcelUrl] = useState("");


  // --- NEW: Stepper State ---
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Select Source Keys",
    "Transform Customer Excel",
    "Oracle Value Check",
    "Define NLP Rules",
    "Validate Data",
  ];


  // --- Refs for GSAP Animations ---
  const mainContentRef = useRef(null);
  const headerSectionRef = useRef(null);
  const dataTableSectionRef = useRef(null);
  const uploadDatButtonRef = useRef(null);
  const finishButtonRef = useRef(null);
  const downloadDatButtonRef = useRef(null); 

  // --- Confetti related refs and states ---
  const confettiCanvasRef = useRef(null); // Ref for our own controlled canvas
  const [confettiInstance, setConfettiInstance] = useState(null); // Store the confetti instance
  const [isConfettiReady, setIsConfettiReady] = useState(false);

  // --- Responsive Hooks ---
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // --- Memoized Helper Functions ---
  
  const getGlobalBOName = useMemo(() => {
    if (selectedItem?.hierarchy && selectedItem.hierarchy.length > 0) {
      console.log("selsctedItem.hierarchy:", selectedItem.hierarchy[5]);
      return selectedItem.hierarchy[5] || selectedItem.hierarchy[selectedItem.hierarchy.length - 3];
    }
    return "";
  }, [selectedItem]);

  
  const globalBoName = getGlobalBOName;

  const isComponentSelected = useMemo(() => {
    return selectedItem && selectedItem.hierarchy &&
           selectedItem.hierarchy[selectedItem.hierarchy.length - 1];
  }, [selectedItem]);

  

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const handleValidationTabChange = (event, newValue) => {
    setValidationTabValue(newValue);
  };
  
  // --- Table Interaction Handlers ---
  const handleCheckboxChange = useCallback((id) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, required: !row.required } : row
      )
    );
    setIsValidated(false);
  }, []);

  // Handler for the new "Include in Dat File Generation" checkbox
  const handleIncludeInDatFileGenerationChange = useCallback((id) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id
          ? { ...row, includeInDatFileGeneration: !row.includeInDatFileGeneration }
          : row
      )
    );
  }, []);

  const handleDatCheckboxChange = useCallback((id) => {
    setDatRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, Datrequired: !row.Datrequired } : row
      )
    );
    setDatIncluded(false); 
  }, []);

  const handleOpenLookup = useCallback((attribute) => {
    setSelectedAttributeForLookup(attribute);
    setLookupOpen(true);
  }, []);

  const handleLookupSelect = useCallback((attribute, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.Attributes === attribute ? { ...row, "LookUp data": value } : row
      )
    );
    setLookupOpen(false);
    setIsValidated(false);
  }, []);

  const handleOpenDataTransformation = useCallback((attribute) => {
    setSelectedAttributeForTransformation(attribute);
    setTransformationOpen(true);
  }, []);

  // --- Stepper Navigation Handlers ---
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    // You might want to reset other relevant states here for a full process reset
    setDatFile(null);
    setExcelFile(null);
    setIsTransformed(false);
    setIsValidated(false);
    setValidationResult(null);
    setPythonFileName(""); // Reset pythonFileName on workflow reset
    // ... potentially more states if a full reset is desired
  };

  const [mandatoryMap, setMandatoryMap] = useState({});
  const [datatype, setDatatype] = useState({});

useEffect(() => {
  fetch(`${BASE_URL}/api/hdl/mandatory/batch`)
    .then(res => res.json())
    .then(data => {
      if (data?.mandatory) {
        setMandatoryMap(data.mandatory);
        setColumnDataTypes(data.data_types || {}); 
      }
    });
}, []);


  // --- Confetti Effect (using canvas-confetti) ---
  useEffect(() => {
    // Only attempt to load if not already loaded and canvas ref is available
    if (typeof window !== 'undefined' && confettiCanvasRef.current && !confettiInstance) {
      console.log("Attempting to load Canvas Confetti script...");
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      script.async = true;
      script.onload = () => {
        console.log("Canvas Confetti script loaded. Checking window.confetti...");
        // Defer execution slightly to ensure Canvas Confetti is fully registered on window
        setTimeout(() => {
          if (typeof window.confetti === 'function') {
            console.log("Canvas Confetti function available. Creating instance.");
            // Create a confetti instance tied to our canvas
            const instance = window.confetti.create(confettiCanvasRef.current, { resize: true });
            setConfettiInstance(() => instance); // Store the instance in state
            setIsConfettiReady(true);
          } else {
            console.error("Canvas Confetti function not found on window after load.");
            showSnackbar("Confetti effects could not be initialized. Please try again later.", "error");
            setIsConfettiReady(false);
          }
        }, 50); // Small delay to ensure browser fully processes the script
      };
      script.onerror = (e) => {
        console.error("Failed to load Canvas Confetti script:", e);
        showSnackbar("Failed to load confetti effects. Please check your network connection or try again.", "error");
        setIsConfettiReady(false);
      };
      document.body.appendChild(script);

      // Cleanup function to remove the script if component unmounts
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    } else if (confettiCanvasRef.current && confettiInstance) {
      // If confetti and instance are already loaded/created (e.g., during hot reload)
      console.log("Canvas Confetti already loaded and instance created.");
      setIsConfettiReady(true);
    }
  }, [showSnackbar, confettiCanvasRef, confettiInstance]); // Added confettiInstance to dependencies

  const triggerConfetti = useCallback(() => {
    if (isConfettiReady && confettiInstance) { // Ensure instance is available
      console.log("Triggering confetti!");
      confettiInstance({ // Call the stored instance
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        shapes: ['square', 'circle'],
        colors: ['#FFD700', '#1A237E', '#f44336', '#4CAF50', '#2196f3'], // Using colors from your theme
      });
      // Optionally add a second burst for a fuller effect
      confettiInstance({ // Call the stored instance
        particleCount: 150,
        spread: 120,
        origin: { y: 0.4 },
        decay: 0.9,
        colors: ['#FFFFFF', '#FFD700', '#1A237E'],
      });
    } else {
      console.warn("Confetti library not ready or instance not loaded when triggerConfetti was called.");
    }
  }, [isConfettiReady, confettiInstance, showSnackbar]);


  // --- File Upload Handlers ---
const handleDatFileUpload = useCallback(
  async (file) => {
    if (!file) {
      showSnackbar("Please select a DAT file.", "warning");
      return;
    }
    if (!isComponentSelected) {
      showSnackbar("Please select a specific component from the sidebar first.", "warning");
      return;
    }
    console.log("Uploading DAT file:", file);
    console.log("Using componentName:", getComponentName);
    console.log("Using globalBoName:", getGlobalBOName);
    console.log("Using transaction flag:", transaction);

    setDatFile(file);
    setDatProcessingLoading(true);
    setDatProcessingError(null);
    setRows([]);
    setColumns([]);
    setAllLookups({});
    setAllMapping({});
    setIsValidated(false);

    const formData = new FormData();
    formData.append("datFile", file);

    try {
      const currentComponentName = getComponentName;
      const currentGlobalBOName = getGlobalBOName;

      const datRes = await axios.post(
        `${BASE_URL}/api/hdl/upload-dat`,
        formData,
        { timeout: 30000 }
      );

      const cleanAttributes = datRes.data.non_skipped_columns.map((attr) =>
        attr.trim()
      );
      setSkippedColumns(datRes.data.skipped_columns || []);

      if (cleanAttributes.length === 0) {
        showSnackbar("No attributes found in the DAT file.", "warning");
        setDatProcessingLoading(false);
        return;
      }

      // lookup payload console log
      console.log("Preparing to fetch metadata with payload for lookups:", {
        attributes: cleanAttributes,
        componentName: currentComponentName,
        globalComponentName: currentGlobalBOName,
        transaction: transaction,
        customerName: customerName,
        instanceName: InstanceName,
      });

      const [mandatoryRes, dataTransformationRes, lookupRes, nlrRes] =
        await Promise.all([
          axios.post(`${BASE_URL}/api/hdl/mandatory/batch`, {
            attributes: cleanAttributes,
            componentName: currentComponentName,
            customerName: customerName,
            instanceName: InstanceName,
          }),
          axios.post(`${BASE_URL}/api/hdl/data-transformation`, {
            Attributes: cleanAttributes,
            componentName: currentComponentName,
          }),
          axios.post(`${BASE_URL}/api/hdl/lookup/batch`, {
            Attributes: cleanAttributes,
            componentName: currentComponentName,
            globalComponentName: currentGlobalBOName,
            transaction: transaction,
            customerName: customerName,
            instanceName: InstanceName,
          }),
          axios.post(`${BASE_URL}/api/hdl/nlr/batch`, {
            attributes: cleanAttributes,
          }),
        ]);

      const { mandatory } = mandatoryRes.data;
      const { mapping } = dataTransformationRes.data;
      const { lookups, default_code_names } = lookupRes.data;

      setMandatoryMap(mandatory);
      setAllMapping(mapping);
      setAllLookups(lookups);
      setNlrRulesDict(nlrRes.data.nlr_rules || {});

      const initialRows = cleanAttributes.map((attr, index) => {
      const defaultLookupValue = default_code_names?.[attr] || "";
      const mandatoryData = mandatory?.[attr] || {
        mandatory: false,
        helper_text: "",
      };

      return {
        id: index + 1,
        Attributes: attr,
        required: mandatoryData.mandatory,
        helperText: mandatoryData.helper_text,
        data_type: mandatoryData.data_type || "VARCHAR",
        keyValues: mandatoryData.key_values ?? false, // 👈 NEW FIELD
        "LookUp data": defaultLookupValue,
        CodeName: default_code_names?.[attr] || "",
        "Data Transformation":
          mapping?.[attr] !== undefined ? mapping[attr] : "",
        includeInDatFileGeneration: true,
      };
    });


      const newColumns = [
        {
          field: "Attributes",
          headerName: "Attributes",
          width: 250,
          renderCell: (params) => {
            const helperText = params.row.helperText || "";
            return (
              <Tooltip title={helperText} arrow>
                <span>{params.row.Attributes}</span>
              </Tooltip>
            );
          },
        },
        {
          field: "required",
          headerName: "Required",
          width: 150,
          renderCell: (params) => {
            const attrKey = params.row.Attributes;
            const isMandatory = mandatory?.[attrKey] === true;

            return (
              <Checkbox
                checked={!!params.value}
                disabled={
                  isMandatory || datProcessingLoading || !isComponentSelected
                }
                onChange={() => {
                  if (!isMandatory) {
                    handleCheckboxChange(params.id);
                  }
                }}
              />
            );
          },
        },
        {
          field: "keyValues",
          headerName: "Key Values",
          width: 150,
          renderCell: (params) => {
            const attrKey = params.row.Attributes;
            const keyVal = mandatory?.[attrKey]?.key_values ?? false;
            return (
              <Checkbox
                checked={!!params.value}
                disabled={
                  keyVal || datProcessingLoading || !isComponentSelected
                }
                onChange={() => {
                  if (!keyVal) {
                    setRows((prev) =>
                      prev.map((row) =>
                        row.id === params.id ? { ...row, keyValues: !row.keyValues } : row
                      )
                    );
                  }
                }}
              />
            );
          },
        },
        { // <--- NEW COLUMN: Data Type
            field: "data_type",
            headerName: "Data Type",
            width: 150,
            renderCell: (params) => {
                return (
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {params.row.data_type || "-"}
                    </Typography>
                );
            },
        },
        {
          field: "LookUp data",
          headerName: "LookUp Value",
          width: 200,
          renderCell: (params) => {
            const codeName = params.row.CodeName;
            const displayValue = params.value;

            return codeName ? (
              <Button
                variant="text"
                size="small"
                onClick={() => handleOpenLookup(params.row.Attributes)}
                disabled={datProcessingLoading || !isComponentSelected}
              >
                {displayValue || codeName}
              </Button>
            ) : (
              <span>-</span>
            );
          },
        },
        {
          field: "Data Transformation",
          headerName: "Data Transformation",
          width: 150,
          renderCell: (params) => {
            const attributeName = params.row.Attributes;
            const hasConfigurableMapping = Object.prototype.hasOwnProperty.call(
              allMapping,
              attributeName
            );
            const currentMappingValue = allMapping[attributeName];

            let buttonText = "-";
            const hasActualMappingValue =
              currentMappingValue !== "" &&
              currentMappingValue !== undefined &&
              currentMappingValue !== null;

            if (hasConfigurableMapping && hasActualMappingValue) {
              buttonText = currentMappingValue;
            }

            const isDisabled =
              !hasConfigurableMapping ||
              !hasActualMappingValue ||
              datProcessingLoading ||
              !isComponentSelected;

            return (
              <Button
                variant="text"
                size="small"
                disabled={isDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenDataTransformation(attributeName);
                }}
              >
                {buttonText}
              </Button>
            );
          },
        },
        {
          field: "includeInDatFileGeneration",
          headerName: "Include in Dat File Generation",
          width: 150,
          renderCell: (params) => (
            <Checkbox
              checked={params.row.includeInDatFileGeneration}
              onChange={() =>
                handleIncludeInDatFileGenerationChange(params.id)
              }
              disabled={datProcessingLoading || !isComponentSelected}
            />
          ),
        },
      ];

      setColumns(newColumns);
      setRows(initialRows);
      showSnackbar("DAT file processed and data loaded successfully!", "success");
    } catch (err) {
      console.error("DAT file processing failed:", err);

      let errorMessage = "An unexpected error occurred during DAT file processing.";

      if (err.response) {
        if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }

        if (err.response.status === 404) {
          errorMessage =
            "Lookup file not found. Please load the lookup data from Setup for this Customer / Instance.";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setDatProcessingError(errorMessage);
      showSnackbar(errorMessage, "error");

      setRows([]);
      setColumns([]);
      setAllLookups({});
      setAllMapping({});
    } finally {
      setDatProcessingLoading(false);
    }
  },
  [
    getComponentName,
    getGlobalBOName,
    handleCheckboxChange,
    handleOpenLookup,
    handleOpenDataTransformation,
    handleIncludeInDatFileGenerationChange,
    showSnackbar,
    allMapping,
    isComponentSelected,
    datProcessingLoading,
    transaction,
  ]
);

const handleOpenOracleDialog = useCallback(() => {
  setOracleDialogOpen(true);
}, []);

const handleCloseOracleDialog = useCallback(() => {
  setOracleDialogOpen(false);
}, []);

const handleOracleValidationComplete = useCallback((success) => {
  setOracleValidationPassed(success);
  if (success) {
    showSnackbar('Oracle validation completed successfully', 'success');
    setActiveStep((prevStep) => prevStep + 1);
  } else {
    showSnackbar('Oracle validation failed. Please check the requirements.', 'error');
  }
}, [showSnackbar]);

  const handleApplyTransformationAndDownload = useCallback(async () => {
    if (!isComponentSelected) {
        showSnackbar("Please select a specific component from the sidebar first.", "warning");
        return;
    }

    if (!excelFile) {
        showSnackbar("Please select an Excel file to transform.", "warning");
        return;
    }

    setTransformationLoading(true);
    showSnackbar("Applying customer value transformations...", "info");

    const formData = new FormData();
    formData.append('raw_excel_file', excelFile);

    try {
        const response = await axios.post(
            `${BASE_URL}/api/hdl/transform-customer-excel`,
            formData,
            {
                responseType: 'blob',
                timeout: 60000
            }
        );

        if (response.status === 200) {
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'transformed_customer_data.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const transformedFile = new File([blob], filename, { type: response.headers['content-type'] });
            setExcelFile(transformedFile);
            setIsTransformed(true);

            showSnackbar("Excel file transformed successfully and ready for validation!", "success");
            // No handleNext here, let the user manually click Next after seeing confirmation.
        } else {
            const errorBlob = await new Response(response.data).text();
            let errorMessage = "Unknown error during transformation.";
            try {
                const errorJson = JSON.parse(errorBlob);
                errorMessage = errorJson.detail || errorMessage;
            } catch (e) {
                errorMessage = errorBlob || errorMessage;
            }
            showSnackbar(`Failed to apply transformations: ${errorMessage}`, "error");
            setIsTransformed(false);
        }
    } catch (error) {
        console.error("Error during transformation:", error);
        let errorMessage = "An unexpected error occurred.";

        if (axios.isAxiosError(error)) {
            if (error.response) {
                if (error.response.data instanceof Blob) {
                    try {
                        const errorText = await new Response(error.response.data).text();
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.detail || `Server error: ${error.response.status}`;
                    } catch (e) {
                        errorMessage = `Server error: ${error.response.status} (Could not parse error response)`;
                    }
                } else {
                    errorMessage = error.response.data?.detail || `Server error: ${error.response.status}`;
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your network connection or server status.";
            } else {
                errorMessage = `Request setup error: ${error.message}`;
            }
        } else {
            errorMessage = error.message || errorMessage;
        }
        showSnackbar(`Error during transformation: ${errorMessage}`, "error");
        setIsTransformed(false);
    } finally {
        setTransformationLoading(false);
    }
  }, [excelFile, isComponentSelected, showSnackbar]);

  // Download the transformed excel file from the variable excelFile
  const handleDownloadTransformedExcel = useCallback(() => {
    if (!excelFile) {
      showSnackbar("No transformed Excel file available for download.", "warning");
      return;
    }
    const url = URL.createObjectURL(excelFile);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', excelFile.name || 'transformed_customer_data.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSnackbar("Transformed Excel file download initiated.", "success");
  }, [excelFile, showSnackbar]);

  const handleOpenFailedExcel = (url) => {
  setFailedExcelUrl(url);
  setFailedExcelDialogOpen(true);
  };

  const handleCloseFailedExcel = () => {
  setFailedExcelDialogOpen(false);
  setFailedExcelUrl("");
  };
  // Function to handle the Legal Employer Name cross-file validation process
  const handleValidateLegalEmployerCrossFile = useCallback(async () => {
    console.log("Validating Legal Employer cross-file...");
    if (!excelFile) {
      showSnackbar("Please upload an Excel file first for Legal Employer validation.", "warning");
      return null; 
    }

    const currentColumnNames = columns.map(col => col.field || col.headerName).map(name => name.toLowerCase());
    const requiredColumns = ["personnumber", "actioncode", "legalemployername"]; 
    const hasAllRequiredColumns = requiredColumns.every(col => currentColumnNames.includes(col));

    if (!hasAllRequiredColumns) {
      showSnackbar(
        "The uploaded file does not contain all required columns for Legal Employer validation: 'PersonNumber', 'ActionCode', and 'LegalEmployerName'. Skipping Legal Employer validation.",
        "info"
      );
      console.log("Missing required columns for LE validation:", requiredColumns.filter(col => !currentColumnNames.includes(col)));
      return null; // Return null if columns are missing, so the tab is not shown
    }

    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("hire_action_codes", JSON.stringify(hire_actions)); // Pass from state
      formData.append("termination_action_codes", JSON.stringify(term_actions)); // Pass from state
      formData.append("allowed_le_change_action_codes", JSON.stringify(globalTransferAction)); // Pass from state

      const response = await axios.post(`${BASE_URL}/api/hdl/bulk/cross-file/legalEmployer/validate`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Corrected Content-Type here
        },
      });

      if (response.data && response.data.inconsistent_records) {
        const inconsistentRecords = response.data.inconsistent_records;
        if (inconsistentRecords.length > 0) {
          showSnackbar("Legal Employer validation completed with inconsistencies.", "warning");
          setRemovePersonNumberList(inconsistentRecords.map(record => record.PersonNumber));
        } else {
          showSnackbar("Legal Employer validation completed. No inconsistencies found.", "success");
        }
        return {
          message: response.data.message || "Legal Employer validation completed.",
          inconsistent_records: inconsistentRecords,
          status: inconsistentRecords.length > 0 ? "failed" : "success"
        };
      }
      return null;
    }  catch (error) {
      console.error("Error validating Legal Employer cross-file:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "An unexpected error occurred during Legal Employer validation.";
      showSnackbar(`Legal Employer validation failed: ${errorMessage}`, "error");
      return {
        message: `Error during Legal Employer validation: ${errorMessage}`,
        inconsistent_records: [],
        status: "failed",
        error: errorMessage
      };
    }
  }, [excelFile, columns, showSnackbar, hire_actions, term_actions, globalTransferAction]); // Added dependencies

  // Main Data Validation Handler
  const handleValidateData = useCallback(async () => {
    if (redInfoBoxOpen) {
      showSnackbar("Please save and close the Source Keys dialog before validating.", "warning");
      return;
    }
    if (!isComponentSelected) {
      showSnackbar("Please select a specific component from the sidebar first.", "warning");
      return;
    }
    if (rows.length === 0) {
      showSnackbar("No data to validate. Please upload a DAT file first.", "warning");
      return;
    }
    if (!excelFile) {
        showSnackbar("Please upload an Excel file to validate.", "warning");
        return;
    }


    setValidateLoading(true);
    setValidateError(null);
    setIsValidated(false);
    setValidationResult(null); 

    // Step 1: Perform Legal Employer Cross-File Validation
    const legalEmployerValidationOutcome = await handleValidateLegalEmployerCrossFile();

    // Step 2: Perform Main Data Validation
    try {
        const reader = new FileReader();
        reader.readAsDataURL(excelFile);
        reader.onloadend = async () => {
            const base64Excel = reader.result.split(',')[1];
            const allLookupsStringified = JSON.parse(JSON.stringify(allLookups, (key, value) => {
              if (key === 'Value' && typeof value !== 'string') {
                return String(value);
              }
              return value;
            }));
            
            // MODIFIED PAYLOAD: Include `includeInDatFileGeneration` for each attribute
            const datColumnOrder = rows.map(row => row.Attributes);
            const payload = {
                pyFileName: pythonFileName, // Send pythonFileName to the backend
                componentName: componentName,
                attributes: rows.map(row => ({
                    Attributes: row.Attributes,
                    required: row.required,
                    data_type: row.data_type,
                    keyValues: row.keyValues,
                    LookUp_data: row["LookUp data"],
                    CodeName: row.CodeName,
                    Data_Transformation: row["Data Transformation"],
                    // Send the state of the new checkbox column
                    includeInDatFileGeneration: row.includeInDatFileGeneration, 
                })),
                allLookups: allLookupsStringified,
                allMapping: allMapping,
                excelFile: base64Excel,
                globalBoName: globalBoName,
                sourceKeys: redInfoBoxMapping, 
                datColumnOrder: datColumnOrder,
                // Setup data - these now come from the fetched state
                hireActions: hire_actions,
                rehireActions: rehire_actions,
                terminationActions: term_actions, // Corrected to terminationActions
                globalTransferActions: globalTransferAction, // Corrected to globalTransferActions
                customerName: customerName,
                InstanceName: InstanceName,
            };

            console.log("Sending main validation payload (with sourceKeys and includeInDatFileGeneration):", payload);

            try {
                const mainValidationResponse = await axios.post(
                    `${BASE_URL}/api/hdl/validate-data`,
                    payload,
                    { timeout: 120000 }
                );

                // Combine Validation Results
                let combinedResult = {
                  mainValidation: mainValidationResponse.data,
                  legalEmployerValidation: legalEmployerValidationOutcome, // This will be null if skipped
                  status: "success", // Default to success, will be overridden if any fails
                  message: "Validation successful!",
                  passed_file_url: mainValidationResponse.data.passed_file_url || null,
                  failed_file_url: mainValidationResponse.data.failed_file_url || null,
                  passed_records_count: mainValidationResponse.data.passed_records_count ?? 0,
                  failed_records_count: mainValidationResponse.data.failed_records_count ?? 0,
                };

                // Determine overall status and message
                if (mainValidationResponse.data.status === "failed" || 
                    (legalEmployerValidationOutcome && legalEmployerValidationOutcome.status === "failed")) {
                  combinedResult.status = "failed";
                  combinedResult.message = "Validation completed with errors.";
                  showSnackbar("Validation completed with errors.", "error");
                  setIsValidated(false);
                  setValidateError("Validation failed. See details below.");
                } else {
                  showSnackbar("Validation successful!", "success");
                  setIsValidated(true);
                  setValidateError(null);

                  // Trigger confetti ONLY if no failed records from main and legal employer validations
                  const hasMainFailedRecords = combinedResult.mainValidation.failed_records_count > 0;
                  const hasLegalEmployerInconsistencies = combinedResult.legalEmployerValidation?.inconsistent_records?.length > 0;

                  if (!hasMainFailedRecords && !hasLegalEmployerInconsistencies) {
                      // Trigger confetti animation with GSAP
                      const validateButtonElement = document.querySelector('button[aria-label="Validate Data"]'); // Target the validate button by its label
                      if (validateButtonElement) {
                          gsap.timeline()
                              .to(validateButtonElement, { scale: 0.9, duration: 0.1, ease: "power1.out" })
                              .to(validateButtonElement, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" })
                              .call(triggerConfetti);
                      } else {
                          triggerConfetti(); // Fallback if button ref is not found
                      }
                  } else {
                      showSnackbar("Validation successful, but with some issues. Confetti not triggered.", "info");
                  }
                }
                updateValidationSessionStorage(componentName, combinedResult.passed_file_url);              
                setValidationResult(combinedResult);
                setValidationFailedDialogOpen(true); // Always open dialog to show full results
            } catch (error) {
                console.error("Error during main validation API call:", error);
                const errorMessage =
                    error.response?.data?.detail || error.message || "An unexpected error occurred during main validation.";
                showSnackbar(`Main validation failed: ${errorMessage}`, "error");
                setValidateError(errorMessage);
                setIsValidated(false);
                setValidationResult({
                  status: "failed",
                  message: `Main validation failed: ${errorMessage}`,
                  error: errorMessage,
                  mainValidation: null,
                  legalEmployerValidation: legalEmployerValidationOutcome // Still include LE results if it ran
                });
                setValidationFailedDialogOpen(true);
            } finally {
                setValidateLoading(false);
            }
        };
        reader.onerror = (error) => {
            console.error("Error reading Excel file for Base64 conversion:", error);
            showSnackbar("Error reading Excel file for validation.", "error");
            setValidateLoading(false);
            setIsValidated(false);
        };
    } catch (error) { // This is the catch block for the outer try
        console.error("Unexpected error before file reading for validation:", error);
        showSnackbar(`An error occurred: ${error.message}`, "error");
        setValidateLoading(false);
        setIsValidated(false);
    }
  }, [rows, allMapping, allLookups, showSnackbar, isComponentSelected, excelFile, componentName, globalBoName, redInfoBoxMapping, redInfoBoxOpen, handleValidateLegalEmployerCrossFile, triggerConfetti, pythonFileName, hire_actions, rehire_actions, term_actions, globalTransferAction]); // Added dependencies


  const updateValidationSessionStorage = (componentName, fileUrl) => {
  try {
    if (!componentName || !fileUrl) {
      console.warn("⚠️ Missing componentName or fileUrl. Skipping sessionStorage update.");
      return;
    }

    const sessionKey = "validationSession";
    const existingSession = sessionStorage.getItem(sessionKey);
    let sessionObj = {};

    // If session already exists, parse it
    if (existingSession) {
      sessionObj = JSON.parse(existingSession);
    }

    // Create or update the entry for the current component
    sessionObj[componentName] = {
      validated: true,
      fileName: fileUrl.split("/").pop(),
    };

    // Save back to sessionStorage
    sessionStorage.setItem(sessionKey, JSON.stringify(sessionObj));
    console.log(`✅ Session storage updated for component: ${componentName}`);
  } catch (err) {
    console.error("❌ Failed to update validationSession in sessionStorage:", err);
  }
};

  // Effect to automatically open validation dialog if validationResult is set
  useEffect(() => {
    if (validationResult) {
      setValidationFailedDialogOpen(true);
      setValidationTabValue(0); // Reset to the first tab whenever dialog opens
    }
  }, [validationResult]);

  // Auto-save logic (unchanged from your original)
  useEffect(() => {
    if (saveTrigger > 0 && isValidated && !validateLoading && isComponentSelected) {
      const performSave = async () => {
        setValidateLoading(true);
        setValidateError(null);
        console.log("Auto-saving data...");
        console.log("Python file name for auto-save:", pythonFileName);
        const currentComponentName = getComponentName;
        const payload = {
          hierarchy: selectedItem?.hierarchy,
          datFileName: datFile?.name || "",
          attributes: rows, // This already contains the includeInDatFileGeneration
          allMapping: allMapping,
          allLookups: allLookups,
          pythonFileName: pythonFileName, // Save pythonFileName
        };

        try {
          const res = await axios.post(
            `${BASE_URL}/api/hdl/${currentComponentName}/save`,
            payload,
            { timeout: 30000 }
          );

          if (res.status === 200) {
            showSnackbar("Data saved successfully!", "success");
          } else {
            showSnackbar(
              `Failed to save data: ${res.data?.message || "Unknown error"}`,
              "error"
            );
          }
        } catch (err) {
          console.error("Auto-save failed:", err);
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "An unexpected error occurred during auto-save.";
          setValidateError(errorMessage);
          showSnackbar(`Auto-save failed: ${errorMessage}`, "error");
        } finally {
          setValidateLoading(false);
        }
      };

      performSave();
    }
  }, [saveTrigger, isValidated, validateLoading, rows, selectedItem, datFile, getComponentName, showSnackbar, allMapping, allLookups, isComponentSelected, pythonFileName]);

  // --- Session Storage Management for RedInfoBoxMapping ---
  // Load redInfoBoxMapping from sessionStorage when componentName changes
useEffect(() => {
  if (componentName) {
    getSourceKey(componentName).then((mapping) => {
      console.log("🎯 getSourceKey returned:", mapping);
      if (mapping) {
        setRedInfoBoxMapping(mapping);
        console.log("📦 Loaded source keys for:", componentName);
      } else {
        setRedInfoBoxMapping({});
        console.log("ℹ️ No mapping found for:", componentName);
      }
    }).catch(err => {
      console.error("❌ Error loading from IndexedDB:", err);
    });
  }
}, [componentName, showSnackbar]);


useEffect(() => {
  if (componentName) {
    if (Object.keys(redInfoBoxMapping).length > 0) {
      setSourceKey(componentName, redInfoBoxMapping)
        .then(() => console.log(`✅ Saved source keys for '${componentName}' to IndexedDB.`))
        .catch((err) => {
          console.error("❌ Failed to save to IndexedDB:", err);
          showSnackbar("Failed to save source keys.", "error");
        });
    }
  }
}, [redInfoBoxMapping, componentName, showSnackbar]);

useEffect(() => {
  console.log("Selected item changed:", selectedItem);
}, [selectedItem]);

useEffect(() => {
  if (!datFile) {
    let datName = "";
    // from level 3 append all values with "_" to the datName
    if (selectedItem && selectedItem.hierarchy && selectedItem.hierarchy.length > 2) {
      const level3Values = selectedItem.hierarchy.slice(2).map(item => item.value);
      datName = level3Values.join("_");
    }
    setDatFile(datName ? `${datName}.dat` : "default.dat");
    console.log("Setting default DAT file name:", datName ? `${datName}.dat` : "default.dat");
  }
}, [selectedItem, datFile]);




  // Reset states when a new component is selected
useEffect(() => {
  setColumns([]);
  setRows([]);
  setDatFile(null);
  setExcelFile(null);
  setDatProcessingLoading(false);
  setDatProcessingError(null);
  setValidateLoading(false);
  setValidateError(null);
  setIsValidated(false);
  setSaveTrigger(0);
  setLookupOpen(false);
  setSelectedAttributeForLookup("");
  setTransformationOpen(false);
  setSelectedAttributeForTransformation("");
  setAllLookups({});
  setAllMapping({});
  setTransformationLoading(false);
  setRedInfoBoxOpen(false);
  setIsChatBotOpen(false);
  setOracleDialogOpen(false);
  setIsTransformed(false);
  setValidationResult(null); // Reset validation result when component changes
  setValidationFailedDialogOpen(false); // Close dialog on component change
  setRemovePersonNumberList([]); // Clear person number list
  setPythonFileName(""); // Reset pythonFileName when component changes
  // redInfoBoxMapping is now handled by its own useEffect when componentName changes
  setActiveStep(0); // Reset stepper to first step
  // Reset setup data states as well
  setHireActions([]);
  setRehireActions([]);
  setTermActions([]);
  setGlobalTransferAction([]);
  setAssignmentStatusRules([]);
}, [selectedItem]);


  // Effect to update columns when allMapping or nlrRulesDict changes
  // Ensure this effect also includes the new column definition
  useEffect(() => {
    if (rows.length > 0) {
      setRows((prevRows) => {
        return prevRows.map((row) => ({
          ...row,
          "Data Transformation": Object.prototype.hasOwnProperty.call(allMapping, row.Attributes)
            ? allMapping[row.Attributes]
            : row["Data Transformation"]
        }));
      });
      const newColumns = [
        {
          field: "Attributes",
          headerName: "Attributes",
          width: 250,
          renderCell: (params) => {
            const helperText = params.row.helperText || "";
            return (
              <Tooltip title={helperText} arrow>
                <span>{params.row.Attributes}</span>
              </Tooltip>
            );
          },
        },
        {
          field: "required",
          headerName: "Required",
          width: 150,
          renderCell: (params) => {
            const attrKey = params.row.Attributes;
            const isMandatory = mandatoryMap?.[attrKey]?.mandatory ?? false; // ✅ use backend mandatory flag

            return (
              <Checkbox
                checked={!!params.value}
                disabled={isMandatory || datProcessingLoading || !isComponentSelected} // ✅ disable if backend says mandatory
                onChange={() => {
                  if (!isMandatory) {
                    handleCheckboxChange(params.id);
                  }
                }}
              />
            );
          },
        },
        {
          field: "keyValues",
          headerName: "Key Values",
          width: 150,
          renderCell: (params) => {
            const attrKey = params.row.Attributes;
            const keyVal = mandatoryMap?.[attrKey]?.key_values ?? false;

            return (
              <Checkbox
                checked={!!params.value}
                disabled={keyVal || datProcessingLoading || !isComponentSelected}
                onChange={() => {
                  if (!keyVal) {
                    setRows((prev) =>
                      prev.map((row) =>
                        row.id === params.id ? { ...row, keyValues: !row.keyValues } : row
                      )
                    );
                  }
                }}
              />
            );
          },
        },
        {
            field: "data_type", // <-- Corrected field name to match row property
            headerName: "Data Type",
            width: 150,
            renderCell: (params) => {
                return (
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {params.row.data_type || "-"} 
                    </Typography>
                );
            },
        },
        {
          field: "LookUp data",
          headerName: "LookUp Value",
          width: 200,
          renderCell: (params) => {
            const codeName = params.row.CodeName;
            const displayValue = params.value;
            return codeName ? (
              <Button
                variant="text"
                size="small"
                onClick={() => handleOpenLookup(params.row.Attributes)}
                disabled={datProcessingLoading || !isComponentSelected}
              >
                {displayValue || codeName}
              </Button>
            ) : (
              <span>-</span>
            );
          },
        },
        {
          field: "Data Transformation",
          headerName: "Data Transformation",
          width: 250,
          renderCell: (params) => {
            const attributeName = params.row.Attributes;
            const hasConfigurableMapping = Object.prototype.hasOwnProperty.call(allMapping, attributeName);
            const currentMappingValue = allMapping[attributeName];

            let buttonText = "-";
            const hasActualMappingValue = (currentMappingValue !== "" && currentMappingValue !== undefined && currentMappingValue !== null);

            if (hasConfigurableMapping && hasActualMappingValue) {
              buttonText = currentMappingValue;
            }

            const isDisabled = !hasConfigurableMapping || !hasActualMappingValue || datProcessingLoading || !isComponentSelected;

            return (
              <Button
                variant="text"
                size="small"
                disabled={isDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenDataTransformation(attributeName);
                }}
              >
                {buttonText}
              </Button>
            );
          },
        },
        {
          field: "includeInDatFileGeneration",
          headerName: "Include in Dat File Generation",
          width: 180,
          renderCell: (params) => (
            <Checkbox
              checked={params.row.includeInDatFileGeneration}
              onChange={() => handleIncludeInDatFileGenerationChange(params.id)}
              disabled={datProcessingLoading || !isComponentSelected}
            />
          ),
        },
      ];

      setColumns(newColumns);
      setIsValidated(false);
    }
  }, [allMapping, nlrRulesDict, rows.length, handleCheckboxChange,  mandatoryMap, handleOpenLookup, handleOpenDataTransformation, handleIncludeInDatFileGenerationChange, datProcessingLoading, isComponentSelected]);



  // Auto-upload DAT file based on selected component
  useEffect(() => {
    async function autoUploadDatFile() {
      if (
        selectedItem &&
        selectedItem.dat_template &&
        isComponentSelected &&
        !datFile
      ) {
        let datFileName = selectedItem.dat_template;
        if (!datFileName.endsWith('.dat')) {
          datFileName += '.dat';
        }
        try {
          const response = await fetch(
            `${BASE_URL}/static/${datFileName}`
          );
          if (!response.ok) {
            showSnackbar(`DAT file '${datFileName}' not found or inaccessible.`, 'warning');
            return;
          }
          const blob = await response.blob();
          const file = new File([blob], datFileName, { type: 'text/plain' });
          handleDatFileUpload(file);
        } catch (err) {
          showSnackbar(`Failed to auto-upload DAT file: ${err.message}`, 'error');
        }
      }
    }
    autoUploadDatFile();
  }, [selectedItem, isComponentSelected, datFile, handleDatFileUpload, showSnackbar]);


  // Auto-populate Excel file based on selected component
  useEffect(() => {
    if (selectedItem) {
      setIsTransformed(false);

      const attemptAutoPopulateExcel = async () => {
        let parentFolder = null;
        let excelFileBaseName = null;
        let excelFileName = null;

        // Priority 1: Use provided component Excel info
        if (selectedItem.excelFileForComponent && selectedItem.excelFileForComponentName) {
          parentFolder = selectedItem.hierarchy[5];
          excelFileName = selectedItem.excelFileForComponentName;
        }
        // Fallbacks using hierarchy
        else if (selectedItem.hierarchy && selectedItem.hierarchy.length > 1) {
          parentFolder = selectedItem.hierarchy[5];
          excelFileBaseName = selectedItem.hierarchy[selectedItem.hierarchy.length - 1];
          excelFileName = `${excelFileBaseName}.xlsx`;
        }
        else if (selectedItem.mappedExcelFile) {
          parentFolder = selectedItem.hierarchy[5];
          excelFileBaseName = selectedItem.level_2 || selectedItem.hierarchy[selectedItem.hierarchy.length - 1];
          excelFileName = `${excelFileBaseName}.xlsx`;
        }

        // Normalize parent folder to avoid full path issues
        if (parentFolder && parentFolder.includes('/')) {
          const parts = parentFolder.split('/');
          parentFolder = parts[parts.length - 1];
        }

        const customerName = selectedItem.hierarchy[0];
        const InstanceName = selectedItem.hierarchy[1] || "Not selected";

        console.log(`customerName is: ${customerName}`);
        console.log(`InstanceName is: ${InstanceName}`);
        console.log(`Parent Folder is: ${parentFolder}`);
        console.log(`Excel File Name is: ${excelFileName}`);

        if (parentFolder && excelFileName) {
          try {
            const response = await fetch(`${BASE_URL}/excel`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customerName,
                InstanceName,
                parent: parentFolder,
                filename: excelFileName.split(/[/\\]/).pop(),
              }),
            });

            if (!response.ok) {
              throw new Error(`Excel file '${excelFileName}' not found in /excel/${parentFolder}/.`);
            }

            const blob = await response.blob();
            const file = new File(
              [blob],
              excelFileName,
              { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            );

            setExcelFile(file);
            showSnackbar(`Auto-selected Excel: ${excelFileName}`, 'info');
          } catch (err) {
            console.error("Auto-population of Excel failed:", err);
            setExcelFile(null);
            showSnackbar(`Failed to auto-select Excel file: ${err.message}`, "warning");
          }
        } else {
          setExcelFile(null);
        }
      };

      attemptAutoPopulateExcel();
    }
  }, [selectedItem, showSnackbar, componentName]);

  useEffect(() => {
    console.log("RedInfoBox mapping updated:", redInfoBoxMapping);
  }, [redInfoBoxMapping]);

  // --- GSAP Animations ---
  useEffect(() => {
    if (mainContentRef.current) {
      gsap.fromTo(mainContentRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    if (headerSectionRef.current) {
      gsap.fromTo(headerSectionRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.2 }
      );
    }

    if (uploadDatButtonRef.current) {
      gsap.fromTo(uploadDatButtonRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out", delay: 0.4 }
      );
    }
  }, [selectedItem]);

  // Animation for dialogs
  useEffect(() => {
    const dialogs = [lookupOpen, transformationOpen, redInfoBoxOpen, isChatBotOpen, oracleDialogOpen, validationFailedDialogOpen];
    dialogs.forEach((isOpen, index) => {
      const dialogClassName = index === 4 ? '.MuiDialog-container-validation' : `.MuiDialog-container-${index}`;
      if (isOpen) {
        gsap.fromTo(document.querySelector(dialogClassName),
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.2)" }
        );
      } else {
        gsap.to(document.querySelector(dialogClassName),
          { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" }
        );
      }
    });
  }, [lookupOpen, transformationOpen, redInfoBoxOpen, isChatBotOpen, oracleDialogOpen, validationFailedDialogOpen]);


  // Function to render content for each step
  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Select Source Keys
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Typography variant="body1">Define source keys for mapping attributes.</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                setRedInfoBoxOpen(true);
              }}
              disabled={!isComponentSelected}
              sx={{ alignSelf: 'center' }} 
            >
              Open Source Keys Editor
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isComponentSelected || Object.keys(redInfoBoxMapping).length === 0} 
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      case 1: 
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Typography variant="body1">Upload and transform your customer Excel file. This step is Mandatory.</Typography>
            {(!selectedItem.excelFileForComponent && !selectedItem.mappedExcelFile && !excelFile) && (
              <label htmlFor="excel-upload-step">
                <input
                  type="file"
                  id="excel-upload-step"
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                      setExcelFile(file);
                      setIsTransformed(false);
                      showSnackbar(`Selected Excel: ${file.name}`, 'info');
                    } else {
                      showSnackbar("Please upload a valid Excel file.", "warning");
                      setExcelFile(null);
                      setIsTransformed(false);
                    }
                  }}
                  disabled={!isComponentSelected}
                />
                <Button
                  variant="outlined"
                  component="span"
                  disabled={!isComponentSelected}
                  sx={{ alignSelf: 'center' }} 
                >
                  Upload Excel File
                </Button>
              </label>
            )}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleApplyTransformationAndDownload}
              disabled={!excelFile || transformationLoading || !isComponentSelected || isTransformed}
              sx={{ alignSelf: 'center' }} 
            >
              {transformationLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Transform Customer Excel"
              )}
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between', width: '100%' }}>
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isComponentSelected || !isTransformed} 
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      
      case 2: // Oracle Value Check step
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Typography variant="body1">
              Oracle Value Checking and validation against Oracle system. This step is optional but recommended.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenOracleDialog}
              sx={{ alignSelf: 'center' }} 
              disabled={!isComponentSelected}
            >
              Start Oracle Value Check
            </Button>
            {oracleValidationPassed && (
              <Typography color="success.main" sx={{alignSelf: 'center' }}>
                ✓ Oracle validation completed successfully
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between', width: '100%' }}>
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
        

      case 3: 
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Typography variant="body1">Utilize NLP to define rules for data processing. This step is optional.</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsChatBotOpen(true)}
              disabled={!isComponentSelected}
              sx={{ alignSelf: 'center' }} 
            >
              Open NLP Chat
            </Button>
            {pythonFileName && (
              <Typography variant="body2" color="text.secondary" mt={1} sx={{ alignSelf: 'center' }}>
                Selected Python File: {pythonFileName}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between', width: '100%' }}>
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isComponentSelected} 
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      case 4: // Validate Data
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Typography variant="body1">Perform final data validation and review results.</Typography>
            <Button
              variant="contained"
              color={isValidated ? "success" : "primary"}
              onClick={handleValidateData}
              disabled={rows.length === 0 || validateLoading || datProcessingLoading || !isComponentSelected || !excelFile} 
              sx={{ alignSelf: 'center' }} // Left align this specific button
              aria-label="Validate Data" // Added aria-label to easily target this button with querySelector
            >
              {validateLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Validate Data"
              )}
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between', width: '100%' }}>
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
            </Box>
          </Box>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };


  return (
    <Box
      ref={mainContentRef}
      sx={{
        p: isSmallScreen ? 1 : 3,
        transform: collapsed ? "scale(0.95)" : "scale(1)",
        transformOrigin: "left center",
        transition: "transform 0.3s ease",
        width: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)`,
        ml: collapsed ? `${collapsedWidth}px` : `${drawerWidth}px`,
        mt: 0,
        minHeight: 'auto',
        pb: 8,
        position: 'relative',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
      >
      <Grid container spacing={2} mb={3} ref={headerSectionRef} id="header-section">
        <Grid item xs={12}>
          <Paper
            elevation={6}
            sx={{
              p: 3,
              borderRadius: 3,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: 3,
              background: (theme) =>
                theme.palette.mode === "light"
                  ? "linear-gradient(135deg, #fafafa, #f0f4ff)"
                  : "linear-gradient(135deg, #1e1e1e, #2a2a3d)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: 8,
                transform: "translateY(-2px)",
              },
            }}
          >
            {/* LEFT SIDE */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  letterSpacing: "0.5px",
                }}
              >
                {componentName ? `${componentName} Component` : "Unnamed Component"}
              </Typography>

              {/* Hierarchy Chips */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
                p: 1.2,
                borderRadius: 2,
                background: "linear-gradient(90deg, #fafafa, #f0f4ff)",
                boxShadow: "inset 0 0 4px rgba(0,0,0,0.08)",
              }}
            >
              {selectedItem?.hierarchy?.length > 0 ? (
                selectedItem.hierarchy.map((item, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    {index === selectedItem.hierarchy.length - 1 ? (
                      <Chip
                        label={item}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          px: 1.4,
                          borderRadius: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      />
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.85rem",
                        }}
                      >
                        {item}
                      </Typography>
                    )}

                    {index !== selectedItem.hierarchy.length - 1 && (
                      <ChevronRightIcon
                        sx={{
                          fontSize: "1rem",
                          color: "text.disabled",
                        }}
                      />
                    )}
                  </Box>
                ))
              ) : (
                <Chip label="No Hierarchy Selected" variant="outlined" />
              )}
            </Box>
            </Box>

            {/* Divider for desktop */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" }, mx: 2 }}
            />

            {/* RIGHT SIDE */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 2,
                minWidth: { xs: "100%", md: "350px" },
              }}
            >
              {/* Buttons Row */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<VisibilityIcon />}
                sx={{ borderRadius: 2, py: 1.2, fontWeight: 600 }}
                onClick={() => {
                  if (selectedItem?.dat_template) {
                    let datTemplateName = selectedItem.dat_template;
                    if (!datTemplateName.endsWith(".dat")) {
                      datTemplateName += ".dat";
                    }
                    const datUrl = `${BASE_URL}/static/${datTemplateName}`;

                    // ✅ Open in new tab only
                    window.open(datUrl, "_blank", "noopener,noreferrer");
                  } else {
                    showSnackbar("No DAT template available for this component.", "info");
                  }
                }}
                disabled={!isComponentSelected || !selectedItem?.dat_template}
              >
                View Existing HDL Template
              </Button>




                <label htmlFor="dat-upload" style={{ width: "100%" }}>
                  <input
                    type="file"
                    id="dat-upload"
                    accept=".dat"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.name.endsWith(".dat")) {
                        handleDatFileUpload(file);
                      } else {
                        showSnackbar("Please upload a valid .dat file.", "warning");
                        e.target.value = "";
                        setDatFile(null);
                      }
                    }}
                    disabled={!isComponentSelected}
                  />
                  <Button
                    fullWidth
                    ref={uploadDatButtonRef}
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={datProcessingLoading || !isComponentSelected}
                    sx={{ borderRadius: 2, py: 1.2, fontWeight: 500 }}
                  >
                    {datProcessingLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Upload Modified HDL Template"
                    )}
                  </Button>
                </label>
              </Box>

              {/* DAT File Chip (always at bottom) */}
              {datFile && (
                <Box
                  sx={{ display: "flex", justifyContent: "center", mt: 1 }}
                >
                  <Chip
                    icon={<DescriptionIcon />}
                    label={datFile.name}
                    variant="outlined"
                    sx={{
                      fontSize: "0.8rem",
                      maxWidth: "100%",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>




      <Box id="main-content-start" sx={{ pt: isSmallScreen ? 1.5 : 2, pb: isSmallScreen ? 2.5 : 4 }} ref={dataTableSectionRef}> {/* Adjusted pt and pb */}
        <DataTable
          columns={columns}
          rows={rows}
          ComponentName={componentName}
          loading={datProcessingLoading}
          error={datProcessingError}
          isComponentSelected={isComponentSelected}
          mandatoryMap={mandatoryMap}
        />
      </Box>

      {/* Excel Sheet Info Box */}
      <Box
        mt={4}
        mb={4}
        p={3}
        borderRadius={3}
        sx={{
          background: "linear-gradient(135deg, #e3f2fd, #fce4ec)", // soft blue-pink gradient
          border: "1px solid",
          borderColor: "#e0e0e0",
          boxShadow: 3,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          textAlign="center"
          color="primary"
          gutterBottom
        >
          📂 Excel Files
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center" >
          <b>Selected Excel:</b>{" "}
          <span style={{ color: "#424242" }}>
            {excelFile?.name || "None"}
          </span>
          {excelFile && isTransformed && (
            <Typography
              component="span"
              variant="caption"
              textAlign="center"
              sx={{
                color: "success.main",
                ml: 1,
                fontWeight: "bold",
              }}
            >
              ✅ (Transformed)
            </Typography>
          )}
        </Typography>
        {/* Download button to download the transformed excel */}
        {isTransformed && (
          <Box textAlign="center" mt={1}>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={handleDownloadTransformedExcel}
              sx={{ textTransform: "none" }}
            >
              Download Transformed Excel
            </Button>
          </Box>
        )}

      </Box>


      {/* NEW: Horizontal Stepper Implementation within an immersive box */}
      <Paper
        elevation={4} /* Adjusted elevation */
        sx={{
          p: isSmallScreen ? 2 : 4,
          mt: 4,
          borderRadius: 4,
          bgcolor: 'background.paper',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          alignContent: 'center',
          justifyContent: 'center'
        }}
      >
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4, flexWrap: 'wrap' }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ p: isSmallScreen ? 1 : 2 }}>
          {activeStep === steps.length ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                All steps completed - you're finished!
              </Typography>
              {/* Removed the "Reset Workflow" button */}
              {/* <Button onClick={handleReset} variant="contained" color="primary">
                Reset Workflow
              </Button> */}
            </Box>
          ) : (
            getStepContent(activeStep)
          )}
        </Box>
      </Paper>

      {/* MODIFIED: Validation Result Dialog with Tabs */}
      <Dialog
        open={validationFailedDialogOpen}
        onClose={() => setValidationFailedDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ className: 'MuiDialog-container-validation' }}
      >
        <DialogTitle sx={{ bgcolor: validationResult?.status === "failed" ? "#ffebee" : "#e8f5e9", color: validationResult?.status === "failed" ? "#b71c1c" : "#1b5e20" }}>
          Validation Results
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={validationTabValue} onChange={handleValidationTabChange} aria-label="validation result tabs">
              <Tab label="Overall Validation" id="validation-tab-0" />
              {/* Conditional rendering for Legal Employer Validation Tab */}
              {validationResult?.legalEmployerValidation && (
                <Tab
                  label="Legal Employer Validation"
                  id="validation-tab-1"
                  sx={{
                    color: validationResult.legalEmployerValidation.status === 'failed' ? 'error.main' : 'success.main',
                  }}
                />
              )}
            </Tabs>
          </Box>

          {/* Overall Validation Tab Panel */}
          <TabPanel value={validationTabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Overall Summary
            </Typography>
            <Typography variant="body1" color="text.primary" mb={2}>
              {validationResult?.message || "Validation process completed."}
            </Typography>
            {validationResult?.mainValidation && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Main Data Validation:</Typography>
                <Typography variant="body2" color="text.secondary">
                  Passed Records: {validationResult.mainValidation.passed_records_count ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Failed Records: {validationResult.mainValidation.failed_records_count ?? 0}
                </Typography>
                {validationResult.passed_file_url && (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => handleOpenFailedExcel(validationResult.passed_file_url)}
                    target="_blank"
                    sx={{ mt: 1, mr: 1 }}
                  >
                    View Passed Records (.dat)
                  </Button>
                )}
                {validationResult.failed_file_url && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleOpenFailedExcel(validationResult.failed_file_url)}
                    sx={{ mt: 1 }}
                  >
                    View Failed Records (.xlsx)
                  </Button>
                )}
                {validationResult.mainValidation.summary?.messages?.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" fontWeight="bold">Messages:</Typography>
                    <List dense>
                      {validationResult.mainValidation.summary.messages.map((msg, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemText primary={`- ${msg}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </TabPanel>

          {/* Legal Employer Validation Tab Panel */}
          {validationResult?.legalEmployerValidation && (
            <TabPanel value={validationTabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Legal Employer Cross-File Validation
              </Typography>
              <Typography variant="body1" color="text.primary" mb={2}>
                {validationResult.legalEmployerValidation.message}
              </Typography>
              {validationResult.legalEmployerValidation.inconsistent_records?.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table stickyHeader size="small" aria-label="inconsistent legal employer records">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ px: 1.5, py: 0.6 }}>Person Number</TableCell>
                        <TableCell sx={{ px: 1.5, py: 0.6 }}>Effective Start Date</TableCell>
                        <TableCell sx={{ px: 1.5, py: 0.6 }}>Action Code</TableCell>
                        <TableCell sx={{ px: 1.5, py: 0.6 }}>Legal Employer</TableCell>
                        <TableCell sx={{ px: 1.5, py: 0.6 }}>Scenario</TableCell>
                        <TableCell sx={{ px: 1.5, py: 0.6 }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResult.legalEmployerValidation.inconsistent_records.map((record, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ px: 1.5, py: 0.6 }}>{record.PersonNumber}</TableCell>
                          <TableCell sx={{ px: 1.5, py: 0.6 }}>{record.EffectiveStartDate || "N/A"}</TableCell>
                          <TableCell sx={{ px: 1.5, py: 0.6 }}>{record.ActionCode || "N/A"}</TableCell>
                          <TableCell sx={{ px: 1.5, py: 0.6 }}>{record.LegalEmployerName}</TableCell>
                          <TableCell sx={{ px: 1.5, py: 0.6 }}>{record.Scenario}</TableCell>
                          <TableCell sx={{ px: 1.5, py: 0.6 }}>{record.Status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No inconsistencies found.
                </Typography>
              )}
              {validationResult.legalEmployerValidation.error && (
                <Typography variant="body2" color="error.main" mt={1}>
                  Error: {validationResult.legalEmployerValidation.error}
                </Typography>
              )}
            </TabPanel>
          )}
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={() => setValidationFailedDialogOpen(false)} color="primary">
            Close
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Error Excel Previewer */}
      <Dialog
        open={failedExcelDialogOpen}
        onClose={handleCloseFailedExcel}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Failed Records Preview</DialogTitle>
        <DialogContent dividers>
          {failedExcelUrl ? (
            <FilePreviewer
              fileUrl={failedExcelUrl}
              fileType={failedExcelUrl.endsWith(".dat") ? "dat" : "excel"}
            />
          ) : (
            <Typography>No failed records file available</Typography>
          )}
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={handleCloseFailedExcel} color="primary">
            Close
          </Button>
        </MuiDialogActions>
      </Dialog>



      {/* Other Dialogs and Snackbar */}
      <RedInfoBox
        customerName={customerName}
        instanceName={InstanceName}
        selectedComponentName={componentName}
        HDL_ATTRIBUTES={skippedColumns}
        allattributes={rows.map(row => row.Attributes)}
        open={redInfoBoxOpen}
        onClose={() => {
          setRedInfoBoxOpen(false);
          // Only advance if RedInfoBox was opened from the current active step (Source Keys) and mapping is available
          if (activeStep === 0 && Object.keys(redInfoBoxMapping).length > 0) {
            handleNext(); 
          }
        }}
        onMappingChange={setRedInfoBoxMapping} // This is the crucial prop for updating state in parent
        initialMapping={redInfoBoxMapping} // Pass the current state as initial mapping
      />

      <Dialog
        open={lookupOpen}
        onClose={() => setLookupOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: 'MuiDialog-container-0' }}
      >

        <DialogTitle
          sx={{
            bgcolor: "#1e293b",
            color: "#e3f2fd",
            textAlign: "center",
          }}
        >
          Lookup Values for {selectedAttributeForLookup}
          <Button
            onClick={() => setLookupOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: "#e3f2fd" }}
          >
            <GridCloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Lookup
            open={lookupOpen}
            onClose={() => setLookupOpen(false)}
            attribute={selectedAttributeForLookup}
            hdlAttribute={selectedAttributeForLookup}
            selectedItem={selectedItem}
            ParentBO={componentName}
            GlobalBO={globalBoName}
            lookups={allLookups}
            LookupValue={handleLookupSelect}
          />
        </DialogContent>
        <MuiDialogActions
          sx={{
            bgcolor: "#1e293b",
            color: "#e3f2fd",
            justifyContent: "center",
          }}
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setLookupOpen(false)}
            sx={{ color: "#e3f2fd" }}
          >
            Close
          </Button>
        </MuiDialogActions>
      </Dialog>

      <DataTransformationDialog
          open={transformationOpen}
          RawExcelFile={excelFile}
          onClose={() => setTransformationOpen(false)}
          collapsed={collapsed}
          initialSelectedAttribute={selectedAttributeForTransformation}
          attribute_list={Object.keys(allMapping)
            .filter(attr => allMapping[attr] !== null && allMapping[attr] !== undefined && Object.keys(allMapping[attr]).length > 0)
            .map((attr) => ({
              attribute: attr,
              mapping: allMapping[attr],
            }))}
          onSaveCustomerOracleReplacements={setCustomerOracleReplacements}
          PaperProps={{ className: 'MuiDialog-container-1' }}
        />
      {isChatBotOpen && (
        <ChatBotComponent
          excelFile={excelFile}
          selectedItem={selectedItem}
          componentName={componentName}
          customerName={customerName}
          instanceName={InstanceName}
          allattributes={rows.map(row => row.Attributes)}
          open={isChatBotOpen}
          onClose={() => {
            setIsChatBotOpen(false);
            if (activeStep === 2) {
              handleNext();
            }
          }}
          pythonFileName={pythonFileName} // Pass the current pythonFileName
          onPythonFileNameChange={setPythonFileName} // Pass the setter function as a callback
          PaperProps={{ className: 'MuiDialog-container-2' }}
        />
      )}

      {oracleDialogOpen && (
        <OracleValueCheck
          customerName={customerName}
          instanceName={InstanceName}
          componentName={componentName}
          open={oracleDialogOpen}
          setOracleValidationSets={setOracleValidationSets} // 👈 updated prop name
          onClose={handleCloseOracleDialog}
          onValidationComplete={(success) => {
            console.log("Oracle validation completed with status:", success);
            console.log("Oracle validation sets:", oracleValidationsets); // Log the sets for debugging
            setOracleValidationPassed(success);
            if (success) {
              showSnackbar("Oracle validation completed successfully", "success");
            }
          }}
        />

          )}
          

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default HDL;
