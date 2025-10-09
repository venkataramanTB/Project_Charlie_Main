import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import { gsap } from "gsap";

const FilePreviewer = ({ fileUrl, fileType }) => {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gridRef = useRef(null);

  useEffect(() => {
    if (!fileUrl || !fileType) return;

    const fetchFile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file");

        let headers = [];
        let data = [];

        if (fileType === "excel") {
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (jsonData.length > 0) {
            headers = jsonData[0].map((h) => h?.toString().trim() || "");
            data = jsonData.slice(1).map((row, idx) => {
              const rowObj = { id: idx + 1 };
              headers.forEach((h, i) => {
                rowObj[h] = (row[i] ?? "").toString().trim();
              });
              return rowObj;
            });
          }
        } else if (fileType === "dat") {
          const text = await response.text();
          const lines = text.trim().split("\n");
          if (lines.length > 0) {
            headers = lines[0].split("|").map((h) => h.trim());
            data = lines.slice(1).map((line, idx) => {
              const values = line.split("|");
              const rowObj = { id: idx + 1 };
              headers.forEach((h, i) => {
                rowObj[h] = (values[i] ?? "").trim();
              });
              return rowObj;
            });
          }
        }

        // Build column definitions
        setColumns(
          headers.map((h) => ({
            field: h,
            headerName: h,
            flex: 1,
            sortable: true,
            filterable: true,
          }))
        );
        setRows(data);

      } catch (err) {
        setError(err.message || "Error loading file");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileUrl, fileType]);

  // GSAP animation for grid
  useEffect(() => {
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [rows, fileType]);

  const handleDownload = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  if (!fileUrl) {
    return <Typography variant="body2">No file selected.</Typography>;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
        {error}
      </Typography>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        p: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {fileType === "excel" ? "📊 Excel Preview" : "📄 DAT Preview"}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
      </Box>

      {/* DataGrid */}
      <div ref={gridRef} style={{ height: 420, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          sx={{
            borderRadius: 2,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "grey.100",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: "action.hover",
            },
          }}
        />
      </div>
    </Paper>
  );
};

export default FilePreviewer;
