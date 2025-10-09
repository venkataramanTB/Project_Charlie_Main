import React, { useEffect, useState, useCallback, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Button, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Box } from "@mui/material";
import DataTransformation from "./HDL_DataTransformation";


const DataTransformationDialog = ({ open, onClose, collapsed, attribute_list = [], initialSelectedAttribute,RawExcelFile }) => {
    useEffect(() => {
    // This will log the prop value AFTER it has been updated and the component re-rendered
    console.log("DataTransformationDialog received RawExcelFile:", RawExcelFile);
  }, [RawExcelFile]); // Run this effect when RawExcelFile prop changes
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ bgcolor: "#1e293b", color: "#fff" }}>
        {/* Changed title to be more generic */}
        Data Transformation Tool
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "#fff" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ height: "80vh" }}>
          <DataTransformation
            RawExcelFile = {RawExcelFile}
            collapsed={collapsed}
            attributeList={attribute_list}
            initialSelectedAttribute={initialSelectedAttribute} // Pass the initial selected attribute
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: "#f5f5f5" }}>
        <Button onClick={onClose} color="secondary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataTransformationDialog;