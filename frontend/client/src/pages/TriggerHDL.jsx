import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import TriggerDialog from '../Components/TriggerDialogBox';
import ErrorDetailsDialog from '../Components/Trigger-Error'; // Import the new error dialog component

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

// AnimatedButton component (copied for reusability in TriggerHDL)
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

    if (startIconRef.current) {
      gsap.to(startIconRef.current, {
        x: -5,
        rotation: -10,
        ease: "power1.out",
        duration: 0.2,
        onComplete: () => {
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
        x: 5,
        rotation: 10,
        ease: "power1.out",
        duration: 0.2,
        onComplete: () => {
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

// AnimatedTitleText component (copied for reusability in TriggerHDL)
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
      variant="h4"
      fontWeight={600}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        color: '#333',
        mb: 3
      }}
    >
      <span ref={textWrapperRef} style={{ display: 'inline-flex' }} />
    </Typography>
  );
};


const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;

// TriggerHDL component now accepts level1Parent and level2Parent as props
const TriggerHDL = ({ level1Parent, level2Parent }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  // New states for ErrorDetailsDialog
  const [openErrorDetailsDialog, setOpenErrorDetailsDialog] = useState(false);
  const [errorDialogRequestId, setErrorDialogRequestId] = useState(null);
  const [errorDialogJobSummary, setErrorDialogJobSummary] = useState(null);
  const [updatingEffects, setUpdatingEffects] = useState(false);
  //CustomerName and Instance
  const customerName = level1Parent;
  const instanceName = level2Parent;
  const titleRef = useRef();
  const shapesRef = useRef();

  //side
  const drawerWidth = 350;
  const collapsedWidth = 64;

useEffect(() => {
  if (!titleRef.current || !shapesRef.current) return;

  const split = new SplitText(titleRef.current, { type: 'chars', charsClass: 'char-text' });
  gsap.set(titleRef.current, { perspective: 400 });

  const chars = split.chars;
  const shapes = [];
  const svgNS = 'http://www.w3.org/2000/svg';

  chars.forEach((charEl) => {
    const rect = charEl.getBoundingClientRect();
    const shape = document.createElementNS(svgNS, 'circle');
    shape.setAttribute('r', 4 + Math.random() * 3);
    shape.setAttribute('fill', '#1976d2');
    shape.setAttribute('cx', rect.left + rect.width / 2);
    shape.setAttribute('cy', rect.top + rect.height / 2 + 20);
    shape.style.opacity = 0;
    shapesRef.current.appendChild(shape);
    shapes.push(shape);
  });

  const tl = gsap.timeline();
  tl.from(chars, {
    duration: 1.2,
    opacity: 0,
    y: 80,
    rotationX: 90,
    ease: 'back.out(1.5)',
    stagger: { each: 0.04, from: 'start' },
  }).to(
    shapes,
    {
      y: '-=30',
      opacity: 1,
      scale: () => 0.5 + Math.random(),
      rotation: () => Math.random() * 360,
      ease: 'bounce.out',
      stagger: { each: 0.03, from: 'start' },
    },
    '<0.2'
  );

  return () => {
    split.revert();
    shapes.forEach((s) => s.remove());
  };
}, []);


useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/api/hdl/fetchdata/${customerName}/${instanceName}`);
      let data = await res.json();

      // Just set rows from backend, no sessionStorage handling
      setRows(data.map((job, idx) => ({ ...job, id: job.id ?? idx })));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [customerName, instanceName]);

const [rowsToUpdate, setRowsToUpdate] = useState([]);

const updateBackendRows = async (rows) => {
  for (const row of rows) {
    try {
      const response = await fetch(
        `${apiEndpoint}/api/hdl/updatedata/${customerName}/${instanceName}/${row.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: row.id,
            component: row.component,
            fileName: row.fileName,
            contentId: row.contentId ?? "N/A",
            status: row.status ?? "N/A",
            requestId: row.requestId ?? "N/A",
          }),
        }
      );
      if (!response.ok) console.error('Failed backend update:', await response.text());
    } catch (err) {
      console.error('Backend update error:', err);
    }
  }
};

