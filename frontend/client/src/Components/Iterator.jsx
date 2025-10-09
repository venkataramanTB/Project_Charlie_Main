import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, MenuItem, Select, Box, Typography, TextField, InputAdornment } from "@mui/material";
import LoopIcon from "@mui/icons-material/Loop";

const operators = ["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"];

const Iterator = ({ open, onClose, attributes = [], onIncrementDefined }) => {
  // If condition
  const [ifCond, setIfCond] = useState({ attr: "", operator: "=", value: "" });
  // Else action
  const [elseAction, setElseAction] = useState("");
  // Increment value
  const [increment, setIncrement] = useState(1);

  const handleSave = () => {
    if (ifCond.attr && increment) {
      onIncrementDefined && onIncrementDefined({ attr: ifCond.attr, increment });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Increment Builder
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <LoopIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Build your <b>if-else</b> logic:
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            If
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Select
              value={ifCond.attr}
              onChange={e => setIfCond({ ...ifCond, attr: e.target.value })}
              displayEmpty
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="" disabled>Select Attribute</MenuItem>
              {attributes.map((attr, i) => (
                <MenuItem key={i} value={attr}>{attr}</MenuItem>
              ))}
            </Select>
            <Select
              value={ifCond.operator}
              onChange={e => setIfCond({ ...ifCond, operator: e.target.value })}
              size="small"
              sx={{ minWidth: 80 }}
            >
              {operators.map((op, i) => (
                <MenuItem key={i} value={op}>{op}</MenuItem>
              ))}
            </Select>
            <TextField
              value={ifCond.value}
              onChange={e => setIfCond({ ...ifCond, value: e.target.value })}
              placeholder="Value"
              size="small"
              sx={{ minWidth: 80 }}
            />
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Then (increment)
          </Typography>
          <TextField
            type="number"
            value={increment}
            onChange={e => setIncrement(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 120 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">step</InputAdornment>
            }}
            disabled={!ifCond.attr}
          />
          <Typography variant="caption" sx={{ ml: 1 }}>
            {ifCond.attr ? `Will increment ${ifCond.attr} by this value` : 'Select an attribute above'}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Else
          </Typography>
          <TextField
            value={elseAction}
            onChange={e => setElseAction(e.target.value)}
            placeholder="Action if false..."
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <b>Preview:</b><br />
            {`if (${ifCond.attr} ${ifCond.operator} ${ifCond.value}) {`}
            <br />&nbsp;&nbsp;{ifCond.attr ? `${ifCond.attr} += ${increment};` : '[increment action]'}
            <br />{`} else {`}
            <br />&nbsp;&nbsp;{elseAction || '[else action]'}
            <br />{`}`}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Iterator;
