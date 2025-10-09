import React, { useEffect, useState, useCallback, useRef, use } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  Toolbar,
  Typography,
  Divider,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlareIcon from '@mui/icons-material/Flare';
import { DataGrid } from "@mui/x-data-grid";
import DownloadingOutlinedIcon from '@mui/icons-material/DownloadingOutlined';
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder"; // Default icon for dynamic items
import SearchIcon from "@mui/icons-material/Search";
import LoginIcon from '@mui/icons-material/Login'; // Custom icon for Login
import DashboardIcon from '@mui/icons-material/Dashboard'; // Custom icon for Dashboard
import TransformIcon from '@mui/icons-material/Transform'; // Custom icon for Data Transformation
import SettingsIcon from '@mui/icons-material/Settings'; // Custom icon for Setup
import BarChartIcon from '@mui/icons-material/BarChart'; // Icon for Trigger HDL
import PublicIcon from '@mui/icons-material/Public'; // Icon for Global Dashboard
import BundleUp from "./BundleUp";
import gsap from "gsap";
import EmergencyIcon from '@mui/icons-material/Emergency';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";


const drawerWidth = 350;
const collapsedWidth = 64;

// Helper function to map raw hierarchy data to display nodes
// Extends hierarchy levels up to 10 and assigns originalLevel for precise control.
const mapRawHierarchyToDisplayNodes = (node, currentPathSegments = [], currentLevel = 1) => {
  // Construct the full hierarchy path for the current node
  const newHierarchy = [...currentPathSegments, node.name];

  const displayNode = {
    ...node, // ✅ Keep ALL original fields (Required - Helper Text, Supported Action - Helper Text, etc.)

    text: node.name,
    path: `/hdl`, // FIX: keep path consistent
    hierarchy: newHierarchy,

    // Change the dat_template: build from Level 3 onward
    dat_template: newHierarchy.slice(2).join('_').toLowerCase() || null,

    Mandatory_Objects: (node.Mandatory_Objects === true || node.Mandatory_Objects === "true"),
    file: node.file || null,
    originalLevel: currentLevel,

    // Explicit level keys
    level_1: newHierarchy[0] || null,
    level_2: newHierarchy[1] || null,
    level_3: newHierarchy[2] || null,
    level_4: newHierarchy[3] || null,
    level_5: newHierarchy[4] || null,
    level_6: newHierarchy[5] || null,
    level_7: newHierarchy[6] || null,
    level_8: newHierarchy[7] || null,
    level_9: newHierarchy[8] || null,
    level_10: newHierarchy[9] || null,

    children: [],
  };

  if (node.children && node.children.length > 0) {
    displayNode.children = node.children.map(child =>
      mapRawHierarchyToDisplayNodes(child, displayNode.hierarchy, currentLevel + 1)
    );
  }

  return displayNode;
};



const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:5000';
console.log("API Endpoint: ",apiEndpoint);

