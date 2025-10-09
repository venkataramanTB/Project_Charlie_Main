import React, { useRef, useEffect } from "react";
import { Paper, TextField, IconButton, Box, Typography } from "@mui/material";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { gsap } from 'gsap'; // Import gsap here as well if you use it in the component directly

// --- useIntersectionObserver Hook (DEFINED GLOBALLY OR IN A UTILS FILE) ---
// This hook remains outside any specific component
const useIntersectionObserver = (options) => {
  const [isIntersecting, setIntersecting] = React.useState(false); // Use React.useState to be explicit
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
      observer.disconnect();
    };
  }, [options]);

  return [targetRef, isIntersecting];
};


// RulePaper Component
const RulePaper = ({
  nlr,
  idx,
  onNlrChange,
  onRemoveNlr,
  csvHeaders,
  onOpenAttributePopover,
  ruleAnimation, // Pass the animation callback
  rulePaperAnimations // Pass the ref for animation instances
}) => {
  // Call hooks at the top level of this component
  const [rulePaperRef, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

  // Trigger animation when intersection status changes
  useEffect(() => {
    if (rulePaperRef.current) {
      ruleAnimation(rulePaperRef.current, isIntersecting, idx);
    }
  }, [isIntersecting, rulePaperRef, idx, ruleAnimation]); // Dependencies for this useEffect

  // Also include the inputRef for the TextField
  const inputRef = useRef(null);
  useEffect(() => {
    // If you need to access this ref from parent (e.g., for focus), you'd use useImperativeHandle
    // For now, it's just for the TextField itself
    // Example: storing it in the parent's inputRefs.current array
    if (inputRef.current) {
      if (rulePaperAnimations.current && rulePaperAnimations.current[idx]) {
        rulePaperAnimations.current[idx].inputElement = inputRef.current; // Attach to animation instance for later access if needed
      }
    }
  }, [idx, rulePaperAnimations]);

  return (
    <>
      <Paper
        elevation={2}
        ref={rulePaperRef} // Attach the ref from the hook
        id={`rule-paper-${idx}`} // Add an ID for direct removal animation targeting
        sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 3, bgcolor: '#fff', boxShadow: 2, gap: 2 }}
      >
        <TextField
          inputRef={inputRef} // Local ref for this TextField
          label={`Rule ${idx + 1}`}
          value={nlr}
          onChange={(e) => onNlrChange(idx, e.target.value)}
          fullWidth
          size="medium"
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: 17, fontWeight: 500, bgcolor: '#f5f7fa', borderRadius: 2, px: 2, py: 1 }
          }}
        />
        {csvHeaders.length > 0 && (
          <IconButton
            onClick={(event) => onOpenAttributePopover(event, idx)}
            color="primary"
            aria-label="insert attribute"
            sx={{ ml: 0.5, '&:hover': { transform: 'scale(1.2) rotate(10deg)' } }}
          >
            <DynamicFeedIcon />
          </IconButton>
        )}
        <IconButton
          onClick={() => onRemoveNlr(idx)}
          color="error"
          size="small"
          sx={{ ml: 1, visibility: onRemoveNlr ? 'visible' : 'hidden', '&:hover': { transform: 'scale(1.1) rotate(-10deg)' } }} // Assuming onRemoveNlr checks length in parent
          disabled={!onRemoveNlr} // Disable if remove function isn't provided
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Paper>
    </>
  );
};

export default RulePaper;