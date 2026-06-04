import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";

/* ─────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:    #f0ebe0;
    --cream-dk: #e2dace;
    --warm-mid: #c8bfad;
    --warm-drk: #a09283;
    --leather:  #8b6f4e;
    --copper:   #b87333;
    --copper-lt:#d4935f;
    --steel:    #5a6475;
    --ink:      #2c2420;
    --ink-lt:   #5c4e44;
    --shadow-a: rgba(0,0,0,.45);
    --shadow-b: rgba(255,255,255,.85);
    --active:   #c0392b;
    --active-lt:#e74c3c;
    --green:    #27ae60;
  }

  body {
    font-family: 'Instrument Sans', sans-serif;
    background: var(--cream-dk);
    color: var(--ink);
    min-height: 100vh;
  }
`;

if (!document.getElementById("pvs-css")) {
  const s = document.createElement("style");
  s.id = "pvs-css";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   STEP DEFINITIONS
───────────────────────────────────────── */
const STEPS = ["Data Load", "Action Codes", "Assignment Status", "Review & Save"];

/* ─────────────────────────────────────────
   NEUMORPHIC BUTTON
───────────────────────────────────────── */
const NeuBtn = ({ children, onClick, disabled, accent, small, success: successStyle }) => {
  const ref = useRef(null);

  const down = () => gsap.to(ref.current, {
    boxShadow: "inset 4px 4px 14px rgba(0,0,0,.45), inset -3px -3px 10px rgba(255,255,255,.5)",
    scale: .97, duration: .1
  });
  const up = () => gsap.to(ref.current, {
    boxShadow: accent
      ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
      : successStyle
        ? "8px 8px 22px rgba(0,0,0,.35), -4px -4px 14px rgba(255,255,255,.7)"
        : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
    scale: 1, duration: .2, ease: "back.out(2)"
  });

  return (
    <button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseDown={down}
      onMouseUp={up}
      onMouseLeave={up}
      disabled={disabled}
      style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 700,
        fontSize: small ? 11 : 13,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        padding: small ? "10px 22px" : "14px 36px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: accent ? "#f8f0e0" : successStyle ? "#f8f0e0" : "var(--ink)",
        background: accent
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : successStyle
            ? "linear-gradient(135deg, #2ecc71, #1a8a4a)"
            : "linear-gradient(145deg, #ede6d6, #cec5b5)",
        boxShadow: disabled
          ? "inset 2px 2px 5px rgba(0,0,0,.2), inset -2px -2px 5px rgba(255,255,255,.4)"
          : accent
            ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
            : successStyle
              ? "8px 8px 22px rgba(0,0,0,.35), -4px -4px 14px rgba(255,255,255,.7)"
              : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
        opacity: disabled ? .6 : 1,
        transition: "opacity .2s, box-shadow .2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
      }}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   NEUMORPHIC INPUT
───────────────────────────────────────── */
const NeuInput = ({ label, value, onChange, onKeyDown, disabled, placeholder }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    {label && (
      <label style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
        textTransform: "uppercase", color: "var(--warm-drk)",
        display: "block", marginBottom: 6,
      }}>{label}</label>
    )}
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        width: "100%",
        fontFamily: "'DM Mono', monospace",
        fontSize: 14,
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.3)",
        background: "linear-gradient(145deg, #d8d0c0, #e8e0d2)",
        boxShadow: "inset 4px 4px 10px rgba(0,0,0,.15), inset -3px -3px 8px rgba(255,255,255,.6)",
        color: "var(--ink)",
        outline: "none",
        transition: "box-shadow .2s",
        opacity: disabled ? .5 : 1,
      }}
    />
  </div>
);

/* ─────────────────────────────────────────
   NEUMORPHIC CHIP
───────────────────────────────────────── */
const NeuChip = ({ label, onDelete, color = "var(--copper)" }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, fontWeight: 500,
    padding: "6px 14px", borderRadius: 20,
    background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
    boxShadow: "4px 4px 10px rgba(0,0,0,.25), -2px -2px 6px rgba(255,255,255,.7)",
    border: `1px solid ${color}33`,
    color,
    letterSpacing: ".04em",
    margin: "4px 4px",
  }}>
    {label}
    {onDelete && (
      <button
        onClick={onDelete}
        style={{
          border: "none", background: "transparent", cursor: "pointer",
          color: "var(--active)", fontSize: 14, fontWeight: 700,
          lineHeight: 1, padding: 0, marginLeft: 2,
        }}
        title="Remove"
      >×</button>
    )}
  </span>
);