// Dialog component to show upload and validation status
const UploadStatusDialog = ({ open, onClose, type, message, files = [], validationResults = [], downloadExcelFilename, onDownloadErrorReport }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fileColumns = [
    { field: "component", headerName: "Component", width: 200 },
    { field: "file", headerName: "File Path", flex: 1 },
  ];

  const validationColumns = [
    { field: "missing_components", headerName: "Component Failed", width: 200 },
    { field: "person_number", headerName: "Person Number", width: 150 },
    { field: "description", headerName: "Error Message", flex: 1 },
  ];

  useEffect(() => {
    if (open) {
      setTabValue(0);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {type === "success" ? "Excel Upload & Validation Status" : "Excel Upload Failed"}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {type === "success" ? (
          <>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="upload status tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Uploaded Files" />
              <Tab label="Data Consistency Status" />
            </Tabs>
            {tabValue === 0 && (
              <Box sx={{ height: 300, width: "100%", p: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {message}
                </Typography>
                <DataGrid
                  rows={files.map((file, index) => ({
                    id: index,
                    component: file.child,
                    file: file.file,
                  }))}
                  columns={fileColumns}
                  pageSizeOptions={[5, 10, 20]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 5,
                      },
                    },
                  }}
                  disableRowSelectionOnClick
                  getRowId={(row) => row.id}
                />
              </Box>
            )}
            {tabValue === 1 && (
              <Box sx={{ height: 300, width: "100%", p: 2 }}>
                {/* <Typography variant="body1" sx={{ mb: 2 }}>
                  Cross-file Person Number Validation Results:
                </Typography> */}
                {validationResults.length > 0 ? (
                  <DataGrid
                    rows={validationResults.map((row, index) => ({ id: index, ...row }))}
                    columns={validationColumns}
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 5,
                        },
                      },
                    }}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No validation issues found or no validation data available.
                  </Typography>
                )}
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body1" color="error" sx={{ p: 2 }}>
            {message || "An unknown error occurred during upload."}

          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};





// Component for a single menu item, potentially recursive for children
const MenuItemComponent = ({
  item,
  level,
  collapsed,
  isActive,
  openMenus,
  handleNavigate,
  handleToggleMenu,
  onUploadExcel,
  onShowSnackbar,
  onOpenBundleUpDialog,
  isMenuActive,
  validationSession: propValidationSession,
}) => {
  const listItemRef = useRef(null);
  const hasChildren = item.children?.length > 0;
  const key = item.hierarchy.join(" > ");
  const open = openMenus[key];

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(
    () => sessionStorage.getItem("user") !== null
  );

  useEffect(() => {
    const handleUserLoginStorageChange = () => {
      setIsUserLoggedIn(sessionStorage.getItem("user") !== null);
    };
    window.addEventListener("storage", handleUserLoginStorageChange);
    return () => window.removeEventListener("storage", handleUserLoginStorageChange);
  }, []);

  const ItemIcon = item.icon || FolderIcon;
  const itemColor = "#e3f2fd";
  const hasMandatory = item.Mandatory_Objects;

  useEffect(() => {
    gsap.fromTo(
      listItemRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.3, delay: level * 0.05 + 0.1, ease: "power2.out" }
    );
  }, [level]);

  const handleMouseEnter = () => {
    if (listItemRef.current) {
      gsap.to(listItemRef.current, { x: 5, scale: 1.02, duration: 0.15, ease: "power1.out" });
    }
  };

  const handleMouseLeave = () => {
    if (listItemRef.current) {
      gsap.to(listItemRef.current, { x: 0, scale: 1, duration: 0.15, ease: "power1.out" });
    }
  };

  const handleClick = (event) => {
    if (hasChildren) handleToggleMenu(key, event);

    const isNavigable = item.isSpecialNavigable || (item.originalLevel >= 6 && item.path);

    if (isNavigable) {
      handleNavigate(item);
    } else if (item.originalLevel < 6 && !hasChildren) {
      onShowSnackbar(
        "Navigation is only available for components at Level 6 or deeper.",
        "info"
      );
    }
  };

  // Build tooltip only if there is helper text
  const hasHelper =
    level >= 3 &&
    (item?.["Required - Helper Text"]?.trim() ||
      item?.["Supported Action - Helper Text"]?.trim());


  const helperTextTooltip = hasHelper && (
    <Box
      sx={{
        bgcolor: "background.paper",
        p: 1.2,
        borderRadius: 1.5,
        boxShadow: 2,
        minWidth: 180,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ mb: 0.5, fontWeight: 600, color: "text.primary"}}
      >
        {item.text}
      </Typography>
      <Divider sx={{ my: 1 }} />
      {item["Required - Helper Text"] && (
        <Typography
          variant="caption"
          display="block"
          sx={{ color: "info.main", mb: 0.3 }}
        >
          Required: {item["Required - Helper Text"]}
        </Typography>
      )}
      {/* Adding a Divider */}
      <Divider sx={{ my: 0.5 }} />
      {item["Supported Action - Helper Text"] && (
        <Typography
          variant="caption"
          display="block"
          sx={{ color: "success.main" }}
        >
          Supported Actions: {item["Supported Action - Helper Text"]}
        </Typography>
      )}
    </Box>
  );

  const Content = (
    <ListItemButton
      ref={listItemRef}
      selected={isActive}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        pl: collapsed ? 2 : 2 + level * 2,
        py: 1,
        mx: 1,
        my: 0.5,
        borderRadius: 2,
        bgcolor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
        transition: "all 0.2s",
        "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
      }}
    >
      <ListItemIcon sx={{ color: itemColor, minWidth: 0, mr: collapsed ? "auto" : 2 }}>
        {hasChildren && !item.icon ? (
          <IconButton
            onClick={(event) => handleToggleMenu(key, event)}
            sx={{
              color: "inherit",
              padding: 0,
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease-in-out",
            }}
          >
            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        ) : (
          <ItemIcon sx={{ color: itemColor, fontSize: 20 }} />
        )}
        {hasMandatory && (
          <EmergencyIcon
            sx={{ color: "cyan", fontSize: 16, ml: 1, mr: -1.5 }}
            titleAccess="Mandatory Object"
          />
        )}
      </ListItemIcon>

      {!collapsed && (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <ListItemText primary={<Typography noWrap>{item.text}</Typography>} />

          {propValidationSession?.[item.text]?.validated && (
            <Tooltip title="Validated">
              <CheckCircleIcon fontSize="small" sx={{ color: "green", ml: 1 }} />
            </Tooltip>
          )}
          {item.text === "Login" && isUserLoggedIn && (
            <Tooltip title="Logged In">
              <CheckCircleIcon fontSize="small" sx={{ color: "green", ml: 1 }} />
            </Tooltip>
          )}
          {item.originalLevel === 6 && !item.isSpecialNavigable && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                id={`excel-upload-${item.text}`}
                type="file"
                onChange={(e) => onUploadExcel && onUploadExcel(e, item)}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={`excel-upload-${item.text}`}
                style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              >
                <Tooltip title="Upload Customer Data [.xlsx]" placement="top">
                  <IconButton size="small" component="span" sx={{ ml: 1, color: itemColor }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={itemColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <path d="M16 16l-4-4-4 4" />
                      <path d="M12 12v6" />
                    </svg>
                  </IconButton>
                </Tooltip>
              </label>
              <Tooltip title="Convert Customer Data to DAT File [.dat]" placement="top">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBundleUpDialog(item);
                  }}
                  sx={{ color: itemColor }}
                >
                  <DownloadingOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}
    </ListItemButton>
  );

  return (
    <React.Fragment>
      {hasHelper ? (
        // Move the tooltip a bit to the right
        
        <Tooltip
          title={helperTextTooltip}
          placement="right"
          arrow
          PopperProps={{
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 75], // Increased distance to prevent overlap
                },
              },
            ],
          }}
        >
          {Content}
        </Tooltip>
      ) : (
        Content
      )}

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {item.children.map((child) => (
            <MenuItemComponent
              key={child.hierarchy.join(" > ")}
              item={child}
              level={level + 1}
              collapsed={collapsed}
              isActive={isMenuActive(child)}
              openMenus={openMenus}
              handleNavigate={handleNavigate}
              handleToggleMenu={handleToggleMenu}
              onUploadExcel={onUploadExcel}
              onShowSnackbar={onShowSnackbar}
              onOpenBundleUpDialog={onOpenBundleUpDialog}
              isMenuActive={isMenuActive}
              validationSession={propValidationSession}
            />
          ))}
        </Collapse>
      )}
    </React.Fragment>
  );
};


