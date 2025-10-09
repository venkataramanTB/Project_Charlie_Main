import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Popover,
  Chip,
  Fade,
  Paper,
  Alert
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PreviewIcon from "@mui/icons-material/RemoveRedEye";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from "axios";
import { DataGrid } from '@mui/x-data-grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import * as XLSX from 'xlsx';

import { gsap } from 'gsap';
import RulePaper from './RulePaper.jsx';
import ErrorDisplay from './ErrorDisplay.jsx'; // Import the new error component

const initialNLRs = [];

// ChatBotComponent now accepts pythonFileName and onPythonFileNameChange props
const ChatBotComponent = ({ attribute, allattributes, open, onClose, componentName, pythonFileName, onPythonFileNameChange, customerName, instanceName, excelFile }) => {
  const [nlrs, setNlrs] = useState(initialNLRs);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(excelFile || null); // State for uploaded CSV/Excel file
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(""); // State for the primary attribute for validation
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [pythonCode, setPythonCode] = useState("");
  const [PythonFileName, setPythonFileName] = useState(""); // Internal state for Python file name
  const chipRefs = useRef([]); // Refs for attribute chips in the popover
  const rulePaperAnimations = useRef({}); // GSAP animation timelines for RulePaper components
  const apiEndpoint = "http://localhost:9000";
  const EndpointBackPoint = process.env.REACT_APP_API_ENDPOINT || apiEndpoint;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [attributePopoverAnchorEl, setAttributePopoverAnchorEl] = useState(null);
  const [focusedNlrIndex, setFocusedNlrIndex] = useState(null); // Index of the NLR being edited when popover is open

  // Refs for GSAP animations
  const dialogPaperRef = useRef(null);
  const loadingBoxRef = useRef(null);
  const previewDialogPaperRef = useRef(null);
  const snackbarRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadButtonRef = useRef(null);

  // GSAP animation for the main dialog opening/closing
  useEffect(() => {
    if (dialogPaperRef.current) {
      if (open) {
        gsap.fromTo(dialogPaperRef.current,
          { y: 50, opacity: 0, scale: 0.95, pointerEvents: 'none' },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out", pointerEvents: 'auto', overwrite: true }
        );
      } else {
        gsap.to(dialogPaperRef.current,
          { y: 50, opacity: 0, scale: 0.95, duration: 0.4, ease: "power2.in", overwrite: true, onComplete: () => { } }
        );
      }
    }
  }, [open]);

  // GSAP animation for the loading indicator
  useEffect(() => {
    if (loading && loadingBoxRef.current) {
      gsap.fromTo(loadingBoxRef.current,
        { opacity: 0, scale: 0.8, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)", overwrite: true }
      );
    }
  }, [loading]);

  // GSAP animation for the preview dialog opening/closing
  useEffect(() => {
    if (previewDialogPaperRef.current) {
      if (previewOpen) {
        gsap.fromTo(previewDialogPaperRef.current,
          { y: -50, opacity: 0, scale: 0.9, rotationX: -15, pointerEvents: 'none' },
          { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 0.6, ease: "elastic.out(1, 0.7)", pointerEvents: 'auto', overwrite: true }
        );
      } else {
        gsap.to(previewDialogPaperRef.current,
          { y: -50, opacity: 0, scale: 0.9, rotationX: 15, duration: 0.5, ease: "power2.in", overwrite: true, onComplete: () => { } }
        );
      }
    }
  }, [previewOpen]);

  // GSAP animation for DataGrid rows when validation results are displayed
  useEffect(() => {
    if (validationResult && (validationResult.passed_rows?.length > 0 || validationResult.invalid_rows?.length > 0)) {
      const rows = document.querySelectorAll('.MuiDataGrid-row');
      if (rows.length > 0) {
        gsap.from(rows, {
          opacity: 0,
          y: 20,
          stagger: 0.05,
          duration: 0.4,
          ease: "power2.out",
          delay: 0.2,
          overwrite: true
        });
      }
    }
  }, [validationResult, tab]);

  // GSAP animation for the Snackbar
  useEffect(() => {
    if (snackbarOpen && snackbarRef.current) {
      gsap.fromTo(snackbarRef.current,
        { y: 50, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)", overwrite: true }
      );
    }
  }, [snackbarOpen]);

  // Effect to update internal pythonFileName state and notify parent component
  useEffect(() => {
    if (pythonFileName) {
      setPythonFileName(pythonFileName);
      // Call the callback to update the parent's state
      if (onPythonFileNameChange) {
        onPythonFileNameChange(pythonFileName);
      }
      if (open) { // Reset NLRs and CSV states when dialog opens with a new pythonFileName
        setNlrs(initialNLRs);
        setCsvFile(null);
        setCsvHeaders([]);
      }
      console.log(`Python file name updated: ${pythonFileName}`);
      setSnackbarMsg(`Python file name updated: ${pythonFileName}`);
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    }
  }, [pythonFileName, open, onPythonFileNameChange]);

  // GSAP animation for the file upload button on hover
  useEffect(() => {
    const button = uploadButtonRef.current;
    if (!button) return;

    gsap.set(button, { transformOrigin: "center center" });

    const hoverAnim = gsap.to(button, {
      scale: 1.05,
      rotation: 2,
      ease: "power1.inOut",
      paused: true,
      duration: 0.2,
      overwrite: true
    });

    button.addEventListener("mouseenter", () => hoverAnim.play());
    button.addEventListener("mouseleave", () => hoverAnim.reverse());

    return () => {
      button.removeEventListener("mouseenter", () => hoverAnim.play());
      button.removeEventListener("mouseleave", () => hoverAnim.reverse());
    };
  }, []);

  // Callback for animating individual RulePaper components based on intersection
  const ruleAnimation = useCallback((element, isIntersecting, index) => {
    if (!element) return;

    if (!rulePaperAnimations.current[index]) {
      gsap.set(element, { opacity: 0, y: 50, scale: 0.8, rotation: -5 });

      rulePaperAnimations.current[index] = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.out" }
      })
      .to(element, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.7)",
        overwrite: true,
        onReverseComplete: () => {
            gsap.set(element, { opacity: 0, y: 50, scale: 0.8, rotation: -5, overwrite: true });
        }
      });
    }

    const tl = rulePaperAnimations.current[index];

    if (isIntersecting) {
        if (tl.progress() < 1) {
           tl.play();
        }
    } else {
        if (tl.progress() > 0) {
           tl.reverse();
        }
    }
  }, []);

  // Set selectedAttribute based on component's attribute prop or first CSV header
  useEffect(() => {
    if (csvHeaders.length > 0) {
      if (attribute && csvHeaders.includes(attribute)) {
        setSelectedAttribute(attribute);
      } else {
        setSelectedAttribute(csvHeaders[0] || "");
      }
    } else {
      setSelectedAttribute("");
    }
  }, [attribute, csvHeaders]);

  // Fetch initial NLRs from backend when attribute prop changes
  useEffect(() => {
    if (!attribute) return;
    setLoading(true);
    setError("");
    axios.get(`${apiEndpoint}/api/hdl/nlr/batch`, { params: { attribute } })
      .then(res => {
        if (res.data && res.data.rules) {
          setNlrs(res.data.rules);
        } else {
          setNlrs(initialNLRs);
        }
      })
      .catch(err => {
        setSnackbarMsg("Failed to load rules from backend: " + (err?.response?.data?.error || err.message));
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setNlrs(initialNLRs);
      })
      .finally(() => setLoading(false));
  }, [attribute, componentName, customerName, instanceName]);


  // Handles saving the generated Python code and NLRs to the backend
  const handleSaveCode = async () => {
    try {
      gsap.to(".save-button", { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1, ease: "power1.inOut" });
      setLoading(true);
      const res = await axios.post(`${EndpointBackPoint}/api/hdl/save_code`, {
      code: pythonCode,
      component_name: componentName || "default_component",
      attribute: selectedAttribute,
      rules: nlrs,
      conditions: [], // or any conditions you want
      customerName: customerName, // example placeholder
      instanceName: instanceName, // example placeholder
    });

      if (res.data.success) {
        const newFileName = res.data.filename || "rules.py";
        setPythonFileName(newFileName); // Update internal state
        if (onPythonFileNameChange) {
          onPythonFileNameChange(newFileName); // Call callback to update parent
        }
        setSnackbarMsg(`Python code saved successfully! File: ${newFileName}`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
        setSnackbarMsg("Failed to save Python code: " + res.data.error);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
      onClose(); // Close the dialog after saving
    } catch (err) {
      setSnackbarMsg("Error saving code: " + (err?.response?.data?.error || err.message));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handles changes to an individual NLR text field
  const handleNlrChange = (idx, value) => {
    setNlrs((prev) => prev.map((nlr, i) => (i === idx ? value : nlr)));
  };

  // Adds a new empty NLR field
  const handleAddNlr = () => {
    setNlrs((prev) => [...prev, ""]);
    gsap.to(".add-rule-button", { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1, ease: "power1.inOut" });
  };

  // Removes an NLR field with animation
  const handleRemoveNlr = (idx) => {
    const elementToRemove = document.getElementById(`rule-paper-${idx}`);
    if (elementToRemove) {
      gsap.to(elementToRemove, {
        opacity: 0,
        x: 50,
        scale: 0.7,
        rotation: 15,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setNlrs((prev) => prev.filter((_, i) => i !== idx));
          delete rulePaperAnimations.current[idx]; // Clean up GSAP animation instance
        }
      });
    } else {
      setNlrs((prev) => prev.filter((_, i) => i !== idx));
      delete rulePaperAnimations.current[idx];
    }
  };

  useEffect(() => {
    if (excelFile) {
      handleExcelChange({ target: { files: [excelFile] } });
    }
  }, [excelFile]);


  useEffect(() => {
  if (excelFile instanceof File) {
    console.log("Received excelFile prop:", excelFile);
    // Simulate user file upload so parsing runs
    handleExcelChange({ target: { files: [excelFile] } });
  } else if (excelFile) {
    console.warn("excelFile is not a File instance:", excelFile);
  }
}, [excelFile]);


// Handles Excel/CSV file upload and parses headers
const handleExcelChange = (e) => {
  const file = e.target.files[0];
  setValidationResult(null);
  setError("");

  if (!file) {
    setCsvHeaders([]);
    setCsvFile(null);
    setSnackbarMsg("No file selected.");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
    return;
  }

  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
    setSnackbarMsg("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    setCsvHeaders([]);
    setCsvFile(null);
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const wsname = componentName || workbook.SheetNames[0];
      const ws = workbook.Sheets[workbook.SheetNames.includes(componentName) ? componentName : workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      const lines = csv.split(/\r?\n/);

      // --- Now use the 1st row as headers ---
      const headers = lines[0].split(",").map(h => h.trim());
      if (headers.some(h => h === "" || h.toLowerCase() === "unnamed: 0")) {
        setSnackbarMsg("Warning: Some headers appear empty after parsing. Please check your file format.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
      }
      setCsvHeaders(headers);
      console.log("Parsed CSV Headers:", headers);

      // Use the remaining lines as CSV content
      const newCsvContent = lines.join("\n"); // all rows including header
      const csvFileObj = new File([newCsvContent], file.name.replace(/\.xlsx?$/, '.csv'), { type: 'text/csv' });
      setCsvFile(csvFileObj);
      setSnackbarMsg(`File "${file.name}" loaded!`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (parseError) {
      setSnackbarMsg(`Error parsing file: ${parseError.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setCsvHeaders([]);
      setCsvFile(null);
    }
  };

  reader.readAsArrayBuffer(file);
};


  // Handles the preview functionality: sends CSV and rules to backend for validation
  const handlePreview = async () => {
    setLoading(true);
    setValidationResult(null);
    setError("");
    setPythonCode("");

    gsap.to(".preview-button", { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1, ease: "power1.inOut" });

    try {
      if (!csvFile) {
        setSnackbarMsg("Please upload a CSV/Excel file before previewing.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      const rules = nlrs.filter((r) => r.trim());
      if (rules.length === 0) {
        setSnackbarMsg("Please add at least one rule before previewing.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      const csvText = await csvFile.text();
      const lines = csvText.split(/\r?\n/);
      if (!lines[0]) throw new Error("CSV file is empty or malformed.");

      // Headers are now expected to be the first line of the csvFile (after internal processing)
      let headers = lines[0].split(",").map(h => h.trim());

      // Construct validation rules payload for the backend
      const validationRulesForBackend = {
          validations: [
              rules.reduce((acc, rule) => {
                  if (selectedAttribute && rule.trim()) { // Apply rules to the selected attribute if one is chosen
                      acc[selectedAttribute] = (acc[selectedAttribute] ? acc[selectedAttribute] + " and " : "") + rule;
                  }
                  return acc;
              }, {})
          ]
      };

      // If no specific attribute is selected but rules exist, apply them as generic rules
      if (Object.keys(validationRulesForBackend.validations[0]).length === 0 && rules.length > 0) {
          validationRulesForBackend.validations[0]['_generic_rules'] = rules.join(" and ");
      }

      const validationFileContent = JSON.stringify(validationRulesForBackend, null, 2);
      const validationFileBlob = new Blob([validationFileContent], { type: 'application/json' });
      const validationFileObj = new File([validationFileBlob], 'validation_rules.json', { type: 'application/json' });

      const formData = new FormData();
      formData.append("csv_file", csvFile);
      formData.append("validation_file", validationFileObj);
      formData.append("component_name", componentName || "default_component");

      const res = await axios.post(`${apiEndpoint}/validate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setValidationResult(res.data);
      setPythonCode(res.data.generated_code || "");
      setSnackbarMsg("Validation preview successful!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error during preview:", err);

      let errorMessage = "An unexpected error occurred during validation.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          const status = err.response.status;
          const detail = err.response.data?.detail;

          switch (status) {
            case 400:
              errorMessage = detail || "Invalid data. Please check your rules or file format.";
              break;
            case 404:
              errorMessage = "Validation service not found. Please contact your admin.";
              break;
            case 408:
              errorMessage = "Server took too long to respond. Try again later.";
              break;
            case 413:
              errorMessage = "File too large. Try a smaller dataset.";
              break;
            case 500:
              errorMessage =
                "💥 Internal server error — something went wrong on our side. Please try again after a few moments.";
              break;
            default:
              errorMessage = detail || `Unexpected server response (${status}).`;
          }
        } else if (err.request) {
          errorMessage = "⚠️ No response from server. Check your internet connection.";
        } else {
          errorMessage = `Request setup error: ${err.message}`;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }

      // Update UI
      setError(errorMessage);
      setSnackbarMsg(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
 finally {
      setLoading(false);
    }
  };

  // Handles downloading passed rows as a CSV file
  const handleDownloadPassed = () => {
    if (!validationResult?.passed_rows?.length) {
      setSnackbarMsg("No passed rows to download.");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      return;
    }
    const headers = Object.keys(validationResult.passed_rows[0]);
    const csvRows = [headers.join(",")];
    validationResult.passed_rows.forEach(row => {
      csvRows.push(headers.map(h => JSON.stringify(h in row ? row[h] : "")).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validated_passed_rows.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSnackbarMsg("Passed rows CSV downloaded!");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  // Inserts an attribute name into the currently focused NLR input field
  const handleAttributeInsert = (attributeName) => {
    if (focusedNlrIndex !== null) {
      const inputElement = rulePaperAnimations.current[focusedNlrIndex]?.inputElement;

      if (inputElement) {
        const start = inputElement.selectionStart;
        const end = inputElement.selectionEnd;
        const currentValue = nlrs[focusedNlrIndex];

        const newValue =
          currentValue.substring(0, start) +
          `{${attributeName}}` + // Format attribute for insertion
          currentValue.substring(end);

        setNlrs((prev) =>
          prev.map((nlr, i) => (i === focusedNlrIndex ? newValue : nlr))
        );

        // Set cursor position after insertion
        setTimeout(() => {
          const newCursorPosition = start + `{${attributeName}}`.length;
          inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
          inputElement.focus();
        }, 0);
      }
    }
    // Popover remains open to allow further insertions or attribute selection
  };

  // Handles opening the attribute popover
  const handleOpenAttributePopover = (event, idx) => {
    setAttributePopoverAnchorEl(event.currentTarget);
    setFocusedNlrIndex(idx); // Set the index of the NLR being edited

    // Animate chips when popover opens
    setTimeout(() => {
      if (chipRefs.current.length > 0) {
        gsap.from(chipRefs.current, {
          opacity: 0,
          scale: 0.5,
          y: -10,
          stagger: 0.05,
          duration: 0.3,
          ease: "back.out(1.7)",
          overwrite: true
        });
      }
    }, 50);
  };

  // Focus on the first NLR input when dialog opens and NLRs are present
  useEffect(() => {
    if (open && nlrs.length > 0) {
      const firstInputElement = rulePaperAnimations.current[0]?.inputElement;
      if (firstInputElement) {
        firstInputElement.focus();
      }
    }
  }, [open, nlrs]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          ref: dialogPaperRef,
          sx: { borderRadius: 4, overflow: 'hidden', boxShadow: 8, transform: 'translateY(0)', opacity: 1 }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#222c36', color: 'white', fontWeight: 700, textAlign: 'center', fontSize: 22, letterSpacing: 1, p: 3, position: 'relative' }}>
          Natural Language Rules (NLR) {attribute}
          <IconButton
            aria-label="close"
            onClick={() => {
              gsap.to(".dialog-close-button", { rotation: 360, scale: 0.8, duration: 0.3, ease: "back.in", overwrite: true, onComplete: onClose });
            }}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', transform: 'scale(1.1) rotate(15deg)' },
              zIndex: 2
            }}
            size="small"
            className="dialog-close-button"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f7fafd', p: 0, minHeight: 400 }}>
          <Box sx={{ px: 3, pt: 3, pb: 1 }}>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Define rules in plain English. These rules will be used for data transformation or validation.<br/>
              <span style={{color:'#7c4dff',fontWeight:600}}>Note:</span> AI model may hallucinate output; please review them carefully before saving.
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Upload Excel file for validation:
              </Typography>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => {
                  fileInputRef.current.click();
                  gsap.fromTo(uploadButtonRef.current,
                    { scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0 },
                    {
                      scaleY: 0.9, scaleX: 1.1, duration: 0.1, ease: "power1.inOut",
                      yoyo: true, repeat: 1,
                      onComplete: () => {
                        gsap.to(uploadButtonRef.current, { scale: 1, rotation: 0, duration: 0.2, ease: "back.out(1.7)" });
                      }
                    }
                  );
                }}
                ref={uploadButtonRef}
                sx={{
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: 2,
                  boxShadow: 3,
                  bgcolor: '#8e24aa',
                  '&:hover': {
                    bgcolor: '#ab47bc',
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                {csvFile ? `File: ${csvFile.name.substring(0, 20)}${csvFile.name.length > 20 ? '...' : ''}` : "Choose File"}
              </Button>
              {csvFile && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'inline-block' }}>
                  ({(csvFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', px: 3, pb: 3, pt: 1 }}>
            {/* Left Column: Rules - now takes full width */}
            <Box sx={{ flex: 1, maxHeight: 280, overflowY: 'auto' }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  {nlrs.map((nlr, idx) => (
                    <React.Fragment key={idx}>
                      <RulePaper
                        nlr={nlr}
                        idx={idx}
                        onNlrChange={handleNlrChange}
                        onRemoveNlr={nlrs.length === 1 ? null : handleRemoveNlr}
                        csvHeaders={csvHeaders} // Still pass headers for potential display within RulePaper if needed
                        onOpenAttributePopover={handleOpenAttributePopover}
                        ruleAnimation={ruleAnimation}
                        rulePaperAnimations={rulePaperAnimations}
                      />
                      {idx < nlrs.length - 1 && (
                        <Box display="flex" alignItems="center" justifyContent="center" sx={{ my: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="primary.main"
                            sx={{
                              fontWeight: 700,
                              animation: `andPulse-${idx} 1.5s infinite alternate`,
                              [`@keyframes andPulse-${idx}`]: {
                                '0%': { transform: 'scale(1)' },
                                '100%': { transform: 'scale(1.05)' },
                              },
                            }}
                          >
                            AND
                          </Typography>
                        </Box>
                      )}
                    </React.Fragment>
                  ))}
                  <Button
                    onClick={handleAddNlr}
                    color="primary"
                    variant="text"
                    size="large"
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ alignSelf: 'center', fontWeight: 700, mt: 1, fontSize: 16, letterSpacing: 0.5 }}
                    className="add-rule-button"
                  >
                    Add Rule
                  </Button>
                </Box>
            </Box>
          </Box>
        </DialogContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} p={2} bgcolor="#f7fafd">
          <Button
            onClick={() => { setPreviewOpen(true); handlePreview(); }}
            color="secondary"
            variant="outlined"
            startIcon={<PreviewIcon />}
            sx={{ fontWeight: 700, minWidth: 120, fontSize: 16, borderRadius: 2, boxShadow: 2 }}
            disabled={loading}
            className="preview-button"
          >
            {loading ? <CircularProgress size={24} /> : "Preview"}
          </Button>
          <Button
            onClick={handleSaveCode}
            color="primary"
            variant="contained"
            sx={{ fontWeight: 700, minWidth: 140, fontSize: 16, borderRadius: 2, boxShadow: 2 }}
            disabled={loading}
            className="save-button"
          >
            Save NLP Rules
          </Button>
        </Box>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth={false} PaperProps={{ ref: previewDialogPaperRef, sx: { borderRadius: 4, overflow: 'hidden', boxShadow: 8, width: 800, minWidth: 400, ml: 2, mr: 2} }} TransitionComponent={Fade}>
        <DialogTitle sx={{ bgcolor: '#512da8', color: 'white', fontWeight: 700, textAlign: 'center', fontSize: 20, letterSpacing: 1, p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <PreviewIcon sx={{ color: '#b39ddb', fontSize: 26 }} />
            Validation Preview
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f3e5f5', p: 3, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          {error && !loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <ErrorDisplay
                    title="Validation Failed"
                    message={error}
                    onDismiss={() => setError("")}
                    onRetry={() => {
                        setError("");
                        handlePreview();
                    }}
                  />
              </Box>
          )}
          {loading && (
            <Box
              ref={loadingBoxRef}
              display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" sx={{ minHeight: 400, gap: 4, flex: 1 }}>
              <Box sx={{ width: '80%', maxWidth: 400 }}>
                <LinearProgress
                  sx={{
                    height: 16,
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #ede7f6 0%, #d1c4e9 100%)',
                    boxShadow: '0 0 24px 4px #b39ddb',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #7c4dff 0%, #00e676 100%)',
                      boxShadow: '0 0 16px 4px #7c4dff',
                    },
                  }}
                  variant="indeterminate"
                  color="secondary"
                />
              </Box>
              <Box mt={2} justifyContent={"center"} alignItems={"center"} textAlign={"center"}>
                <Typography variant="h6" sx={{ color: '#512da8', fontWeight: 700, letterSpacing: 1, textShadow: '0 2px 8px #b39ddb' }}>
                  Validating your data with AI magic...
                </Typography>
                <Typography variant="body2" sx={{ color: '#7c4dff', mt: 1, fontStyle: 'italic', fontWeight: 500 }}>
                  Please wait while we process your file and rules.<br />
                  <span style={{ animation: 'pulse 1.5s infinite', color: '#00e676', justifyContent: "center"}}>✨</span> This won’t take long! <span style={{ animation: 'pulse 1.5s infinite', color: '#00e676' }}>✨</span>
                </Typography>
              </Box>
              <style>{`
                @keyframes pulse {
                  0% { opacity: 1; }
                  50% { opacity: 0.3; }
                  100% { opacity: 1; }
                }
              `}</style>
            </Box>
          )}
          {!error && !loading && validationResult && (
            <>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label={`Passed Rows (${validationResult.passed_rows?.length || 0})`} />
                <Tab label={`Invalid Rows (${validationResult.invalid_rows?.length || 0})`} />
              </Tabs>
              {tab === 0 && (
                <Box>
                  <Button onClick={handleDownloadPassed} color="success" variant="outlined" sx={{ mb: 1, fontWeight: 700 }} disabled={!validationResult.passed_rows?.length}>
                    Download Passed as CSV
                  </Button>
                  {validationResult.passed_rows && validationResult.passed_rows.length > 0 ? (
                    <DataGrid
                      autoHeight
                      rows={validationResult.passed_rows.map((row, i) => ({ id: i + 1, ...row }))}
                      columns={Object.keys(validationResult.passed_rows[0] || {}).map((k) => ({ field: k, headerName: k, flex: 1, minWidth: 120 }))}
                      pageSize={5}
                      rowsPerPageOptions={[5, 10, 20]}
                      sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 2, mb: 2 }}
                    />
                  ) : (
                    <Typography color="text.secondary">No passed rows.</Typography>
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box>
                  {validationResult.invalid_rows && validationResult.invalid_rows.length > 0 ? (
                    <DataGrid
                      autoHeight
                      rows={validationResult.invalid_rows.map((row, i) => ({ id: i + 1, ...row.row_data, failure_reason: row.failure_reason, row_number: row.row_number }))}
                      columns={[
                        ...(validationResult.invalid_rows[0]?.row_data ? Object.keys(validationResult.invalid_rows[0].row_data).map((k) => ({ field: k, headerName: k, flex: 1, minWidth: 120 })) : []),
                        { field: 'failure_reason', headerName: 'Failure Reason', flex: 2, minWidth: 180 },
                        { field: 'row_number', headerName: 'Row #', flex: 0.5, minWidth: 80 },
                      ]}
                      pageSize={5}
                      rowsPerPageOptions={[5, 10, 20]}
                      sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 2, mb: 2 }}
                    />
                  ) : (
                    <Typography color="text.secondary">No invalid rows.</Typography>
                  )}
                </Box>
              )}
            </>
          )}
          {!error && !loading && !validationResult && (
            <Typography color="text.secondary" sx={{m: 'auto'}}>No validation result yet.</Typography>
          )}
        </DialogContent>
        <Box display="flex" justifyContent="center" p={2} bgcolor="#f3e5f5">
          <Button onClick={() => setPreviewOpen(false)} color="secondary" variant="contained" sx={{ fontWeight: 700, minWidth: 120, fontSize: 15, borderRadius: 2, boxShadow: 2 }}>
            Close
          </Button>
        </Box>
      </Dialog>

      {/* Attribute Popover - now includes both insertion and primary selection */}
      <Popover
        open={Boolean(attributePopoverAnchorEl)}
        anchorEl={attributePopoverAnchorEl}
        onClose={() => { 
          setAttributePopoverAnchorEl(null); 
          setFocusedNlrIndex(null); 
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            display: 'flex',
            flexDirection: 'column', // Arrange sections vertically
            gap: 2, // Space between sections
            maxWidth: '400px', // Increased max width for better layout
            bgcolor: '#fff',
            borderRadius: 2,
            boxShadow: 3
          }
        }}
      >
        {csvHeaders.length > 0 ? (
          <>
            {/* Section for inserting attributes into the current rule */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1} sx={{ fontWeight: 600 }}>
                Insert Attribute into Rule:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {csvHeaders.map((header, index) => (
                  <Chip
                    key={`insert-${header}`} // Unique key
                    label={header}
                    onClick={() => handleAttributeInsert(header)}
                    color="primary"
                    variant="outlined"
                    ref={el => chipRefs.current[index] = el}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' } }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} /> {/* Divider between sections */}

            {/* Section for selecting the primary attribute for validation */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1} sx={{ fontWeight: 600 }}>
                Select Primary Validation Attribute:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {csvHeaders.map((header) => (
                  <Chip
                    key={`select-${header}`} // Unique key
                    label={header}
                    onClick={() => {
                      setSelectedAttribute(header); // Set the primary attribute
                      setAttributePopoverAnchorEl(null); // Close popover after selection
                      setFocusedNlrIndex(null);
                      setSnackbarMsg(`Primary validation attribute set to: ${header}`);
                      setSnackbarSeverity("info");
                      setSnackbarOpen(true);
                    }}
                    color="secondary" // Different color for distinction
                    variant={selectedAttribute === header ? "filled" : "outlined"}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 3,
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No attributes available. Upload a CSV/Excel file to see attributes.</Typography>
        )}
      </Popover>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={({ children, ...props }) => (
          <div ref={snackbarRef} {...props}>{children}</div>
        )}
      />
    </>
  );
};

export default ChatBotComponent;
