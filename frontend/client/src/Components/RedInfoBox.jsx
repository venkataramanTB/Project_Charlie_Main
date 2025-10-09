import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress, // For loading indicator
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // For "Load More"
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // For "Show Less"
import gsap from "gsap";
import Iterator from "./Iterator";

const CHIP_INCREMENT = 10; // Changed to load 10 chips at a time for better usability

const RedInfoBox = ({ 
  HDL_ATTRIBUTES = [], 
  allattributes = [], 
  open, 
  onClose, 
  onMappingChange, 
  initialMapping = {}, 
  selectedComponentName,
  customerName = "DefaultCustomer", // New prop for backend integration
  instanceName = "DefaultInstance", // New prop for backend integration
}) => {
  const [selectedAttr, setSelectedAttr] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [attributes, setAttributes] = useState(HDL_ATTRIBUTES);
  const [showInput, setShowInput] = useState(false);
  const [formData, setFormData] = useState(initialMapping);
  const [iteratorOpen, setIteratorOpen] = useState(false);
  const [iteratorError, setIteratorError] = useState("");
  const [iteratorResult, setIteratorResult] = useState(null);
  const [visibleChipCount, setVisibleChipCount] = useState(CHIP_INCREMENT); // State for load more
  const inputRef = useRef(null);
  const closeButtonRef = useRef(null);
  // Ensure REACT_APP_API_ENDPOINT is correctly set in your .env file in the frontend
  const apiEndPoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

  // States for backend interaction (loading and error)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dialogOpen = open;
  const handleDialogClose = onClose;

  // Log the API endpoint to ensure it's correctly resolved
  useEffect(() => {
    console.log("API Endpoint:", apiEndPoint);
  }, [apiEndPoint]);

  // Function to save data to the FastAPI backend
  const saveMappingToBackend = async (data) => {
    if (!selectedComponentName || !customerName || !instanceName) {
      console.warn("Component name, customer name, or instance name missing. Cannot save data.");
      setError("Missing required information to save mapping.");
      return;
    }
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const payload = {
        customerName: customerName,
        instanceName: instanceName,
        componentName: selectedComponentName,
        mappedAttributes: data,
      };

      console.log("Saving mapping to backend. Payload:", payload);
      const response = await fetch(`${apiEndPoint}/api/hdl/save-attribute-mapping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Save response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from save API:", errorData);
        throw new Error(errorData.detail || `Failed to save attribute mapping. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Attribute mapping saved successfully:", result.message);
      setError(null); // Clear any previous errors on success
    } catch (e) {
      console.error("Error saving attribute mapping:", e);
      setError("Failed to save data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to load data from the FastAPI backend
  useEffect(() => {
    const loadMappingFromBackend = async () => {
      if (!selectedComponentName || !customerName || !instanceName) {
        // Only attempt to load if all necessary props are available
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null); // Clear previous errors
      try {
        console.log(`Loading mapping from backend: ${apiEndPoint}/api/hdl/get-attribute-mapping/${customerName}/${instanceName}/${selectedComponentName}`);
        const response = await fetch(
          `${apiEndPoint}/api/hdl/get-attribute-mapping/${customerName}/${instanceName}/${selectedComponentName}`
        );

        console.log("Load response status:", response.status);
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No mapping file found for this component. Starting fresh.");
            setFormData({}); // Reset form data if no file exists
            onMappingChange({}); // Notify parent
          } else {
            const errorData = await response.json();
            console.error("Error response from load API:", errorData);
            throw new Error(errorData.detail || `Failed to load attribute mapping. Status: ${response.status}`);
          }
        } else {
          const result = await response.json();
          console.log("Successfully loaded mapping:", result);
          if (result && result.mappedAttributes) {
            setFormData(result.mappedAttributes);
            onMappingChange(result.mappedAttributes); // Notify parent of loaded data
          } else {
            console.warn("Loaded data has unexpected structure:", result);
            setFormData({}); // Data structure unexpected, reset
            onMappingChange({});
          }
        }
      } catch (e) {
        console.error("Error loading attribute mapping:", e);
        setError("Failed to load data: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    if (open) { // Only load data when the dialog is open
      loadMappingFromBackend();
    }
  }, [open, selectedComponentName, customerName, instanceName, onMappingChange, apiEndPoint]); // Added apiEndPoint to dependencies

  // Update internal attributes list if HDL_ATTRIBUTES prop changes
  useEffect(() => {
    setAttributes(HDL_ATTRIBUTES);
  }, [HDL_ATTRIBUTES]);

  // When the dialog opens or initialMapping from parent changes, update internal formData
  // This useEffect is now less critical as backend handles the primary data source
  useEffect(() => {
    if (open && initialMapping && Object.keys(initialMapping).length > 0) {
      setFormData(initialMapping);
    }
  }, [open, initialMapping]);

  const handleSelectAttr = (event) => {
    const attr = event.target.value;
    setSelectedAttr(attr);
    setShowInput(true);
    setInputValue(formData[attr] || ""); // Pre-fill if editing existing
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handles adding or updating an attribute-value pair and saves to backend
  const handleInputSave = async (e) => {
    e.preventDefault();
    if (selectedAttr && inputValue.trim() !== "") {
      const newFormData = { ...formData, [selectedAttr]: inputValue };
      setFormData(newFormData); // Update internal state immediately for responsiveness
      await saveMappingToBackend(newFormData); // Persist to backend
      setShowInput(false);
      setSelectedAttr("");
      setInputValue("");
    } else {
      if (inputRef.current) {
        gsap.to(inputRef.current, {
          x: 5,
          yoyo: true,
          repeat: 3,
          duration: 0.1,
          ease: "power1.inOut",
        });
      }
    }
  };

  const insertAtCursor = (value) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = input.value.slice(0, start) + value + input.value.slice(end);
    setInputValue(newValue);

    setTimeout(() => {
      input.setSelectionRange(start + value.length, start + value.length);
      input.focus();
    }, 0);
  };

  // This function is now specifically for closing the dialog.
  // The save operation is handled by individual CRUD ops.
  const handleDialogCloseWithMapping = () => {
    handleDialogClose();
  };

  const handleDeleteAttr = async (attrToDelete) => {
    setFormData((prev) => {
      const newFormData = { ...prev };
      delete newFormData[attrToDelete];
      saveMappingToBackend(newFormData); // Persist to backend
      return newFormData;
    });
    if (selectedAttr === attrToDelete) {
      setSelectedAttr("");
      setInputValue("");
      setShowInput(false);
    }
  };

  const handleEditAttr = (attrToEdit, valueToEdit) => {
    setSelectedAttr(attrToEdit);
    setInputValue(valueToEdit);
    setShowInput(true);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };

  const availableAttributesForDropdown = attributes.filter(
    (attr) => !Object.keys(formData).includes(attr) || attr === selectedAttr
  );

  const chipSource = allattributes.length > 0 ? allattributes : attributes;

  const handleLoadMoreChips = () => {
    setVisibleChipCount(prevCount => Math.min(prevCount + CHIP_INCREMENT, chipSource.length));
  };

  const handleShowLessChips = () => {
    setVisibleChipCount(CHIP_INCREMENT);
  };

  if (loading && open) { // Show loading only when dialog is open and data is being fetched
    return (
      <Dialog open={dialogOpen} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 } }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading data...</Typography>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={dialogOpen} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300 } }}>
        <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>
        <Button onClick={handleDialogClose}>Close</Button>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogCloseWithMapping}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 12px 48px rgba(0,0,0,0.1)",
            background: "#ffffff",
            border: "2px solid #4a5568",
            minHeight: 400,
            maxWidth: 750,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "stretch",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            fontSize: 18,
            background: "#1a202c",
            color: "#ffffff",
            borderBottom: "1.5px solid #4a5568",
            letterSpacing: 0.3,
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            px: 3,
            py: 1.5,
            minHeight: 48,
          }}
        >
          Select HDL Attributes
          <IconButton
            ref={closeButtonRef}
            onClick={handleDialogCloseWithMapping}
            size="small"
            sx={{ color: "#ffffff", "&:hover": { background: "#4a5568" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            maxHeight: 500,
            minHeight: 200,
            overflowY: "auto",
            background: "#f8f8f8",
            borderBottom: "1.5px solid #a0aec0",
            color: "#333333",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
            px: 3,
            py: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {/* Removed User ID display as it's not relevant for this backend */}

          {/* Left: Filled Values Section */}
          <Box
            sx={{
              flex: 1,
              pr: { xs: 0, md: 3 },
              pb: { xs: 2, md: 0 },
              borderRight: { md: "1.5px solid #a0aec0", xs: "none" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              maxHeight: { xs: 200, md: "100%" },
              overflowY: "auto",
              justifyContent: "flex-start",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 700,
                fontSize: 18,
                color: "#1a202c",
                letterSpacing: 0.5,
                textAlign: "center",
                mt: 1,
              }}
            >
              Filled Attribute Values
            </Typography>
            <Box sx={{ px: 1 }}>
              {Object.entries(formData).length === 0 ? (
                <Typography
                  variant="body2"
                  color="#4a5568"
                  sx={{ opacity: 0.7, textAlign: "center", fontStyle: "italic" }}
                >
                  No values filled yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {Object.entries(formData).map(([attr, value]) => (
                    <Box
                      key={attr}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: "1px solid #e2e8f0",
                        borderRadius: "md",
                        boxShadow: "sm",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "md",
                        },
                      }}
                    >
                      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          color="#2d3748"
                          sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}
                        >
                          {attr}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: 14, wordBreak: "break-word", color: "#1a202c" }}
                        >
                          {value}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditAttr(attr, value)}
                          sx={{ color: '#4299e1', '&:hover': { color: '#2b6cb0' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAttr(attr)}
                          sx={{ color: '#ef4444', '&:hover': { color: '#dc2626' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>

          {/* Right: Attribute Selection and Input */}
          <Box
            sx={{
              mt: 2,
              flex: 1,
              pl: { xs: 0, md: 3 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              minWidth: 0,
              pt: { xs: 2, md: 0 },
            }}
          >
            <FormControl fullWidth sx={{ mb: 3, mt: 1, maxWidth: 400 }}>
              <InputLabel
                id="select-attr-label"
                sx={{ color: "#2d3748", "&.Mui-focused": { color: "#1a202c" } }}
              >
                Select Attribute
              </InputLabel>
              <Select
                labelId="select-attr-label"
                value={selectedAttr}
                label="Select Attribute"
                onChange={handleSelectAttr}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 250,
                      background: "#e2e8f0",
                      color: "#1a202c",
                      borderRadius: 2,
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    },
                  },
                }}
                size="medium"
                sx={{
                  color: "#1a202c",
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#a0aec0" },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#63b3ed",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#4299e1",
                    borderWidth: "2px",
                  },
                  ".MuiSvgIcon-root": { color: "#1a202c" },
                  fontSize: 16,
                  minHeight: 48,
                }}
              >
                {availableAttributesForDropdown.length === 0 && selectedAttr === "" ? (
                  <MenuItem disabled>No more attributes to select</MenuItem>
                ) : (
                  availableAttributesForDropdown.map((attr, idx) => (
                    <MenuItem
                      key={idx}
                      value={attr}
                      sx={{
                        color: "#1a202c",
                        background: "#e2e8f0",
                        "&.Mui-selected": { background: "#4299e1", color: "#ffffff" },
                        "&:hover": { background: "#cbd5e0" },
                        fontSize: 16,
                        minHeight: 40,
                      }}
                    >
                      {attr}
                    </MenuItem>
                  ))
                )}
                {selectedAttr && !availableAttributesForDropdown.includes(selectedAttr) && (
                    <MenuItem
                      key={selectedAttr}
                      value={selectedAttr}
                      sx={{
                        color: "#1a202c",
                        background: "#e2e8f0",
                        "&.Mui-selected": { background: "#4299e1", color: "#ffffff" },
                        "&:hover": { background: "#cbd5e0" },
                        fontSize: 16,
                        minHeight: 40,
                      }}
                    >
                      {selectedAttr}
                    </MenuItem>
                )}
              </Select>
            </FormControl>
            {showInput && (
              <>
                <Box
                  component="form"
                  onSubmit={handleInputSave}
                  sx={{
                    width: "100%",
                    maxWidth: 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    mx: "auto",
                  }}
                >
                  <TextField
                    inputRef={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={`Enter value for {${selectedAttr}}...`}
                    variant="outlined"
                    fullWidth
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        border: "2px solid #a0aec0",
                        background: "#ffffff",
                        color: "#1a202c",
                        "&:hover fieldset": { borderColor: "#63b3ed" },
                        "&.Mui-focused fieldset": {
                          borderColor: "#4299e1",
                          boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.2)",
                        },
                        transition: "border-color 0.2s ease-out, box-shadow 0.2s ease-out",
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "#718096",
                        opacity: 1,
                      },
                      fontSize: 16,
                      minHeight: 48,
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    size="medium"
                    sx={{
                      fontWeight: 700,
                      fontSize: 15,
                      px: 3,
                      py: 1,
                      background: "#2b6cb0",
                      color: "#ffffff",
                      "&:hover": {
                        background: "#2c5282",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      },
                      transition: "all 0.2s ease-in-out",
                      minWidth: 0,
                      minHeight: 0,
                      height: 40,
                    }}
                    onClick={(e) => {
                      gsap.to(e.currentTarget, {
                        scale: 1.06,
                        duration: 0.14,
                        yoyo: true,
                        repeat: 1,
                        ease: "power1.inOut",
                      });
                    }}
                  >
                    Save
                  </Button>
                </Box>
                <Typography variant="body2" color="#4a5568" sx={{ mb: 1, textAlign: "center" }}>
                  Click chips below to insert into the input field:
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{
                    mb: 2,
                    maxHeight: "auto",
                    gap: 1,
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: "auto",
                    mx: "auto",
                    my: "auto",
                  }}
                >
                  {selectedComponentName && (
                    <Chip
                      label={selectedComponentName}
                      clickable
                      color="secondary"
                      variant="outlined"
                      onClick={() => {
                        insertAtCursor(`${selectedComponentName}`);
                        if (inputRef.current) {
                          gsap.fromTo(
                            inputRef.current,
                            { scale: 1 },
                            {
                              scale: 1.08,
                              duration: 0.15,
                              yoyo: true,
                              repeat: 1,
                              ease: "power1.inOut",
                            }
                          );
                        }
                      }}
                      sx={{
                        mb: 0.5,
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: 13,
                        letterSpacing: 0.3,
                        transition: "background 0.18s, transform 0.18s",
                        px: 1.2,
                        py: 0.3,
                        color: "#4a5568",
                        borderColor: "#a0aec0",
                        background: "#f0f4f8",
                        borderRadius: 1.5,
                        minHeight: 28,
                        height: 28,
                        "& .MuiChip-label": {
                          px: 0.7,
                          py: 0.3,
                          fontWeight: 500,
                          fontSize: 13,
                        },
                        "&.MuiChip-clickable:hover": {
                          background: "#63b3ed",
                          color: "#ffffff",
                          transform: "translateY(-2px)",
                        },
                        "&.MuiChip-clickable.MuiChip-primary": {
                          background: "#4299e1",
                          color: "#ffffff",
                          borderColor: "#4299e1",
                        },
                      }}
                    />
                  )}
                  <Chip
                    label={"MERGE"}
                    clickable
                    color="secondary"
                    variant="outlined"
                    onClick={() => {
                      insertAtCursor("MERGE");
                      if (inputRef.current) {
                        gsap.fromTo(
                          inputRef.current,
                          { scale: 1 },
                          {
                            scale: 1.08,
                            duration: 0.15,
                            yoyo: true,
                            repeat: 1,
                            ease: "power1.inOut",
                          }
                        );
                      }
                    }}
                    sx={{
                      mb: 0.5,
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      letterSpacing: 0.3,
                      transition: "background 0.18s, transform 0.18s",
                      px: 1.2,
                      py: 0.3,
                      color: "#4a5568",
                      borderColor: "#a0aec0",
                      background: "#f0f4f8",
                      borderRadius: 1.5,
                      minHeight: 28,
                      height: 28,
                      "& .MuiChip-label": {
                        px: 0.7,
                        py: 0.3,
                        fontWeight: 500,
                        fontSize: 13,
                      },
                      "&.MuiChip-clickable:hover": {
                        background: "#63b3ed",
                        color: "#ffffff",
                        transform: "translateY(-2px)",
                      },
                      "&.MuiChip-clickable.MuiChip-primary": {
                        background: "#4299e1",
                        color: "#ffffff",
                        borderColor: "#4299e1",
                      },
                    }}
                  />
                  <Chip
                    label="{Iterator}"
                    clickable
                    color="secondary"
                    variant="outlined"
                    onClick={() => {
                      insertAtCursor("{Iterator}");
                      if (inputRef.current) {
                        gsap.fromTo(
                          inputRef.current,
                          { scale: 1 },
                          {
                            scale: 1.08,
                            duration: 0.15,
                            yoyo: true,
                            repeat: 1,
                            ease: "power1.inOut",
                          }
                        );
                      }
                    }}
                    sx={{
                      mb: 0.5,
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      letterSpacing: 0.3,
                      transition: "background 0.18s, transform 0.18s",
                      px: 1.2,
                      py: 0.3,
                      color: "#4a5568",
                      borderColor: "#a0aec0",
                      background: "#f0f4f8",
                      borderRadius: 1.5,
                      minHeight: 28,
                      height: 28,
                      "& .MuiChip-label": {
                        px: 0.7,
                        py: 0.3,
                        fontWeight: 500,
                        fontSize: 13,
                      },
                      "&.MuiChip-clickable:hover": {
                        background: "#63b3ed",
                        color: "#ffffff",
                        transform: "translateY(-2px)",
                      },
                      "&.MuiChip-clickable.MuiChip-primary": {
                        background: "#4299e1",
                        color: "#ffffff",
                        borderColor: "#4299e1",
                      },
                    }}
                  />
                  {chipSource.slice(0, visibleChipCount).map(
                    (attr, idx) => (
                      <Chip
                        key={idx}
                        label={`{${attr}}`}
                        clickable
                        color={attr === selectedAttr ? "primary" : "default"}
                        variant="outlined"
                        onClick={() => {
                          insertAtCursor(`{${attr}}`);
                          if (inputRef.current) {
                            gsap.fromTo(
                              inputRef.current,
                              { scale: 1 },
                              {
                                scale: 1.08,
                                duration: 0.15,
                                yoyo: true,
                                repeat: 1,
                                ease: "power1.inOut",
                              }
                            );
                          }
                        }}
                        sx={{
                          mb: 0.5,
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: 13,
                          letterSpacing: 0.3,
                          transition: "background 0.18s, transform 0.18s",
                          px: 1.2,
                          py: 0.3,
                          color: "#4a5568",
                          borderColor: "#a0aec0",
                          background: "#f0f4f8",
                          borderRadius: 1.5,
                          minHeight: 28,
                          height: 28,
                          "& .MuiChip-label": {
                            px: 0.7,
                            py: 0.3,
                            fontWeight: 500,
                            fontSize: 13,
                          },
                          "&.MuiChip-clickable:hover": {
                            background: "#63b3ed",
                            color: "#ffffff",
                            transform: "translateY(-2px)",
                          },
                          "&.MuiChip-clickable.MuiChip-primary": {
                            background: "#4299e1",
                            color: "#ffffff",
                            borderColor: "#4299e1",
                          },
                        }}
                      />
                    )
                  )}
                  {chipSource.length > CHIP_INCREMENT && visibleChipCount < chipSource.length && (
                    <Button
                      onClick={handleLoadMoreChips}
                      size="small"
                      sx={{
                        mt: 1,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#4299e1',
                        '&:hover': { background: 'rgba(66, 153, 225, 0.1)' },
                      }}
                      endIcon={<ExpandMoreIcon />}
                    >
                      View More ({chipSource.length - visibleChipCount} remaining)
                    </Button>
                  )}
                </Stack>
                {chipSource.length === visibleChipCount && (
                  <Button
                    onClick={handleShowLessChips}
                    size="small"
                    sx={{
                      mt: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#e53e3e',
                      '&:hover': { background: 'rgba(229, 62, 62, 0.1)' },
                    }}
                    endIcon={<ExpandLessIcon />}
                  >
                    Show Less
                  </Button>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            background: "#1a202c",
            borderTop: "1.5px solid #4a5568",
            px: 3,
            py: 1.5,
            minHeight: 48,
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={() => {
              gsap.to(closeButtonRef.current, {
                rotation: 180,
                duration: 0.3,
                ease: "power1.out",
                onComplete: handleDialogCloseWithMapping,
              });
            }}
            color="success"
            sx={{
              fontWeight: 600,
              fontSize: 14,
              color: "#ffffff",
              background: "#38a169",
              px: 2,
              py: 0.8,
              borderRadius: 1.5,
              mr: 1.5,
              '&:hover': { background: "#2f855a", color: "#ffffff" },
              transition: "background 0.2s ease-in-out",
            }}
          >
            Save All
          </Button>

        </DialogActions>
      </Dialog>
      {iteratorOpen && (
        <Iterator
          open={iteratorOpen}
          onClose={() => setIteratorOpen(false)}
          attributes={allattributes.length > 0 ? allattributes : attributes}
          onIncrementDefined={(data) => {
            setIteratorOpen(false);
          }}
        />
      )}
    </>
  );
};

export default RedInfoBox;