// Main Sidebar component
const Sidebar = ({ onSelectItem, Onrefresh, setOnrefresh }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const [customerName, setCustomerName] = useState(""); 
  const [instanceName, setInstanceName] = useState("");
  // State to track uploaded Excel parents (components for which an Excel has been uploaded)
  const [uploadedExcelParents, setUploadedExcelParents] = useState(() => {
    try {
      const storedParents = sessionStorage.getItem('uploadedExcelParents');
      return storedParents ? new Set(JSON.parse(storedParents)) : new Set();
    } catch (error) {
      console.error("Failed to parse uploadedExcelParents from sessionStorage:", error);
      return new Set();
    }
  });

  // State to store only the latest uploaded Excel file name for display
  const [uploadedExcelFiles, setUploadedExcelFiles] = useState(() => {
    try {
      const storedFile = sessionStorage.getItem('latestUploadedExcelFile');
      return storedFile || null; // Store a single string or null
    } catch (error) {
      console.error("Failed to parse latestUploadedExcelFile from sessionStorage:", error);
      return null;
    }
  });

  const [excelFileMap, setExcelFileMap] = useState({});
  const [excelUploading, setExcelUploading] = useState(false);

  // State for validation session, initialized from sessionStorage or empty object
  const [validationSession, setValidationSession] = useState(() => {
    try {
      const storedSession = sessionStorage.getItem('validationSession');
      return storedSession ? JSON.parse(storedSession) : {};
    } catch (error) {
      console.error("Failed to parse validationSession from sessionStorage:", error);
      return {};
    }
  });

  // State for bulk validation session, initialized from sessionStorage or empty object
  // This session tracks validation status and multiple file names for Level 6 parent components.
  const [bulkValidationSession, setBulkValidationSession] = useState(() => {
    try {
      const storedSession = sessionStorage.getItem('bulkValidationSession');
      return storedSession ? JSON.parse(storedSession) : {};
    } catch (error) {
      console.error("Failed to parse bulkValidationSession from sessionStorage:", error);
      return {};
    }
  });

  // Effect to persist uploadedExcelParents to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('uploadedExcelParents', JSON.stringify(Array.from(uploadedExcelParents)));
  }, [uploadedExcelParents]);

  // Effect to persist ONLY the latest uploaded Excel file to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('latestUploadedExcelFile', uploadedExcelFiles || '');
  }, [uploadedExcelFiles]);

  // Effect to persist bulkValidationSession to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('bulkValidationSession', JSON.stringify(bulkValidationSession));
  }, [bulkValidationSession]);

  // Effect to listen for storage changes for uploadedExcelParents (for cross-tab/window sync)
  useEffect(() => {
    const handleUploadedParentsStorageChange = () => {
      const updatedParents = sessionStorage.getItem("uploadedExcelParents");
      setUploadedExcelParents(updatedParents ? new Set(JSON.parse(updatedParents)) : new Set());
    };
    window.addEventListener("storage", handleUploadedParentsStorageChange);
    return () => {
      window.removeEventListener("storage", handleUploadedParentsStorageChange);
    };
  }, []);

  // Effect to listen for storage changes for latestUploadedExcelFile (for cross-tab/window sync)
  useEffect(() => {
    const handleLatestUploadedFileStorageChange = () => {
      const updatedFile = sessionStorage.getItem("latestUploadedExcelFile");
      setUploadedExcelFiles(updatedFile || null);
    };
    window.addEventListener("storage", handleLatestUploadedFileStorageChange);
    return () => {
      window.removeEventListener("storage", handleLatestUploadedFileStorageChange);
    };
  }, []);

  // Effect to listen for storage changes for bulkValidationSession (for cross-tab/window sync)
  useEffect(() => {
    const handleBulkValidationStorageChange = () => {
      console.log('bulkValidationSession Update!!');
      const updated = sessionStorage.getItem("bulkValidationSession");
      setBulkValidationSession(updated ? JSON.parse(updated) : {});
    };

    window.addEventListener("storage", handleBulkValidationStorageChange);
    return () => {
      window.removeEventListener("storage", handleBulkValidationStorageChange);
    };
  }, []);

  // Effect to listen for storage changes for validationSession (for cross-tab/window sync)
  useEffect(() => {
    const handleValidationStorageChange = () => {
      console.log('validationSession Update!! (from storage)');
      const updated = sessionStorage.getItem("validationSession");
      setValidationSession(updated ? JSON.parse(updated) : {});
    };

    window.addEventListener("storage", handleValidationStorageChange);
    return () => {
      window.removeEventListener("storage", handleValidationStorageChange);
    };
  }, []);


  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [uploadDialog, setUploadDialog] = useState({
    open: false,
    type: "",
    message: "",
    files: [],
    validationResults: [],
    downloadExcelFilename: null,
  });

  const [bundleUpDialog, setBundleUpDialog] = useState({
    open: false,
    itemData: null,
  });

  // Refs for GSAP animations
  const sidebarRef = useRef(null);
  const titleRef = useRef(null);
  const searchRef = useRef(null);
  const menuListRef = useRef(null);

  // Snackbar utility functions
  const handleShowSnackbar = useCallback((message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Helper to find the actual Level 6 parent node in the full menuItems hierarchy
  // This is used for correctly identifying the scope of validation for HDL components.
  const getActualLevel6ParentNode = useCallback((targetItem, allMenuItems) => {
    const findL6Ancestor = (node) => {
      // If the current node is level 6 and its hierarchy path matches the target item's L6 hierarchy, it's the one
      // We check hierarchy[5] because hierarchy array is 0-indexed, so level 6 is at index 5.
      if (node.originalLevel === 6 && node.hierarchy[5] === targetItem.hierarchy[5]) {
        return node;
      }
      // Recursively search children
      if (node.children) {
        for (const child of node.children) {
          const found = findL6Ancestor(child);
          if (found) return found;
        }
      }
      return null;
    };

    // Iterate through top-level menu items to find the ancestor
    for (const rootItem of allMenuItems) {
      const l6Ancestor = findL6Ancestor(rootItem);
      if (l6Ancestor) return l6Ancestor;
    }
    return null;
  }, []); // No dependencies, as it only operates on the structure

  // Updates the validation session state for individual components
  const updateValidationSession = useCallback((componentName, validatedStatus, fileName) => {
    setValidationSession(prevSession => {
      const newSession = {
        ...prevSession,
        [componentName]: { validated: validatedStatus, fileName: fileName }
      };
      sessionStorage.setItem('validationSession', JSON.stringify(newSession));
      console.log(`Validation session updated for ${componentName}:`, newSession);
      return newSession;
    });
  }, []);

  // Updates the bulk validation session state for Level 6 parent components
  // It tracks the validation status and an array of file names associated with the parent.
  const updateBulkValidationSession = useCallback(async(componentName, validatedStatus, newFileName, customerName, instanceName) => {
    setBulkValidationSession(prevSession => {
      const currentEntry = prevSession[componentName] || { validated: false, fileNames: [] };
      const newFileNames = Array.isArray(currentEntry.fileNames)
        ? [...new Set([...currentEntry.fileNames, newFileName])] // Add new file name, ensure uniqueness
        : [newFileName]; // If for some reason it's not an array, initialize it

      const newSession = {
        ...prevSession,
        [componentName]: {
          validated: validatedStatus,
          fileNames: newFileNames
        }
      };
      sessionStorage.setItem('bulkValidationSession', JSON.stringify(newSession));
      console.log(`Bulk validation session updated for ${componentName}:`, newSession);
      return newSession;
    });
  }, [handleShowSnackbar]);

  

  // Recursive function to inject Dashboard and Setup into Level 2 nodes
  const injectDashboardAndSetup = useCallback((nodes) => {
    nodes.forEach(node => {
      if (node.originalLevel === 2) { // Target Level 2 nodes from backend
        // Create objects directly, preserving icon references

        const injectedSetup = {
          text: "Setup",
          path: "/setup", // Giving it a path to make it navigable
          originalLevel: 3, // Keep originalLevel consistent with hierarchy depth
          hierarchy: [...node.hierarchy, "Setup"],
          Mandatory_Objects: false,
          icon: SettingsIcon, // Now this will be preserved
          isSpecialNavigable: true, // New flag
        };

        const injectedDashboard = {
          text: "Dashboard",
          path: " ", // Giving it a path to make it navigable
          originalLevel: 3, // Keep originalLevel consistent with hierarchy depth
          hierarchy: [...node.hierarchy, "Dashboard"],
          Mandatory_Objects: false,
          icon: DashboardIcon, // Now this will be preserved
          isSpecialNavigable: true, // New flag to bypass originalLevel >= 6 for navigation
          children: []
        };

        const injectedImportandLoadData = {
              text: "Import and Load Data",
              path: "/dashboard/trigger-HDL",
              originalLevel: 3,
              hierarchy: [...node.hierarchy, "Import and Load Data"],
              Mandatory_Objects: false,
              icon: BarChartIcon, // Now this will be preserved
              isSpecialNavigable: true, // New flag
        }


        // Ensure children array exists
        if (!node.children) {
          node.children = [];
        }
        // Add Dashboard and Setup as children
        node.children.push(injectedDashboard);
        node.children.push(injectedImportandLoadData);
      // Insert Setup right after Dashboard
      const dashboardIndex = node.children.findIndex(child => child.text === "Dashboard");
      if (dashboardIndex !== -1) {
        node.children.splice(injectedImportandLoadData + 1, 0, injectedSetup);

      }


      }
      // Recursively call for children, regardless of whether current node was Level 2
      if (node.children && node.children.length > 0) {
        injectDashboardAndSetup(node.children);
      }
    });
  }, []);




  // Function to fetch menu items from API and initialize validation session
  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiEndpoint}/api/utils/menu-items`);
      const data = await res.json();

      if (Array.isArray(data.hierarchy)) {
        const remappedFullTree = data.hierarchy.map(rootNode =>
          mapRawHierarchyToDisplayNodes(rootNode)
        );

        // Inject Dashboard and Setup into Level 2 nodes
        injectDashboardAndSetup(remappedFullTree); // Call the new function here

        setMenuItems(remappedFullTree);
        handleShowSnackbar("Backend Connected", "success");

        // Initialize validation states based on the fetched hierarchy
        const initialValidationState = {};
        const initialBulkValidationState = {};

        const populateValidationStates = (node) => {
          // For individual component validation (Level 6 and deeper, if it's a file component)
          if (node.originalLevel >= 6 && node.file) { // Changed to >=6 for individual components
            initialValidationState[node.text] = { validated: false, fileName: null };
          }
          // For bulk validation (Level 6 parents)
          if (node.originalLevel === 6) { // Changed to 6
            initialBulkValidationState[node.text] = { validated: false, fileNames: [] };
          }
          if (node.children) {
            node.children.forEach(populateValidationStates);
          }
        };

        remappedFullTree.forEach(populateValidationStates);

        // Merge with existing sessionStorage for individual validation
        const existingValidationSession = JSON.parse(sessionStorage.getItem("validationSession") || "{}");
        const finalValidationSession = { ...initialValidationState, ...existingValidationSession };

        // Merge with existing sessionStorage for bulk validation
        const existingBulkValidation = JSON.parse(sessionStorage.getItem("bulkValidationSession") || "{}");
        const finalBulkValidationSession = Object.keys(initialBulkValidationState).reduce((acc, key) => {
          acc[key] = {
            ...initialBulkValidationState[key],
            ...existingBulkValidation[key],
            fileNames: Array.isArray(existingBulkValidation[key]?.fileNames)
              ? existingBulkValidation[key].fileNames
              : initialBulkValidationState[key].fileNames
          };
          return acc;
        }, {});

        sessionStorage.setItem("validationSession", JSON.stringify(finalValidationSession));
        sessionStorage.setItem("bulkValidationSession", JSON.stringify(finalBulkValidationSession));

        setValidationSession(finalValidationSession);
        setBulkValidationSession(finalBulkValidationSession);
        console.log("Bulk Validation Session initialized:", finalBulkValidationSession);
      }
    } catch (err) {
      console.error("Menu fetch error:", err);
      handleShowSnackbar("Failed to load menu items.", "error");
    } finally {
      setLoading(false);
    }
  }, [handleShowSnackbar, injectDashboardAndSetup]);

  // On refresh variable to trigger re-fetching of menu items
const refreshMenuItems = Onrefresh;

useEffect(() => {
  console.log("Refresh Menu Items changed:", refreshMenuItems);
  if (Onrefresh) {
    fetchMenuItems();
    setOnrefresh(false) // Reset the refresh flag after fetching
  }
}, [refreshMenuItems, Onrefresh, fetchMenuItems, setOnrefresh]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems, Onrefresh]); // Added Onrefresh to dependencies

  // GSAP animation for sidebar collapse/expand
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.3 } });

    if (collapsed) {
      tl.to(titleRef.current, { opacity: 0, x: -20, duration: 0.2 }, 0)
        .to(searchRef.current, {
          opacity: 0,
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 0,
          duration: 0.2,
          overflow: 'hidden'
        }, 0)
        .to(sidebarRef.current, { width: collapsedWidth }, 0);
    } else {
      tl.to(sidebarRef.current, { width: drawerWidth }, 0)
        .fromTo(
          titleRef.current,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.2 },
          0
        )
        .fromTo(
          searchRef.current,
          { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, overflow: 'hidden' },
          {
            opacity: 1,
            height: 'auto',
            paddingTop: '8px',
            paddingBottom: '8px',
            marginBottom: '8px',
            duration: 0.2
          },
          0
        );
    }
  }, [collapsed]);

  // GSAP animation for menu item loading
  useEffect(() => {
    if (loading && menuListRef.current) {
      gsap.fromTo(
        gsap.utils.toArray(menuListRef.current.children),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [loading, menuItems]);

  // Filters menu items based on search query
  const filterMenuItems = useCallback((items, query) => {
    if (!query) return items;
    return items
      .map((item) => {
        const children = filterMenuItems(item.children || [], query);
        const match = item.text.toLowerCase().includes(query.toLowerCase());
        if (match || children.length > 0) {
          return { ...item, children };
        }
        return null;
      })
      .filter(Boolean);
  }, []);

// ✅ Only reorder Dashboard & Setup at level 1. No alphabet sort at all.
const sortMenuItems = (items, level = 0) => {
  if (!items) return [];

  // Pull out Dashboard
  const dashboard = items.find(i => i.text === "Dashboard");
  const importAndLoadData = items.find(i => i.text === "Import and Load Data");
  const restWithoutDashboard = items.filter(i => i.text !== "Dashboard");
  const restwithoutImportAndLoadData = restWithoutDashboard.filter(i => i.text !== "Import and Load Data");
  // Separate special vs normal
  const specialItems = restwithoutImportAndLoadData.filter(i => i.isSpecialNavigable);
  const nonSpecialItems = restwithoutImportAndLoadData.filter(i => !i.isSpecialNavigable);

  // ✅ Alphabetical sort for all normal items
  const alphabeticallySorted = [...nonSpecialItems].sort((a, b) =>
    a.text.localeCompare(b.text)
  );

  if (level === 1) {
    const setup = specialItems.find(i => i.text === "Setup");
    const restSpecials = specialItems.filter(i => i.text !== "Setup");

    const reordered = [
      ...restSpecials,                      // specials on top (excluding Setup)
      ...(setup ? [setup] : []),            // Setup comes right after specials
      ...alphabeticallySorted,              // ✅ alphabetical order for everything else
      ...(importAndLoadData ? [importAndLoadData] : []), // Import and Load Data comes last
    ];

    return reordered.map(item => ({
      ...item,
      children: sortMenuItems(item.children, level + 1),
    }));
  }

  // For deeper levels: specials first, then alphabetical, then dashboard
  const reordered = [
    ...specialItems,
    ...alphabeticallySorted,
    ...(importAndLoadData ? [importAndLoadData] : []), // Import and Load Data comes last
  ];

  return reordered.map(item => ({
    ...item,
    children: sortMenuItems(item.children, level + 1),
  }));
};







  const handleCollapseToggle = () => {
    setCollapsed((prev) => {
      if (!prev) setOpenMenus({}); // Close all menus when collapsing
      return !prev;
    });
  };

  // Handles navigation to a selected menu item
  const handleNavigate = useCallback(
    (item) => {
      // Helper to get the Level 6 parent name from the hierarchy
      const getLevel6ParentName = (currentItem) => {
        if (currentItem.originalLevel === 6) {
          return currentItem.text;
        }
        if (currentItem.hierarchy && currentItem.hierarchy.length > 5) {
          return currentItem.hierarchy[5];
        }
        return null;
      };

      const parentName = getLevel6ParentName(item);

      // Check if Excel is uploaded for the Level 6 parent component before allowing navigation
      // This check is skipped for special navigable items (like Dashboard/Setup)
      if (parentName && !uploadedExcelParents.has(parentName) && item.originalLevel >= 6 && !item.isSpecialNavigable) {
        handleShowSnackbar('To view the Business Object or the Component details, please click the upload icon to first upload the customer data file template.', 'warning');
        return;
      }

      // Prepare data to pass to the parent component
      let mappedExcelFile = null;
      if (parentName && uploadedExcelParents.has(parentName)) {
        mappedExcelFile = `uploads/${parentName}`; // This path depends on your backend
      }

      let excelFileForComponent = null;
      let excelFileForComponentName = null;

      if (parentName && excelFileMap[parentName]) {
        excelFileForComponent = excelFileMap[parentName][item.text] || null;
        if (excelFileForComponent) {
          const parts = excelFileForComponent.split("/");
          excelFileForComponentName = parts[parts.length - 1];
        }
      }
      
      // FIX: Create a robust payload for the parent component.
      // By deriving level properties directly from the hierarchy array, we ensure the data
      // passed to the parent is always correct, preventing potential errors for deep-level items.
      const payload = {
        text: item.text,
        hierarchy: item.hierarchy,
        dat_template: item.dat_template || null,
        file: item.file || null,
        level_1: item.hierarchy[0] || null,
        level_2: item.hierarchy[1] || null,
        level_3: item.hierarchy[2] || null,
        level_4: item.hierarchy[3] || null,
        level_5: item.hierarchy[4] || null,
        level_6: item.hierarchy[5] || null,
        level_7: item.hierarchy[6] || null,
        level_8: item.hierarchy[7] || null,
        level_9: item.hierarchy[8] || null,
        level_10: item.hierarchy[9] || null,
        mappedExcelFile: mappedExcelFile,
        excelFileForComponent: excelFileForComponent,
        excelFileForComponentName: excelFileForComponentName,
        mandatory_objects: item.Mandatory_Objects,
        originalLevel: item.originalLevel,
        validationSession: validationSession,
        onUpdateValidationSession: updateValidationSession,
        level1Parent: item.hierarchy[0] || null,
        level2Parent: item.hierarchy[1] || null,
      };

      onSelectItem?.(payload);

      // Navigate if the path is different
      if (location.pathname !== item.path) {
        navigate(item.path);
      }
    },
    [onSelectItem, location.pathname, navigate, uploadedExcelParents, excelFileMap, handleShowSnackbar, validationSession, updateValidationSession]
  );

  // Toggles the open/close state of a menu item
  const handleToggleMenu = (key, event) => {
    event.stopPropagation(); // Prevent parent ListItemButton from also triggering
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Determines if a menu item is currently active (selected)
  const isMenuActive = (item, currentPath = location.pathname) => {
    if (item.path === currentPath) return true;
    return item.children?.some((child) => isMenuActive(child, currentPath));
  };

  // Opens the bundle-up dialog
  const handleOpenBundleUpDialog = useCallback((item) => {
    setBundleUpDialog({ open: true, itemData: item });
  }, []);

  // Handles the confirmation for bundling and downloading DAT files
const handleBundleConfirm = useCallback(async (selectedItems, fileNameFromAPI) => {
  const storedValidationSession = sessionStorage.getItem('validationSession');
  let currentValidationSession = storedValidationSession ? JSON.parse(storedValidationSession) : {};

  const filesToBundle = [];
  const notValidatedOrMissingFile = [];

  // Step 1: Check each selected item for validation & file
  selectedItems.forEach(item => {
    const sessionData = currentValidationSession[item.text];
    if (sessionData?.validated && sessionData?.fileName) {
      filesToBundle.push(sessionData.fileName);
    } else {
      notValidatedOrMissingFile.push(item.text);
    }
  });

  // Step 2: Handle missing or invalid files
  if (notValidatedOrMissingFile.length > 0) {
    handleShowSnackbar(
      `Components not validated or missing file data: ${notValidatedOrMissingFile.join(', ')}. Bulk DAT download prevented.`,
      "warning"
    );
    console.log("Bulk DAT download prevented. Issues with:", notValidatedOrMissingFile);
    return;
  }

  if (filesToBundle.length === 0) {
    handleShowSnackbar("No validated components with file data were selected for bundling.", "info");
    return;
  }

  if (!fileNameFromAPI) {
    handleShowSnackbar("No bundle file name received from backend. Please try again.", "error");
    return;
  }

  try {
    handleShowSnackbar("Preparing file for download...", "info");

    // Step 3: Fetch the already generated file from backend
    const response = await fetch(`${apiEndpoint}/static/bundle/${fileNameFromAPI}`);
    if (!response.ok) {
      throw new Error(`File not found or download failed (status ${response.status})`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileNameFromAPI;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    handleShowSnackbar(`Successfully downloaded ${fileNameFromAPI}!`, "success");

    // ✅ Step 4: Post DAT generated file info to backend
    const newJob = {
      id: Date.now(),
      component: selectedItems.map(i => i.text).join(", "), // bulk components
      fileName: fileNameFromAPI,
      timeCreated: new Date().toISOString(),
      status: 'DAT Generated',
      contentId: null,
      requestId: null,
      oracleJobSummary: null,
    };

    await fetch(`${apiEndpoint}/api/hdl/getdata/${customerName}/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    });

    console.log("DAT info successfully posted to backend:", newJob);

  } catch (error) {
    console.error("Error downloading or posting DAT:", error);
    handleShowSnackbar(`Failed to download or post DAT file: ${error.message}`, "error");
  }
}, [handleShowSnackbar]);


  // Renders menu items recursively
  const renderMenuItems = (items, level = 0) =>
    items.map((item) => (
      <MenuItemComponent
        key={item.hierarchy.join(' > ')}
        item={item}
        level={level}
        collapsed={collapsed}
        isActive={isMenuActive(item)}
        openMenus={openMenus}
        handleNavigate={handleNavigate}
        handleToggleMenu={handleToggleMenu}
        onUploadExcel={handleUploadExcel}
        onShowSnackbar={handleShowSnackbar}
        onOpenBundleUpDialog={handleOpenBundleUpDialog}
        isMenuActive={isMenuActive} // Pass the isMenuActive function here
        validationSession={validationSession} // Pass validationSession to MenuItemComponent
      />
    ));

  // Renders skeleton loaders while menu items are loading
  const renderSkeletonItems = (count = 6) =>
    Array.from({ length: count }).map((_, idx) => (
      <ListItemButton key={idx} sx={{ py: 1, px: collapsed ? 2 : 3 }}>
        <ListItemIcon
          sx={{ color: "#e3f2fd", minWidth: 0, mr: collapsed ? "auto" : 2 }}
        >
          <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </ListItemIcon>
        {!collapsed && (
          <Skeleton variant="rectangular" height={20} width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        )}
      </ListItemButton>
    ));

  // Collects all mandatory objects under a given node
  const collectMandatoryObjects = (node) => {
    let result = [];
    if (!node) return result;

    if (node.Mandatory_Objects) {
      result.push(node.text);
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(child => {
        result = result.concat(collectMandatoryObjects(child));
      });
    }
    return result;
  };

  // Collects all non-mandatory objects (components with an associated file) under a given node
  const collectNonMandatoryObjects = (node) => {
    let result = [];
    if (!node) return result;

    // A node is considered a 'component' if it has a 'file' property
    // We collect it if it's not mandatory AND it's a component (has a file)
    if (node.file && !node.Mandatory_Objects) {
      result.push(node.text);
    }

    // Recursively check children
    if (Array.isArray(node.children)) {
      node.children.forEach(child => {
        result = result.concat(collectNonMandatoryObjects(child));
      });
    }
    return result;
  };

  // Handles downloading of the validation error report
  const handleValidateDownload = useCallback(() => {
    if (uploadDialog.downloadExcelFilename) {
      const downloadUrl = `${apiEndpoint}/api/hdl/download-validation-report/${uploadDialog.downloadExcelFilename}`;
      window.open(downloadUrl, '_blank');
      handleShowSnackbar("Downloading error report...", "info");
    } else {
      handleShowSnackbar("No error report available for download.", "warning");
    }
  }, [uploadDialog.downloadExcelFilename, handleShowSnackbar]);


  // Handles the Excel file upload and subsequent validation process
  const handleUploadExcel = async (event, item) => {
    const file = event.target.files[0];
    if (file) {
      setExcelUploading(true);
      const formData = new FormData();
      formData.append('parent_name', item.text);
      formData.append('excelFile', file);
      formData.append('Mandatory_Objects', item.Mandatory_Objects.toString());

      // **FIX**: Directly use the hierarchy array to ensure robustness.
      // This is more reliable than depending on the level_x properties which might not be correctly populated
      // if the mapping logic changes.
      const customerNameFromItem = item.hierarchy?.[0] || null;
      const instanceNameFromItem = item.hierarchy?.[1] || null;
      setCustomerName(customerNameFromItem);
      setInstanceName(instanceNameFromItem);

      console.log("Uploading with Level 1:", customerNameFromItem);
      console.log("Uploading with Level 2:", instanceNameFromItem);

      formData.append('customerName', customerNameFromItem);
      formData.append('InstanceName', instanceNameFromItem);

      // Find the actual Level 6 parent node for collecting all mandatory objects within its scope
      const actualL6ParentNode = getActualLevel6ParentNode(item, menuItems);
      if (!actualL6ParentNode) {
        console.error("Could not find the original level 6 parent node for collecting mandatory objects during upload.");
        setExcelUploading(false);
        setUploadDialog({
          open: true,
          type: 'error',
          message: 'Failed to identify the parent component for mandatory object collection. Please ensure the hierarchy is correctly defined.',
          files: [],
          validationResults: [],
          downloadExcelFilename: null,
        });
        return;
      }

      // Safely parse session storage items, defaulting to empty arrays if parsing fails
      let assignment_status_rules = [];
      try {
        assignment_status_rules = JSON.parse(sessionStorage.getItem('AssignmentStatusRows') || '[]');
      } catch (err) {
        console.error("Invalid JSON in sessionStorage for AssignmentStatusRows:", err);
      }

      let termActions = [];
      try {
        termActions = JSON.parse(sessionStorage.getItem('TermActions') || '[]');
      } catch (err) {
        console.error("Invalid JSON in sessionStorage for TermActions:", err);
      }
      formData.append('TermActions', JSON.stringify(termActions));

      // Robust parsing for GlobalTransferActions
      let globalTransferActions = [];
      try {
          const storedGlobal = sessionStorage.getItem('GlobalTransferActions');
          if (storedGlobal) {
              const parsedGlobal = JSON.parse(storedGlobal);
              if (Array.isArray(parsedGlobal)) {
                  globalTransferActions = parsedGlobal;
              } else if (typeof parsedGlobal === 'string') {
                  globalTransferActions = parsedGlobal.split(',').map(item => item.trim().toUpperCase()).filter(item => item !== '');
              }
          }
      } catch (e) {
          console.error("Error parsing stored GlobalTransferActions:", e);
          globalTransferActions = [];
      }
      formData.append('glbTransfers', JSON.stringify(globalTransferActions));

      let hireActions = [];
      try {
        hireActions = JSON.parse(sessionStorage.getItem('HireActions') || '[]');
      } catch (err) {
        console.error("Invalid JSON in sessionStorage for HireActions:", err);
      }
      let rehireActions = [];
      try {
        rehireActions = JSON.parse(sessionStorage.getItem('RehireActions') || '[]');
      } catch (err) {
        console.error("Invalid JSON in sessionStorage for RehireActions:", err);
      }
      hireActions = hireActions.concat(rehireActions);
      console.log("HireAction Data",hireActions);
      formData.append('HireActions', JSON.stringify(hireActions));
      formData.append('assignment_status_rules', JSON.stringify(assignment_status_rules));

      const allMandatoryObjects = collectMandatoryObjects(actualL6ParentNode);
      const allNonmandatorycomponent = collectNonMandatoryObjects(actualL6ParentNode);
      formData.append('all_mandatory_objects', JSON.stringify(allMandatoryObjects));
      formData.append('all_non_mandatory_objects', JSON.stringify(allNonmandatorycomponent));
      
      let uploadedFilesResponse = [];
      let uploadSuccess = false;

      try {
        const uploadRes = await fetch(`${apiEndpoint}/api/hdl/bulk-excel-upload`, {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedFilesResponse = uploadData.files;
          uploadSuccess = true; 
          setUploadedExcelFiles(file.name); // Store only the latest file name
          updateBulkValidationSession(
            actualL6ParentNode.text, 
            true, 
            file.name, 
            customerNameFromItem, 
            instanceNameFromItem
          );

          const componentFilesForValidation = uploadedFilesResponse.reduce((acc, fileItem) => {
            if (allMandatoryObjects.includes(fileItem.child)) {
              const fileNameOnly = fileItem.file.split('/').pop().split('\\').pop();
              acc[fileItem.child] = fileNameOnly;
            }
            return acc;
          }, {});

          const validationRes = await fetch(`${apiEndpoint}/api/hdl/bulk/cross-file/personNumber/validate?export_as_excel=true`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parent_name: actualL6ParentNode.text,
              component_files: componentFilesForValidation,
              all_mandatory_objects: allMandatoryObjects,
              all_non_mandatory_objects: allNonmandatorycomponent,
              customerName: customerNameFromItem, // Added customerName to validation call
              InstanceName: instanceNameFromItem, // Added InstanceName to validation call
            }),
          });

          if (validationRes.ok) {
            const validationData = await validationRes.json();
            const failedPersonNumbers = validationData.failed_person_numbers || [];
            let dialogMessage = `File Uploaded Successfully!`;

            setUploadDialog(prev => ({
              ...prev,
              validationResults: failedPersonNumbers,
              downloadExcelFilename: validationData.exported_excel_filename,
            }));

            // Update validationSession for each uploaded component
            uploadedFilesResponse.forEach(fileItem => {
                updateValidationSession(fileItem.child, false, null); // Mark as not validated initially
            });

            if (failedPersonNumbers.length > 0) {
              try {
                const personNumbersToRemove = failedPersonNumbers.map(item => item.person_number);
                const removeRes = await fetch(`${apiEndpoint}/api/hdl/bulk/cross-file/personNumber/remove-failed-values`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    parent_name: actualL6ParentNode.text,
                    component_files: componentFilesForValidation,
                    person_numbers_to_remove: personNumbersToRemove,
                    customerName: customerNameFromItem, // Added customerName to removal call
                    InstanceName: instanceNameFromItem, // Added InstanceName to removal call
                  }),
                });

                if (removeRes.ok) {
                  const removeData = await removeRes.json();
                  handleShowSnackbar("Failed person numbers removed successfully from files!", "success");
                  console.log("Removal Summary:", removeData.removal_summary);
                  dialogMessage += ` ${failedPersonNumbers.length} failed person numbers were automatically removed from files.`;
                } else {
                  const errorText = await removeRes.text();
                  handleShowSnackbar(`Failed to automatically remove values: ${errorText}`, "error");
                  dialogMessage += ` Failed to automatically remove ${failedPersonNumbers.length} person numbers: ${errorText}`;
                }
              } catch (removeErr) {
                handleShowSnackbar(`Error during automatic removal: ${removeErr.message}`, "error");
                dialogMessage += ` Error during automatic removal: ${removeErr.message}`;
              }
              setUploadDialog(prev => ({
                ...prev,
                open: true,
                type: 'success',
                message: dialogMessage,
                files: uploadedFilesResponse,
                targetItem: item,
              }));

            } else {
              dialogMessage += ``;
              setUploadDialog(prev => ({
                ...prev,
                open: true,
                type: 'success',
                message: dialogMessage,
                files: uploadedFilesResponse,
                targetItem: item,
              }));
            }

          } else {
            const validationErr = await validationRes.text();
            setUploadDialog({
              open: true,
              type: 'error',
              message: `Bulk upload successful, but validation failed: ${validationErr}`,
              files: uploadedFilesResponse,
              validationResults: [],
              downloadExcelFilename: null,
              targetItem: item,
            });
          }

          setUploadedExcelParents(prev => new Set(prev).add(actualL6ParentNode.text));

          setExcelFileMap(prev => ({
            ...prev,
            [actualL6ParentNode.text]: uploadedFilesResponse.reduce((acc, f) => {
              acc[f.child] = f.file;
              return acc;
            }, {})
          }));

        } else {
          const uploadErr = await uploadRes.text();
          setUploadDialog({
            open: true,
            type: 'error',
            message: `Bulk upload failed: ${uploadErr}`,
            files: [],
            validationResults: [],
            downloadExcelFilename: null,
            targetItem: item,
          });
        }
      } catch (err) {
        setUploadDialog({
          open: true,
          type: 'error',
          message: `Upload error: ${err.message || 'Network error'}`,
          files: uploadedFilesResponse,
          validationResults: [],
          downloadExcelFilename: null,
          targetItem: item,
        });
      } finally {
        setExcelUploading(false);
      }
    }
    event.target.value = null; // Clear the input so same file can be re-selected
  };

  // GSAP animation for the excel uploading loader
  useEffect(() => {
    if (excelUploading) {
      gsap.set(".dot-loader-dot", { y: 0, opacity: 1, scale: 1 });
      gsap.set(".dot-loader-shadow", { scaleX: 1, opacity: 0.3 });
      gsap.to(".dot-loader-dot", {
        y: -30,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        stagger: 0.15,
        ease: "power1.inOut"
      });
      gsap.to(".dot-loader-shadow", {
        scaleX: 1.5,
        opacity: 0.1,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        stagger: 0.15,
        ease: "power1.inOut"
      });
    } else {
      gsap.killTweensOf(".dot-loader-dot");
      gsap.killTweensOf(".dot-loader-shadow");
      gsap.set(".dot-loader-dot", { y: 0, opacity: 1, scale: 1 });
      gsap.set(".dot-loader-shadow", { scaleX: 1, opacity: 0.3 });
    }
  }, [excelUploading]);


  return (
    <Box sx={{ display: "flex", height: "100vh", position: 'relative' }}>
      {/* Excel Uploading Loader Overlay */}
      {excelUploading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(15,23,42,0.92)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <Box sx={{ position: 'relative', width: 120, height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <Box key={i} className="dot-loader-dot" sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#90caf9',
                marginX: 1.5,
                boxShadow: '0 2px 8px #1e293b44',
              }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', position: 'absolute', bottom: 8 }}>
            {[0, 1, 2].map(i => (
              <Box key={i} className="dot-loader-shadow" sx={{
                width: 22,
                height: 7,
                borderRadius: '50%',
                background: '#000',
                opacity: 0.3,
                marginX: 1.5,
                filter: 'blur(1.5px)',
              }} />
            ))}
          </Box>
          <Typography variant="h6" color="#e3f2fd" mt={3}>
            Uploading Excel and Validating... Please wait
          </Typography>
        </Box>
      )}
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        ref={sidebarRef}
        sx={{
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0f172a',
            color: '#e3f2fd',
            transition: 'width 0.3s',
            borderRight: 0,
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 0,
          },
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Toolbar with title and collapse button */}
          <Toolbar
            sx={{
              display: 'flex',
              justifyContent: collapsed ? 'center' : 'space-between',
              alignItems: 'center',
              px: 2,
              py: 2,
            }}
          >
            <Typography
              variant="h6"
              noWrap
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1,
              }}
              ref={titleRef}
            >
              HDL Gateway
            </Typography>
            <IconButton onClick={handleCollapseToggle} sx={{ color: '#e3f2fd' }}>
              {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Toolbar>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          {/* Search Input */}
          <Box
            sx={{
              px: 2,
            }}
            ref={searchRef}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#e3f2fd' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#1e293b',
                  color: '#e3f2fd',
                  borderRadius: 1,
                  '& input': { color: '#e3f2fd' },
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#5e7790' },
                  '&.Mui-focused fieldset': { borderColor: '#e3f2fd' },
                },
              }}
            />
          </Box>
          {/* Display only the latest uploaded Excel file */}
          {uploadedExcelFiles && !collapsed && (
            <Box sx={{ px: 2, pb: 1, mt: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e293b' }}>
              <Typography variant="caption" color="#90caf9" sx={{ wordBreak: 'break-all', mt: 2, display: 'block' }}>
                Latest Uploaded Excel:
              </Typography>
              <ListItemText
                primary={uploadedExcelFiles}
                primaryTypographyProps={{
                  variant: "caption",
                  color: "#90caf9",
                  noWrap: true,
                  sx: { display: 'block', wordBreak: 'break-all' }
                }}
              />
            </Box>
          )}
          {/* Menu List */}
          <List disablePadding sx={{ mt: 1, flex: 1, minHeight: 0, overflowY: 'auto' }} ref={menuListRef}>
            {/* Hardcoded menu items: Onboarding and Data Transformation at top level */}
            <MenuItemComponent
              key="Onboarding"
              item={{ text: "Onboarding", path: "/onboarding", originalLevel: 7, hierarchy: ["Onboarding"], Mandatory_Objects: false, icon: LoginIcon, isSpecialNavigable: true }}
              level={0}
              collapsed={collapsed}
              isActive={location.pathname === "/onboarding"}
              openMenus={openMenus}
              handleNavigate={handleNavigate}
              handleToggleMenu={handleToggleMenu}
              onUploadExcel={null} // No excel upload for hardcoded items
              onShowSnackbar={handleShowSnackbar}
              onOpenBundleUpDialog={() => handleShowSnackbar("Bundling not available for hardcoded items.", "info")}
              isMenuActive={isMenuActive}
              validationSession={validationSession}
            />
            <MenuItemComponent
              key="Data Transformation"
              item={{ text: "Data Transformation", path: "/hdl/data-transformation", originalLevel: 7, hierarchy: ["Data Transformation"], Mandatory_Objects: false, icon: TransformIcon, isSpecialNavigable: true }}
              level={0}
              collapsed={collapsed}
              isActive={location.pathname === "/hdl/data-transformation"}
              openMenus={openMenus}
              handleNavigate={handleNavigate}
              handleToggleMenu={handleToggleMenu}
              onUploadExcel={null} // No excel upload for hardcoded items
              onShowSnackbar={handleShowSnackbar}
              onOpenBundleUpDialog={() => handleShowSnackbar("Bundling not available for hardcoded items.", "info")}
              isMenuActive={isMenuActive}
              validationSession={validationSession}
            />

            

            {/* Dynamically rendered menu items */}
            {loading
              ? renderSkeletonItems()
              : renderMenuItems(
                sortMenuItems(filterMenuItems(menuItems, searchQuery))
              )}
          </List>
        </Box>
      </Drawer>
      {/* Upload Status Dialog */}
      <UploadStatusDialog
        open={uploadDialog.open}
        onClose={() => {
          setUploadDialog({ ...uploadDialog, open: false });
          if (uploadDialog.type === "success" && uploadDialog.targetItem) {
            handleNavigate(uploadDialog.targetItem);  // ✅ navigate on close
          }
        }}
        type={uploadDialog.type}
        message={uploadDialog.message}
        files={uploadDialog.files}
        validationResults={uploadDialog.validationResults}
        downloadExcelFilename={uploadDialog.downloadExcelFilename}
        onDownloadErrorReport={handleValidateDownload}
        
      />

      {/* Bundle Up Dialog */}
      <BundleUp
        open={bundleUpDialog.open}
        onClose={() => setBundleUpDialog({ ...bundleUpDialog, open: false })}
        itemData={bundleUpDialog.itemData}
        onBundleConfirm={handleBundleConfirm}
        onShowSnackbar={handleShowSnackbar}
        customerName={customerName}
        instanceName={instanceName}
      />

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', justifyContent: 'center' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sidebar;