/* ─────────────────────────────────────────
   NEUMORPHIC SNACKBAR
───────────────────────────────────────── */
const NeuSnackbar = ({ open, message, severity, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (open && ref.current) {
      gsap.fromTo(ref.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: .4, ease: "back.out(2)" }
      );
    }
  }, [open]);

  if (!open) return null;

  const colors = {
    success: { bg: "rgba(39,174,96,.12)", border: "rgba(39,174,96,.4)", text: "#1a7a42" },
    error:   { bg: "rgba(192,57,43,.12)", border: "rgba(192,57,43,.4)", text: "#a52a1a" },
    warning: { bg: "rgba(184,115,51,.12)", border: "rgba(184,115,51,.4)", text: "#8b5e28" },
    info:    { bg: "rgba(90,100,117,.12)", border: "rgba(90,100,117,.4)", text: "#3e4a5a" },
  };
  const c = colors[severity] || colors.info;

  return (
    <div ref={ref} style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "14px 28px",
      borderRadius: 12,
      background: c.bg,
      border: `1px solid ${c.border}`,
      boxShadow: "12px 12px 30px rgba(0,0,0,.3), -6px -6px 16px rgba(255,255,255,.6)",
      fontFamily: "'Instrument Sans', sans-serif",
      fontSize: 13, fontWeight: 600, color: c.text,
      display: "flex", alignItems: "center", gap: 12,
      maxWidth: 500,
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        border: "none", background: "transparent", cursor: "pointer",
        color: c.text, fontSize: 16, fontWeight: 700, lineHeight: 1,
      }}>×</button>
    </div>
  );
};