// Whenever you need to update backend (e.g., after updating a row)
const handleRowUpdate = (id, newContentId, newStatus, newRequestId, newJobSummary) => {
  setRows(prevRows =>
    prevRows.map(row =>
      row.id === id
        ? {
            ...row,
            contentId: newContentId ?? row.contentId ?? "N/A",
            status: newStatus ?? row.status ?? "N/A",
            requestId: newRequestId ?? row.requestId ?? "N/A",
            oracleJobSummary: newJobSummary ?? row.oracleJobSummary ?? null,
          }
        : row
    )
  );

  const updatedRow = rows.find(r => r.id === id);
  if (updatedRow) updateBackendRows([updatedRow]);
};
const updateRowData = (id, newContentId, newStatus, newRequestId, newJobSummary) => {
  handleRowUpdate(id, newContentId, newStatus, newRequestId, newJobSummary);
};



  const handleTriggerHDL = (row) => {
    setSelectedData(row);
    setOpenDialog(true);
  };

  const handleOpenErrorDetails = (requestId, jobSummary) => {
    setErrorDialogRequestId(requestId);
    setErrorDialogJobSummary(jobSummary);
    setOpenErrorDetailsDialog(true);
  };

  const handleCloseErrorDetails = () => {
    setOpenErrorDetailsDialog(false);
    setErrorDialogRequestId(null);
    setErrorDialogJobSummary(null);
  };

  const columns = [
    {
      field: 'component',
      headerName: 'Business Object',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'fileName',
      headerName: 'DAT File Name',
      flex: 1.5,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ color: params.value === 'N/A' ? 'red' : '#000' }}>
          {params.value}
        </Box>
      ),
    },
   {
      field: 'timeCreated',
      headerName: 'Time Created',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        const date = new Date(params.value);
        return isNaN(date.getTime())
          ? 'N/A'
          : date.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });
      },
    },
    {
      field: 'actions',
      headerName: 'Trigger HDL',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => {
        const isDisabled = params.row.fileName === 'N/A';
        return isDisabled ? (
          <Box sx={{ color: 'red', fontSize: 13 }}>Missing File</Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{
              fontSize: 12,
              px: 2,
              py: 0.5,
              mb: 2,
              minWidth: 100,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 0 8px #1976d2',
              },
            }}
            onClick={() => handleTriggerHDL(params.row)}
          >
            Trigger
          </Button>
        );
      },
    },
    {
      field: 'contentId',
      headerName: 'Content ID',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'requestId', // New column for Request ID
      headerName: 'Request ID',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1.2,
      minWidth: 200,
      renderCell: (params) => {
        const errorStatuses = ['ERROR', 'TIMEOUT', 'ORA_IN_ERROR', 'FAILED', 'WARNING', 'ORA_IN_PROGRESS'];
        const isErrorStatus = errorStatuses.includes(params.value.toUpperCase());
        const isCompletedStatus = params.value.toUpperCase() === 'COMPLETED';

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

        if (isErrorStatus) {
          return (
            <AnimatedButton
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleOpenErrorDetails(params.row.requestId, params.row.oracleJobSummary)}
              sx={{
                fontSize: 12,
                px: 1,
                py: 0.5,
                mb: 2,
                ...buttonHoverActiveStyles
              }}
            >
              {params.value}
            </AnimatedButton>
          );
        } else if (isCompletedStatus) {
          return (
            <Box sx={{ color: 'green', fontWeight: 'bold', mb: 2 }}>
              {params.value}
            </Box>
          );
        } else {
          return (
            <Box sx={{ color: 'text.secondary' }}>
              {params.value}
            </Box>
          );
        }
      },
    },
  ];

return (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f0f2f5',
      p: 1,
      boxSizing: 'border-box',
    }}
  >
    {/* Header */}
    <Box
      ref={shapesRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '0',
        pointerEvents: 'none',
      }}
    />

    <Typography
      ref={titleRef}
      variant="h6"
      sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5, overflow: 'hidden', display: 'inline-block' }}
    >
      Import and Load Data
    </Typography>
      <Typography variant="body2" sx={{ color: '#555', mb: 0.25, fontSize: '0.75rem' }}>
        Customer Name: {level1Parent || 'N/A'}
      </Typography>
      <Typography variant="body2" sx={{ color: '#555', fontSize: '0.75rem' }}>
        Instance Name: {level2Parent || 'N/A'}
      </Typography>
    {/* Paper container for DataGrid */}
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        maxWidth: 960,
        flex: 1,
        height: '60vh', // controlled height
        p: 1,
        borderRadius: 1.5,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {loading ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={24} />
        </Box>
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5 } },
          }}
          autoHeight={false}
          sx={{
            flex: 1,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              fontSize: 11,
              color: '#1976d2',
              minHeight: '32px !important',
              lineHeight: '32px',
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              fontSize: '11px',
              padding: '4px 8px',
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowY: 'auto',
            },
          }}
        />
      )}
    </Paper>

    {/* Trigger Dialog */}
    {openDialog && selectedData && (
      <TriggerDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        customerName={customerName}
        instanceName={instanceName}
        rowData={selectedData}
        apiEndpoint={apiEndpoint}
        onUpdateRow={(newContentId, newStatus, newRequestId, newJobSummary) =>
          updateRowData(selectedData.id, newContentId, newStatus, newRequestId, newJobSummary)
        }
      />
    )}

    {/* Error Dialog */}
    {openErrorDetailsDialog && (
      <ErrorDetailsDialog
        open={openErrorDetailsDialog}
        onClose={handleCloseErrorDetails}
        apiEndpoint={apiEndpoint}
        oracleRequestId={errorDialogRequestId}
        oracleJobSummary={errorDialogJobSummary}
        customerName={customerName}
        instanceName={instanceName}
      />
    )}
  </Box>
);


};

export default TriggerHDL;
