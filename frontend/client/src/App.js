import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar.jsx';
import Home from './pages/Home.jsx';
import HDL from './pages/HDL_Main.jsx';
import DataTransformation from './pages/DataTransformation.jsx';
import TriggerHDL from './pages/TriggerHDL.jsx';
import Setup from './pages/Setup.jsx';
import OnboardingScreen from './pages/Onboarding_screen.jsx';
import PWAInstallPrompt from './PWAInstaller.jsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Button, Typography } from '@mui/material';

// Theme Setup
const theme = createTheme({
  typography: {
    fontFamily: '"Space Mono", monospace',
    h1: { fontFamily: '"Orbitron", sans-serif' },
  },
  palette: {
    primary: { main: '#1A237E' },
    background: { default: '#f0f2f5' },
  },
});

// Error Boundary Fallback Component
const RedirectToHomeButton = ({ onResetApp, errorDetails }) => {
  const navigate = useNavigate();
  // session storage clear
  sessionStorage.clear();
  const handleClick = () => {
    if (onResetApp) onResetApp();
    navigate('/onboarding');
    window.location.reload();
  };

  return (
    <Box sx={{
      bgcolor: '#1e1e1e',
      color: '#00FF00',
      fontFamily: 'monospace',
      p: 4,
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      <Typography variant="h5" sx={{ mb: 2, color: '#F87171' }}>
        ⚠️ Terminal Crash Report
      </Typography>
      <pre>
        <code>
{`> STATUS: 500 - INTERNAL APPLICATION ERROR
> MESSAGE: ${errorDetails?.message || "Unknown error"}
> ERROR NAME: ${errorDetails?.name || "N/A"}

> STACK TRACE:
${errorDetails?.stack || "No stack trace available"}
`}
        </code>
      </pre>
      <Button
        onClick={handleClick}
        variant="contained"
        sx={{ mt: 3, bgcolor: '#EF4444', color: 'white' }}
      >
        🚀 Restart Application
      </Button>
    </Box>
  );
};

// Error Boundary Class Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error caught in boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <RedirectToHomeButton
          onResetApp={this.props.onResetApp}
          errorDetails={{
            message: this.state.error?.message,
            name: this.state.error?.name,
            stack: this.state.error?.stack,
          }}
        />
      );
    }

    return this.props.children;
  }
}

// Main App Content
const AppContent = () => {
  const location = useLocation();
  const isOnboardingRoute = location.pathname === '/onboarding';

  const [Onrefresh, setOnrefresh] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [globalBO, setGlobalBO] = useState(null);
  const [parentBO, setParentBO] = useState(null);
  const [level1Parent, setLevel1Parent] = useState(null);
  const [level2Parent, setLevel2Parent] = useState(null);

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
    const derivedLevel1Parent = item.hierarchy.length > 0 ? item.hierarchy[0] : null;
    const derivedLevel2Parent = item.hierarchy.length > 1 ? item.hierarchy[1] : null;

    setLevel1Parent(derivedLevel1Parent);
    setLevel2Parent(derivedLevel2Parent);
    setGlobalBO(derivedLevel1Parent);
    setParentBO(derivedLevel2Parent);

    console.log("App.js - Selected Item:", item.text);
    console.log("App.js - Derived Level 1 Parent:", derivedLevel1Parent);
    console.log("App.js - Derived Level 2 Parent:", derivedLevel2Parent);
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar
        collapsed_prop={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectItem={handleSelectItem}
        GlobalBO={setGlobalBO}
        ParentBO={setParentBO}
        setonrefresh={setOnrefresh}
        Onrefresh={Onrefresh}
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <ErrorBoundary onResetApp={() => {}}>
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<OnboardingScreen collapsed={sidebarCollapsed} onrefresh={setOnrefresh} />} />
            <Route path="/home" element={<Home collapsed={sidebarCollapsed} />} />
            <Route path="/HDL" element={
              <HDL
                selectedItem={selectedItem}
                GlobalBO={globalBO}
                ParentBO={parentBO}
                collapsed={sidebarCollapsed}
                level1Parent={level1Parent}
                level2Parent={level2Parent}
              />
            } />
            <Route path="/hdl/data-transformation" element={
              <DataTransformation
                selectedItem={selectedItem}
                GlobalBO={globalBO}
                ParentBO={parentBO}
                collapsed={sidebarCollapsed}
                level1Parent={level1Parent}
                level2Parent={level2Parent}
              />
            } />
            <Route path="/dashboard/trigger-HDL" element={
              <TriggerHDL
                collapsed={sidebarCollapsed}
                level1Parent={level1Parent}
                level2Parent={level2Parent}
              />
            } />
            <Route path="/setup" element={
              <Setup
                level1Parent={level1Parent}
                level2Parent={level2Parent}
              />
            } />
          </Routes>
        </ErrorBoundary>
        <PWAInstallPrompt />
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