/* ─────────────────────────────────────────
   STEPPER (NEUMORPHIC)
───────────────────────────────────────── */
const NeuStepper = ({ steps, activeStep, onStepClick }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 0, marginBottom: 44, flexWrap: "wrap",
  }}>
    {steps.map((label, i) => {
      const done = i < activeStep;
      const active = i === activeStep;
      return (
        <React.Fragment key={label}>
          {i > 0 && (
            <div style={{
              width: 40, height: 2,
              background: done
                ? "linear-gradient(90deg, var(--green), var(--green))"
                : "linear-gradient(90deg, var(--warm-mid), var(--warm-mid))",
              margin: "0 -2px",
              transition: "background .4s",
            }} />
          )}
          <div
            onClick={() => onStepClick(i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              cursor: "pointer", gap: 6, minWidth: 90,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono', monospace",
              fontSize: 14, fontWeight: 700,
              color: done ? "#f8f0e0" : active ? "var(--copper)" : "var(--warm-drk)",
              background: done
                ? "linear-gradient(135deg, #2ecc71, #1a8a4a)"
                : active
                  ? "linear-gradient(145deg, #ede6d6, #cec5b5)"
                  : "linear-gradient(145deg, #ddd6c8, #cec5b5)",
              boxShadow: active
                ? "6px 6px 16px rgba(0,0,0,.35), -4px -4px 12px rgba(255,255,255,.8), inset 0 0 0 2px var(--copper)"
                : done
                  ? "4px 4px 12px rgba(0,0,0,.3), -2px -2px 8px rgba(255,255,255,.5)"
                  : "4px 4px 12px rgba(0,0,0,.2), -3px -3px 8px rgba(255,255,255,.7)",
              transition: "all .3s",
            }}>
              {done ? "✓" : i + 1}
            </div>
            <span style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 10, fontWeight: active ? 700 : 500,
              letterSpacing: ".06em", textTransform: "uppercase",
              color: active ? "var(--copper)" : done ? "var(--green)" : "var(--warm-drk)",
              transition: "color .3s",
            }}>{label}</span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────
   NEUMORPHIC SECTION CARD
───────────────────────────────────────── */
const NeuSection = ({ icon, title, children }) => (
  <div style={{
    padding: "28px 24px", borderRadius: 16, marginBottom: 24,
    background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
    boxShadow: "8px 8px 22px rgba(0,0,0,.3), -6px -6px 16px rgba(255,255,255,.85)",
    border: "1px solid rgba(255,255,255,.5)",
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 18, color: "var(--ink)",
      }}>{title}</span>
    </div>
    {children}
  </div>
);

/* ─────────────────────────────────────────
   ACTION CODE ROW (input + chips)
───────────────────────────────────────── */
const ActionCodeRow = ({ label, actions, inputValue, setInput, onAdd, onRemove, chipColor }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
      <NeuInput
        label={label}
        value={inputValue}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        placeholder="Type and press Enter"
      />
      <button
        onClick={onAdd}
        style={{
          width: 40, height: 40, borderRadius: 10, border: "none",
          background: "linear-gradient(145deg, #ede6d6, #cec5b5)",
          boxShadow: "4px 4px 10px rgba(0,0,0,.25), -3px -3px 8px rgba(255,255,255,.8)",
          cursor: "pointer", fontSize: 20, color: "var(--copper)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
        title="Add"
      >+</button>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {actions.map((a) => (
        <NeuChip key={a} label={a} onDelete={() => onRemove(a)} color={chipColor} />
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────
   CORNER SCREWS
───────────────────────────────────────── */
const CornerScrews = () => (
  <>
    {[{ top: 16, left: 16 }, { top: 16, right: 16 }, { bottom: 16, left: 16 }, { bottom: 16, right: 16 }].map((pos, i) => (
      <div key={i} style={{
        position: "absolute", ...pos,
        width: 15, height: 15, borderRadius: "50%",
        background: "linear-gradient(135deg, #c0b8a8, #a09080)",
        boxShadow: "2px 2px 5px rgba(0,0,0,.45), -1px -1px 3px rgba(255,255,255,.5)",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: "60%", height: 2,
          background: "rgba(0,0,0,.45)",
          transform: `translate(-50%,-50%) rotate(${45 + i * 45}deg)`,
        }} />
      </div>
    ))}
  </>
);

/* ─────────────────────────────────────────
   LOADING SPINNER (NEUMORPHIC)
───────────────────────────────────────── */
const NeuSpinner = () => (
  <div style={{
    display: "flex", justifyContent: "center", alignItems: "center",
    minHeight: "100vh",
    background: `
      radial-gradient(ellipse at 20% 10%, rgba(184,115,51,.07) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(90,100,117,.07) 0%, transparent 55%),
      #dfd8cc
    `,
  }}>
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      border: "4px solid var(--warm-mid)",
      borderTopColor: "var(--copper)",
      animation: "neuSpin 1s linear infinite",
    }} />
    <style>{`@keyframes neuSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ═════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════ */
export default function Configuration() {
  const location = useLocation();
  const { customerName, instanceName, targetNode } = location.state || {};
  const activeCustomer = customerName || "Unknown Customer";
  const activeInstance = instanceName || "Unknown Instance";

  /* ── Wizard step ── */
  const [activeStep, setActiveStep] = useState(0);

  /* ── Data-load states ── */
  const [lookupLoading, setLookupLoading] = useState(false);
  const [mandatoryLoading, setMandatoryLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [mandatoryDone, setMandatoryDone] = useState(false);

  /* ── Action codes ── */
  const [hireActions, setHireActions] = useState([]);
  const [newHireActionInput, setNewHireActionInput] = useState("");
  const [termActions, setTermActions] = useState([]);
  const [newTermActionInput, setNewTermActionInput] = useState("");
  const [globalTransferActions, setGlobalTransferActions] = useState([]);
  const [newGlobalTransferActionInput, setNewGlobalTransferActionInput] = useState("");
  const [rehireActions, setRehireActions] = useState([]);
  const [newRehireActionInput, setNewRehireActionInput] = useState("");

  /* ── Assignment status rules ── */
  const [statusType1, setStatusType1] = useState("");
  const [statusType2, setStatusType2] = useState("");
  const [statusType3, setStatusType3] = useState("");
  const [statusType4, setStatusType4] = useState("");
  const [statusType5] = useState("Else");
  const [statusType6, setStatusType6] = useState("");

  /* ── Loading / saving flags ── */
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFetchingSetupData, setIsFetchingSetupData] = useState(true);

  /* ── Snackbar ── */
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  /* ── Refs ── */
  const cardRef = useRef(null);

  /* ── API base (matches api.js) ── */
  const apiEndPoint = (process.env.REACT_APP_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

  /* ─── Card entrance animation ─── */
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 80, opacity: 0, scale: .95 },
        { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }
      );
    }
  }, []);

  /* ─── Check lookup data availability on mount ─── */
  useEffect(() => {
    const checkLookupAvailability = async () => {
      try {
        const response = await fetch(`${apiEndPoint}/api/lookupdata/available`);
        const data = await response.json();
        const files = data.files || [];
        if (activeCustomer && activeInstance) {
          const expectedPrefix = `${activeCustomer}_${activeInstance}`.toLowerCase();
          const found = files.some(file => file.toLowerCase().includes(expectedPrefix));
          setLookupDone(found);
          setSnackbar({
            open: true,
            message: found
              ? "Lookup data already available for this customer/instance."
              : "Lookup data not available. Please load it.",
            severity: found ? "success" : "warning",
          });
        }
      } catch (err) {
        console.error("Error checking lookup availability:", err);
      }
    };
    checkLookupAvailability();
  }, [apiEndPoint, activeCustomer, activeInstance]);

  /* ─── Fetch existing setup data on mount ─── */
  useEffect(() => {
    const fetchSetupData = async () => {
      if (!activeCustomer || activeCustomer === "Unknown Customer" || !activeInstance || activeInstance === "Unknown Instance") {
        setIsFetchingSetupData(false);
        return;
      }
      try {
        const response = await fetch(`${apiEndPoint}/api/hdl/get-setup/${activeCustomer}/${activeInstance}`);
        const data = await response.json();
        if (response.ok) {
          setHireActions(data.hireActions || []);
          setRehireActions(data.rehireActions || []);
          setTermActions(data.termActions || []);
          setGlobalTransferActions(data.globalTransferActions || []);
          if (data.assignmentStatusRules && Array.isArray(data.assignmentStatusRules)) {
            data.assignmentStatusRules.forEach((rule) => {
              if (rule.key === "if") { setStatusType1(rule.value || ""); setStatusType2(rule.result || ""); }
              else if (rule.key === "else if") { setStatusType3(rule.value || ""); setStatusType4(rule.result || ""); }
              else if (rule.key === "else") { setStatusType6(rule.result || ""); }
            });
          }
        } else {
          /* no existing data — blank form is fine */
        }
      } catch (err) {
        console.error("Error fetching setup data:", err);
      } finally {
        setIsFetchingSetupData(false);
      }
    };
    fetchSetupData();
  }, [activeCustomer, activeInstance, apiEndPoint]);

  /* ─── Helpers ─── */
  const addAction = (setActions, inputValue, setInput) => {
    if (inputValue.trim() !== "") {
      setActions(prev => Array.from(new Set([...prev, inputValue.trim().toUpperCase()])));
      setInput("");
    }
  };

  const removeAction = (setActions, val) => {
    setActions(prev => prev.filter(a => a !== val));
  };

  /* ─── API handlers ─── */
  const handleLookupLoad = async () => {
    try {
      setLookupLoading(true);
      const payload = { customerName: activeCustomer, instanceName: activeInstance, target_node: targetNode || "Global" };
      await api.post("/hdl/oracle_fetch/lookupdataload", payload);
      setLookupDone(true);
      setSnackbar({ open: true, message: "Lookup data loaded successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Lookup load failed.", severity: "error" });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleMandatoryLoad = async () => {
    try {
      setMandatoryLoading(true);
      const payload = { customerName: activeCustomer, instanceName: activeInstance, target_node: targetNode || "Global" };
      await api.post("/hdl/oracle_fetch/mandatoryFields", payload);
      setMandatoryDone(true);
      setSnackbar({ open: true, message: "Mandatory fields loaded successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Mandatory load failed.", severity: "error" });
    } finally {
      setMandatoryLoading(false);
    }
  };

  const handleSaveAllSetup = async () => {
    if (activeCustomer === "Unknown Customer" || activeInstance === "Unknown Instance") {
      setSnackbar({ open: true, message: "Customer and Instance names are required.", severity: "error" });
      return;
    }
    setIsSaving(true);
    const assignmentStatusRules = [
      { key: "if", value: statusType1, result: statusType2 },
      { key: "else if", value: statusType3, result: statusType4 },
      { key: "else", value: statusType5, result: statusType6 },
    ];
    const payload = {
      customerName: activeCustomer,
      instanceName: activeInstance,
      hireActions, rehireActions, termActions, globalTransferActions,
      statusTypes: [statusType1, statusType2, statusType3, statusType4, statusType5, statusType6],
      assignmentStatusRules,
    };
    try {
      const response = await fetch(`${apiEndPoint}/api/hdl/save-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: result.message || "Setup saved successfully!", severity: "success" });
        setIsSaved(true);
      } else {
        setSnackbar({ open: true, message: result.detail || "Failed to save setup.", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Network error. Could not save.", severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Loading state ─── */
  if (isFetchingSetupData) return <NeuSpinner />;

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100vh",
      padding: "48px 32px",
      background: `
        radial-gradient(ellipse at 20% 10%, rgba(184,115,51,.07) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 90%, rgba(90,100,117,.07) 0%, transparent 55%),
        #dfd8cc
      `,
    }}>
      <div ref={cardRef} style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 52,
        borderRadius: 24,
        background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
        boxShadow: "28px 28px 70px rgba(0,0,0,.5), -16px -16px 50px rgba(255,255,255,.95), inset 0 1px 0 rgba(255,255,255,.6)",
        border: "1px solid rgba(255,255,255,.4)",
        position: "relative",
        overflow: "hidden",
      }}>
        <CornerScrews />

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 44 }}>
          <div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 34, marginBottom: 6, color: "var(--ink)",
            }}>
              Customer: <span style={{ color: "var(--copper)" }}>{activeCustomer}</span>
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 14, color: "var(--ink-lt)", letterSpacing: ".05em",
            }}>
              Instance: {activeInstance}
            </div>
          </div>
          {targetNode && (
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
                color: "var(--warm-drk)", fontWeight: 700, marginBottom: 4,
              }}>Configuring Node</div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 16, color: "var(--copper-lt)", fontWeight: 500,
              }}>⚙️ {targetNode}</div>
            </div>
          )}
        </div>

        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--warm-mid), transparent)",
          marginBottom: 44,
        }} />

        {/* ── STEPPER ── */}
        <NeuStepper steps={STEPS} activeStep={activeStep} onStepClick={setActiveStep} />

        {/* ══════════════════════════════════
           STEP 0 — Data Load
        ══════════════════════════════════ */}
        {activeStep === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>

            {/* LOOKUP CARD */}
            <div style={{
              padding: "40px 32px", textAlign: "center", borderRadius: 16,
              background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
              boxShadow: "10px 10px 30px rgba(0,0,0,.4), -8px -8px 22px rgba(255,255,255,.9)",
              border: "1px solid rgba(255,255,255,.5)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div>
                <div style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 22, color: "var(--ink)", marginBottom: 12,
                }}>Lookup Data Load</div>
                <div style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 14, color: "var(--ink-lt)", marginBottom: 32, lineHeight: 1.5,
                }}>
                  Loads lookup data from Oracle API for <strong style={{ color: "var(--copper)" }}>{targetNode || "All Modules"}</strong>.
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <NeuBtn
                  onClick={handleLookupLoad}
                  disabled={lookupLoading || lookupDone}
                  accent={!lookupDone && !lookupLoading}
                >
                  {lookupDone ? "Loaded ✔" : lookupLoading ? "Loading…" : "Load Lookup Data ↓"}
                </NeuBtn>
                {lookupDone && (
                  <NeuBtn small onClick={handleLookupLoad} disabled={lookupLoading}>
                    ↻ Reload
                  </NeuBtn>
                )}
              </div>
            </div>

            {/* MANDATORY CARD */}
            <div style={{
              padding: "40px 32px", textAlign: "center", borderRadius: 16,
              background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
              boxShadow: "10px 10px 30px rgba(0,0,0,.4), -8px -8px 22px rgba(255,255,255,.9)",
              border: "1px solid rgba(255,255,255,.5)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div>
                <div style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 22, color: "var(--ink)", marginBottom: 12,
                }}>Mandatory Fields Load</div>
                <div style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 14, color: "var(--ink-lt)", marginBottom: 32, lineHeight: 1.5,
                }}>
                  Loads mandatory configuration definitions directly from Oracle.
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <NeuBtn
                  onClick={handleMandatoryLoad}
                  disabled={mandatoryLoading || mandatoryDone}
                  accent={!mandatoryDone && !mandatoryLoading}
                >
                  {mandatoryDone ? "Loaded ✔" : mandatoryLoading ? "Loading…" : "Load Mandatory Fields ↓"}
                </NeuBtn>
                {mandatoryDone && (
                  <NeuBtn small onClick={handleMandatoryLoad} disabled={mandatoryLoading}>
                    ↻ Reload
                  </NeuBtn>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
           STEP 1 — Action Codes
        ══════════════════════════════════ */}
        {activeStep === 1 && (
          <>
            <NeuSection icon="💼" title="Hiring & Rehiring Actions">
              <ActionCodeRow
                label="Hire Action"
                actions={hireActions}
                inputValue={newHireActionInput}
                setInput={setNewHireActionInput}
                onAdd={() => addAction(setHireActions, newHireActionInput, setNewHireActionInput)}
                onRemove={(v) => removeAction(setHireActions, v)}
                chipColor="var(--copper)"
              />
              <ActionCodeRow
                label="Rehire Action"
                actions={rehireActions}
                inputValue={newRehireActionInput}
                setInput={setNewRehireActionInput}
                onAdd={() => addAction(setRehireActions, newRehireActionInput, setNewRehireActionInput)}
                onRemove={(v) => removeAction(setRehireActions, v)}
                chipColor="var(--copper-lt)"
              />
            </NeuSection>

            <NeuSection icon="🚪" title="Termination & Transfer Actions">
              <ActionCodeRow
                label="Termination Action"
                actions={termActions}
                inputValue={newTermActionInput}
                setInput={setNewTermActionInput}
                onAdd={() => addAction(setTermActions, newTermActionInput, setNewTermActionInput)}
                onRemove={(v) => removeAction(setTermActions, v)}
                chipColor="var(--active)"
              />
              <ActionCodeRow
                label="Global Transfer Action"
                actions={globalTransferActions}
                inputValue={newGlobalTransferActionInput}
                setInput={setNewGlobalTransferActionInput}
                onAdd={() => addAction(setGlobalTransferActions, newGlobalTransferActionInput, setNewGlobalTransferActionInput)}
                onRemove={(v) => removeAction(setGlobalTransferActions, v)}
                chipColor="var(--steel)"
              />
            </NeuSection>
          </>
        )}

        {/* ══════════════════════════════════
           STEP 2 — Assignment Status
        ══════════════════════════════════ */}
        {activeStep === 2 && (
          <NeuSection icon="⇄" title="Rule-Based Status Mapping">
            {/* Rule 1: IF */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 12,
                color: "var(--copper)", fontWeight: 500, marginBottom: 8,
                letterSpacing: ".06em", textTransform: "uppercase",
              }}>If Action Code matches →</div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <NeuInput
                  label="Action Codes (comma-separated)"
                  value={statusType1}
                  onChange={(e) => setStatusType1(e.target.value)}
                />
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20, color: "var(--warm-drk)", paddingBottom: 12,
                }}>→</span>
                <NeuInput
                  label="Result Value"
                  value={statusType2}
                  onChange={(e) => setStatusType2(e.target.value)}
                />
              </div>
            </div>

            {/* Rule 2: ELSE IF */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 12,
                color: "var(--steel)", fontWeight: 500, marginBottom: 8,
                letterSpacing: ".06em", textTransform: "uppercase",
              }}>Else If Action Code matches →</div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <NeuInput
                  label="Action Codes (comma-separated)"
                  value={statusType3}
                  onChange={(e) => setStatusType3(e.target.value)}
                />
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20, color: "var(--warm-drk)", paddingBottom: 12,
                }}>→</span>
                <NeuInput
                  label="Result Value"
                  value={statusType4}
                  onChange={(e) => setStatusType4(e.target.value)}
                />
              </div>
            </div>

            {/* Rule 3: ELSE */}
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 12,
                color: "var(--warm-drk)", fontWeight: 500, marginBottom: 8,
                letterSpacing: ".06em", textTransform: "uppercase",
              }}>Else →</div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <NeuInput
                  label="Else"
                  value={statusType5}
                  disabled
                />
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20, color: "var(--warm-drk)", paddingBottom: 12,
                }}>→</span>
                <NeuInput
                  label="Result Value"
                  value={statusType6}
                  onChange={(e) => setStatusType6(e.target.value)}
                />
              </div>
            </div>
          </NeuSection>
        )}

        {/* ══════════════════════════════════
           STEP 3 — Review & Save
        ══════════════════════════════════ */}
        {activeStep === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 48, marginBottom: 16,
            }}>📋</div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: "var(--ink)", marginBottom: 12,
            }}>Review & Save</div>
            <div style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 14, color: "var(--ink-lt)", marginBottom: 36,
              lineHeight: 1.6, maxWidth: 420, margin: "0 auto 36px",
            }}>
              You have completed the setup steps. Click the button below to save all your configurations for
              <strong style={{ color: "var(--copper)" }}> {activeCustomer}</strong> /
              <strong style={{ color: "var(--copper)" }}> {activeInstance}</strong>.
            </div>

            {/* Summary chips */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16, marginBottom: 36, textAlign: "left",
            }}>
              {[
                { label: "Hire Actions", count: hireActions.length, color: "var(--copper)" },
                { label: "Rehire Actions", count: rehireActions.length, color: "var(--copper-lt)" },
                { label: "Term Actions", count: termActions.length, color: "var(--active)" },
                { label: "Transfer Actions", count: globalTransferActions.length, color: "var(--steel)" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{
                  padding: "14px 18px", borderRadius: 12,
                  background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
                  boxShadow: "6px 6px 16px rgba(0,0,0,.25), -4px -4px 10px rgba(255,255,255,.75)",
                  border: "1px solid rgba(255,255,255,.4)",
                }}>
                  <div style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
                    textTransform: "uppercase", color: "var(--warm-drk)", marginBottom: 4,
                  }}>{label}</div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 20, fontWeight: 500, color,
                  }}>{count}</div>
                </div>
              ))}
            </div>

            <NeuBtn
              onClick={handleSaveAllSetup}
              disabled={isSaving || isSaved}
              accent={!isSaved}
              success={isSaved}
            >
              {isSaved ? "Saved Successfully ✔" : isSaving ? "Saving…" : "💾 Save All Setup Data"}
            </NeuBtn>
          </div>
        )}

        {/* ── STEP NAVIGATION ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 44,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,.3)",
        }}>
          <NeuBtn
            onClick={() => setActiveStep(s => s - 1)}
            disabled={activeStep === 0}
            small
          >
            ← Back
          </NeuBtn>

          {/* Progress indicator */}
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, color: "var(--warm-drk)", letterSpacing: ".06em",
          }}>
            Step {activeStep + 1} of {STEPS.length}
          </div>

          {activeStep < STEPS.length - 1 ? (
            <NeuBtn
              onClick={() => setActiveStep(s => s + 1)}
              accent
              small
            >
              Next →
            </NeuBtn>
          ) : (
            <div style={{ width: 120 }} /> /* spacer so Back stays left-aligned */
          )}
        </div>

        {/* ── STATUS BAR ── */}
        <div style={{
          marginTop: 24,
          padding: "16px",
          textAlign: "center",
          borderRadius: 12,
          background: lookupDone && mandatoryDone ? "rgba(39,174,96,.1)" : "rgba(0,0,0,.04)",
          border: lookupDone && mandatoryDone ? "1px solid rgba(39,174,96,.25)" : "1px solid transparent",
          transition: "all 0.4s ease",
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            letterSpacing: ".06em",
            color: lookupDone && mandatoryDone ? "var(--green)" : "var(--ink-lt)",
            fontWeight: lookupDone && mandatoryDone ? 500 : 400,
          }}>
            {isSaved
              ? "All Configuration Saved ✔"
              : lookupDone && mandatoryDone
                ? "Data loaded — complete the setup wizard above."
                : "Load both datasets to continue."}
          </div>
        </div>

      </div>

      {/* ── SNACKBAR ── */}
      <NeuSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
}