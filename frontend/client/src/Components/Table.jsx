import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Typography, Alert, CircularProgress, Skeleton, Paper,
} from '@mui/material';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTheme } from '@mui/material/styles'; // Import useTheme

gsap.registerPlugin(ScrollTrigger);

// Global pulse animation for the "Please select a component" message
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
  }
`;

function DataTable({ columns = [], rows = [], ComponentName = "Data Table", loading = false, error = null, isComponentSelected = true, collapsed = false }) { // Added 'collapsed' prop
  const theme = useTheme(); // Access the theme for consistent colors
  const hasValidColumns = Array.isArray(columns) && columns.length > 0;
  const hasValidRows = Array.isArray(rows) && rows.length > 0;

  const tableContainerRef = React.useRef(null);
  const dataGridRef = React.useRef(null);

  // GSAP animation for the table container entering/leaving view
  React.useEffect(() => {
    if (!tableContainerRef.current) return;

    gsap.set(tableContainerRef.current, { autoAlpha: 0, y: 50 });

    const st = ScrollTrigger.create({
      trigger: tableContainerRef.current,
      start: "top 80%", // Start animation when top of element hits 80% of viewport
      end: "bottom 20%", // End animation when bottom of element leaves 20% of viewport
      toggleActions: "play none none reverse", // Play on enter, reverse on leave back
      onEnter: () => {
        gsap.to(tableContainerRef.current, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        });
      },
      onLeaveBack: () => {
        gsap.to(tableContainerRef.current, {
          autoAlpha: 0,
          y: 50,
          duration: 0.5,
          ease: "power2.in",
        });
      },
    });

    return () => {
      st.kill(); // Clean up ScrollTrigger on unmount
    };
  }, [isComponentSelected, loading, error, hasValidColumns, hasValidRows]);

  // GSAP animation for the DataGrid itself when data is loaded
  React.useEffect(() => {
    if (!loading && hasValidColumns && hasValidRows && isComponentSelected && dataGridRef.current) {
      gsap.fromTo(
        dataGridRef.current.querySelector('.MuiDataGrid-root'), // Target the actual DataGrid root element
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.1 }
      );
    }
  }, [loading, hasValidColumns, hasValidRows, isComponentSelected]);

  // Dynamically adjust column widths based on 'collapsed' prop
  const getAdjustedColumns = React.useCallback(() => {
    return columns.map(col => {
      let newWidth = col.width;
      if (collapsed) {
        // Shrink widths when collapsed, adjust these values as needed
        if (col.field === "Attributes") newWidth = 150;
        else if (col.field === "required") newWidth = 80;
        else if (col.field === "LookUp data") newWidth = 120;
        else if (col.field === "Data Transformation") newWidth = 150;
        else if (col.field === "includeInDatFileGeneration") newWidth = 120;
      } else {
        // Restore original widths when not collapsed
        if (col.field === "Attributes") newWidth = 250;
        else if (col.field === "required") newWidth = 150;
        else if (col.field === "LookUp data") newWidth = 200;
        else if (col.field === "Data Transformation") newWidth = 250;
        else if (col.field === "includeInDatFileGeneration") newWidth = 180;
      }
      return { ...col, width: newWidth };
    });
  }, [columns, collapsed]);

  const adjustedColumns = getAdjustedColumns();

  // Renders a skeleton table while data is loading
  const renderSkeletonTable = () => {
    const skeletonRowsCount = 6;
    const skeletonColsCount = columns.length > 0 ? columns.length : 4; // Use actual column count if available

    return (
      <Box
        sx={{
          height: 420, // Fixed height for skeleton
          width: '100%',
          p: 2,
          bgcolor: theme.palette.grey[50], // Lighter grey background
          borderRadius: theme.shape.borderRadius, // Use theme border radius
          display: 'flex',
          flexDirection: 'column',
          gap: 1, // Increased gap for better spacing
        }}
      >
        {/* Skeleton for header row */}
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: theme.shape.borderRadius, bgcolor: theme.palette.grey[200] }} width="100%" />
        {/* Skeletons for data rows */}
        {[...Array(skeletonRowsCount)].map((_, rowIdx) => (
          <Box key={rowIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[...Array(skeletonColsCount)].map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                variant="rectangular"
                sx={{
                  flex: 1, // Distribute width evenly
                  minWidth: 100, // Minimum width for each skeleton cell
                  height: 35,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.grey[100], // Slightly darker grey for cells
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  };

return (
  <Box sx={{ width: "100%", p: 3, boxSizing: "border-box" }}>
    <Typography
      variant="h6"
      gutterBottom
      sx={{
        color: theme.palette.text.primary,
        fontWeight: 700,
        fontSize: "1.4rem",
        letterSpacing: "0.3px",
      }}
    >
      {ComponentName} Attributes
    </Typography>

    <Box
      ref={tableContainerRef}
      sx={{
        position: "relative",
        height: "auto",
        width: "100%",
        border:
          !loading && hasValidColumns && hasValidRows && isComponentSelected
            ? `1px solid ${theme.palette.divider}`
            : "none",
        borderRadius: "18px",
        overflow: "hidden",
        bgcolor: "rgba(255,255,255,0.85)",
        background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        backdropFilter: "blur(14px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <style>{pulseAnimation}</style>

      {!isComponentSelected ? (
        <Box
          sx={{
            height: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              animation: "pulse 2s infinite ease-in-out",
              fontWeight: "bold",
              fontSize: "1.25rem",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            👋 Please select a component from the sidebar to begin.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Once selected, you can upload DAT and Excel files to configure its
            attributes.
          </Typography>
        </Box>
      ) : loading ? (
        <>
          {renderSkeletonTable()}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255, 255, 255, 0.6)",
              zIndex: 2,
            }}
          >
            <CircularProgress size={60} color="primary" />
          </Box>
        </>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            my: 2,
            mx: 2,
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          Failed to load data: {error}
        </Alert>
      ) : !hasValidColumns || !hasValidRows ? (
        <Alert
          severity="info"
          sx={{
            my: 2,
            mx: 2,
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          No data or attributes found for {ComponentName}. Please upload a DAT
          file.
        </Alert>
      ) : (
        <Box sx={{ height: 420, width: "100%" }} ref={dataGridRef}>
          <DataGrid
            rows={rows}
            columns={adjustedColumns}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              fontFamily: "'Inter', sans-serif",
              "& .MuiDataGrid-columnHeaders": {
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: theme.palette.grey[100],
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: "0.95rem",
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.9rem",
                borderBottom: `1px solid ${theme.palette.grey[200]}`,
                transition: "color 0.2s ease, background 0.2s ease",
              },
              "& .MuiDataGrid-row:nth-of-type(even)": {
                backgroundColor: theme.palette.grey[50], // striped rows
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: theme.palette.action.hover,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.grey[50],
                fontWeight: 500,
              },
              "& .MuiTablePagination-root": {
                color: theme.palette.text.secondary,
              },
            }}
          />
        </Box>
      )}
    </Box>
  </Box>
);

}

export default DataTable;
