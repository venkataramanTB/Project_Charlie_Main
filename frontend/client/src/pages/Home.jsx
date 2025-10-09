import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable"; // Corrected import
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Observer } from "gsap/Observer";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { GSDevTools } from "gsap/GSDevTools";
import * as THREE from 'three'; // Import Three.js
import * as CANNON from 'cannon'; // Import Cannon.js for physics
import { motion } from 'framer-motion'; // Removed AnimatePresence as it's no longer used
import {
    Button,
    Typography,
    Box,
    Paper,
    Divider,
    Chip,
    Modal,
    Fade,
    Backdrop,
    IconButton
} from "@mui/material";
import { styled, useTheme } from "@mui/system";
import LoginIcon from "@mui/icons-material/Login";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AnchorIcon from '@mui/icons-material/Anchor';
import WavesIcon from '@mui/icons-material/Waves';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import InsightsIcon from "@mui/icons-material/Insights";
import LockIcon from "@mui/icons-material/Lock";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import DiamondIcon from "@mui/icons-material/Diamond";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import GroupsIcon from "@mui/icons-material/Groups";

// Register GSAP plugins
gsap.registerPlugin(
    ScrollTrigger,
    ScrollToPlugin, // ScrollSmoother removed
    DrawSVGPlugin,
    MotionPathPlugin,
    MotionPathHelper,
    Flip,
    Draggable,
    InertiaPlugin,
    Observer,
    SplitText,
    ScrambleTextPlugin,
    Physics2DPlugin,
    PhysicsPropsPlugin,
    GSDevTools
);

// --- Styled Components ---

const PinnedHeroContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    // Authentic 8-bit background pattern
    background: "repeating-linear-gradient(45deg, #000000 0px, #000000 4px, #FFFFFF 4px, #FFFFFF 8px)",
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform',
    fontFamily: '"Press Start 2P", cursive', // 8-bit font
}));

const StyledPixelatedLightBeam = styled(Box)({
    position: 'absolute',
    width: '300px', // Thinner beam
    height: '600px',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.0) 100%)',
    transform: 'rotate(-35deg)', // Sharper angle
    top: '-150px',
    left: 'calc(50% - 150px)', // Center the beam
    transformOrigin: 'top center',
    zIndex: 25,
    willChange: 'transform, opacity',
    pointerEvents: 'none',
    opacity: 0,
    filter: 'url(#pixelateFilter)', // Apply SVG pixelation filter
});

const StyledMonochromeGlow = styled(Box)({
    position: 'absolute',
    width: '150px', // Smaller glow
    height: '150px',
    borderRadius: '0%', // Square glow for 8-bit
    background: 'radial-gradient(circle at 50% 50%, #FFFFFF, #AAAAAA 70%, #000000 100%)', // Harder edge glow
    boxShadow: '0 0 30px 10px rgba(255,255,255,0.5)',
    top: '120vh',
    left: '-75px',
    zIndex: 1,
    willChange: 'transform, opacity',
    pointerEvents: 'none',
    opacity: 0,
    filter: 'url(#pixelateFilter)',
});

const StyledPixelParticles = styled(Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'transparent',
    backgroundImage: `
        radial-gradient(2px 2px at 20px 30px, #FFFFFF, rgba(255,255,255,0.0)),
        radial-gradient(2px 2px at 60px 70px, #FFFFFF, rgba(255,255,255,0.0)),
        radial-gradient(2px 2px at 100px 10px, #FFFFFF, rgba(255,255,255,0.0)),
        radial-gradient(2px 2px at 40px 120px, #FFFFFF, rgba(255,255,255,0.0)),
        radial-gradient(2px 2px at 150px 50px, #FFFFFF, rgba(255,255,255,0.0))
    `,
    backgroundSize: '16px 16px', // Larger pixelated dots
    opacity: 1,
    zIndex: 0,
    willChange: 'opacity',
    animation: 'pixel-float 8s infinite linear', // Faster float
    '@keyframes pixel-float': {
        '0%': { transform: 'translateY(100vh)', opacity: 0.8 },
        '100%': { transform: 'translateY(-100vh)', opacity: 0 },
    },
});

const StyledHeroContent = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '0 20px',
    maxWidth: '900px',
    width: '100%',
    zIndex: 15,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'fit-content',
    willChange: 'opacity, transform, filter',
    fontFamily: '"Press Start 2P", cursive',
    [theme.breakpoints.down('sm')]: {
        maxWidth: '95%',
    }
}));

const StyledButton = styled(Button)({
    marginTop: "20px",
    backgroundColor: "#FFFFFF", // White for contrast
    color: "#000000", // Black text
    fontWeight: 'bold',
    borderRadius: '0px', // Strictly no rounded corners
    border: '4px solid #000000', // Thicker, pixelated border
    "&:hover": {
        backgroundColor: "#AAAAAA", // Gray on hover
        transform: 'scale(1.05)',
        boxShadow: '8px 8px 0px #000000', // More pronounced pixelated shadow
        transition: 'transform 0.05s steps(1), background-color 0.05s steps(1), box-shadow 0.05s steps(1)', // Steps for 8-bit animation
    },
    "&:active": { // Add active state for "press" feel
        transform: 'translate(4px, 4px)',
        boxShadow: '4px 4px 0px #000000',
        backgroundColor: '#555555',
    },
    zIndex: 10,
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '1rem', // Slightly larger for impact
    padding: '12px 24px',
});

// New StyledInfoBox component, styled like the button
const StyledInfoBox = styled(Box)(({ theme }) => ({
    backgroundColor: "#FFFFFF", // White background
    color: "#000000", // Black text
    fontWeight: 'bold',
    borderRadius: '0px', // Strictly no rounded corners
    border: '4px solid #000000', // Thicker, pixelated border
    boxShadow: '8px 8px 0px #000000', // More pronounced pixelated shadow
    zIndex: 10,
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '0.8rem', // Slightly smaller font for body text
    padding: '15px 20px', // Adjusted padding
    maxWidth: '700px',
    margin: '0 auto 20px auto', // Center and add bottom margin
    textAlign: 'center',
    transition: 'transform 0.08s steps(1), box-shadow 0.08s steps(1)', // Steps for 8-bit animation
    '&:hover': {
        transform: 'translateY(-8px) scale(1.05)', // Lift and scale
        boxShadow: `16px 16px 0px #000000`,
    },
    lineHeight: 1.6, // Slightly increased line height for readability
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.7rem',
        padding: '10px 15px',
    }
}));

// New info component for in small font size
const StyledInfoBoxSmall = styled(Box)(({ theme }) => ({
    backgroundColor: "#FFFFFF", // White background
    color: "#000000", // Black text
    fontWeight: 'bold',
    borderRadius: '0px', // Strictly no rounded corners
    border: '4px solid #000000', // Thicker, pixelated border
    boxShadow: '8px 8px 0px #000000', // More pronounced pixelated shadow
    zIndex: 10,
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '0.5rem', // Slightly smaller font for body text
    padding: '15px 20px', // Adjusted padding
    maxWidth: '700px',
    margin: '0 auto 20px auto', // Center and add bottom margin
    textAlign: 'center',
    transition: 'transform 0.08s steps(1), box-shadow 0.08s steps(1)', // Steps for 8-bit animation
    '&:hover': {
        transform: 'translateY(-8px) scale(1.05)', // Lift and scale
        boxShadow: `16px 16px 0px #000000`,
    },
    lineHeight: 1.6, // Slightly increased line height for readability
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.4rem',
        padding: '10px 15px',
    }
}));

const StyledPixelatedModule = styled(Box)(({ modulecolor }) => ({
    position: 'relative',
    width: '200px', // Larger modules
    height: '200px',
    borderRadius: '0px', // Sharp corners
    background: modulecolor,
    border: '6px solid #000000', // Even bolder pixel border
    boxShadow: `12px 12px 0px #000000`, // More pronounced pixelated shadow
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#FFFFFF', // Changed to white for better visibility
    cursor: 'pointer',
    transition: 'transform 0.08s steps(1), box-shadow 0.08s steps(1), filter 0.08s steps(1)', // Added filter to transition
    '&:hover': {
        transform: 'translateY(-8px) scale(1.05)', // Lift and scale
        boxShadow: `16px 16px 0px #000000`,
        filter: 'brightness(1.2) contrast(1.1)', // Subtle glitch effect
    },
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '1rem',
}));

const InteractiveModulesSection = styled(Box)({
    position: 'relative',
    minHeight: '100vh',
    background: "repeating-linear-gradient(-45deg, #000000 0px, #000000 4px, #AAAAAA 4px, #AAAAAA 8px)", // Gray/black pixel pattern
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px', // More padding
    boxSizing: 'border-box',
    opacity: 0,
    transform: 'translateY(100px)',
    fontFamily: '"Press Start 2P", cursive',
    backgroundSize: '200px 200px', // Initial size for animation
});

const HorizontalScrollContainer = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap', // Changed to wrap for static display
    justifyContent: 'center', // Center items
    alignItems: 'center',
    gap: '60px', // Increased gap between modules
    padding: '20px 0',
    width: '100%', // Take full width
    height: 'auto',
});


const DataProcessingNetworkSectionContainer = styled(Box)({
    position: 'relative',
    minHeight: '100vh',
    background: "repeating-linear-gradient(45deg, #000000 0px, #000000 8px, #555555 8px, #555555 16px)", // Darker gray/black pixel pattern
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start', // Changed to flex-start to align content to top
    justifyContent: 'flex-start',
    willChange: 'transform',
    opacity: 0,
    transform: 'translateY(100px)',
    fontFamily: '"Press Start 2P", cursive',
});

const DataGridSectionContainer = styled(Box)({
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: "repeating-linear-gradient(-45deg, #000000 0px, #000000 12px, #333333 12px, #333333 24px)", // Even darker pixel pattern
    color: '#FFFFFF',
    opacity: 0,
    transform: 'translateY(100px)',
    boxSizing: 'border-box',
    padding: '40px 20px',
    willChange: 'transform',
    fontFamily: '"Press Start 2P", cursive',
    backgroundSize: '200px 200px', // Initial size for animation
});

const StyledPixelSprite = styled(Box)({
    position: 'absolute',
    width: '32px', // Larger sprite
    height: '32px',
    background: '#FFFFFF', // White pixel
    boxShadow: '4px 4px 0px #000000', // More pronounced pixel shadow
    zIndex: 100,
    pointerEvents: 'none',
    opacity: 0,
    willChange: 'transform, opacity',
});

const StyledFloatingGlitch = styled(Box)({
    position: 'absolute',
    width: '40px', // Larger glitch
    height: '40px',
    background: 'repeating-linear-gradient(45deg, #FFFFFF 0px, #FFFFFF 2px, #000000 2px, #000000 4px)', // Thicker glitch pattern
    zIndex: 101,
    pointerEvents: 'none',
    opacity: 0,
    willChange: 'transform, opacity',
    filter: 'url(#pixelateFilter)',
});


const FeatureCard = styled(Paper)(({ theme }) => ({
    padding: '25px', // More padding
    borderRadius: '0px', // Sharp corners
    background: 'repeating-linear-gradient(45deg, #000000 0px, #000000 4px, #333333 4px, #333333 8px)', // Dark pixel pattern
    color: '#FFFFFF',
    backdropFilter: 'none', // No blur for 8-bit
    border: '3px solid #FFFFFF', // Thicker white pixel border
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '220px', // Taller cards
    cursor: 'pointer',
    boxShadow: '8px 8px 0px #000000',
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '0.9rem',
    transition: 'transform 0.08s steps(1), box-shadow 0.08s steps(1), filter 0.08s steps(1)', // Added filter to transition
    [theme.breakpoints.down('sm')]: {
        minWidth: '90%',
        margin: '10px 0',
    }
}));

const CallToActionSection = styled(Box)({
    minHeight: '100vh',
    background: "repeating-linear-gradient(-45deg, #000000 0px, #000000 16px, #111111 16px, #111111 32px)", // Deepest black pixel pattern
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    boxSizing: 'border-box',
    opacity: 0,
    transform: 'translateY(100px)',
    fontFamily: '"Press Start 2P", cursive',
});

// Styled component for SVG pixel waves at the bottom of the hero section
const StyledPixelWaves = styled('svg')({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '120px', // Taller waves
    zIndex: 10,
    pointerEvents: 'none',
    opacity: 0, // Controlled by GSAP
});

// Styled component for abstract data flow lines (SVG)
const StyledDataFlowSVG = styled('svg')({
    position: 'absolute',
    top: '15%', // Higher up
    left: '5%', // Wider
    width: '90%',
    height: '70%',
    zIndex: 12,
    pointerEvents: 'none',
    opacity: 0,
});


const MarioCharacter = styled('svg')({
    position: 'absolute',
    width: '64px', // Larger size for better visibility
    height: '64px',
    zIndex: 100,
    filter: 'url(#pixelateFilter)', // Apply pixelation
    willChange: 'transform',
    animation: 'mario-bounce 0.8s infinite steps(2)', // Simple bounce animation
    '@keyframes mario-bounce': {
        '0%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
    },
});

// New Styled component for global scanline effect
const ScanlineOverlay = styled(Box)({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999, // Ensure it's on top
    pointerEvents: 'none',
    background: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize: '100% 4px, 4px 100%', // Horizontal lines and subtle vertical lines
    opacity: 0.1, // Subtle opacity
});


// --- Data for 8-bit Data Processing Units (formerly celestial features) ---
const dataProcessingUnits = [
    {
        id: 'data-extraction',
        icon: <AnchorIcon sx={{ fontSize: 50, mb: 1, color: '#000000' }} />, // Larger icon
        title: "DATA EXTRACT",
        desc: "Extract complex legacy HCM data with pixel-perfect precision.",
        globePosition: new THREE.Vector3(-1.8, 0.6, 0), // Spread out more
        color: '#000000', // White
    },
    {
        id: 'data-transformation',
        icon: <WavesIcon sx={{ fontSize: 50, mb: 1, color: '#000000' }} />, // Larger icon
        title: "DATA TRANSFORM",
        desc: "Transform and cleanse data to meet Oracle Fusion's byte-level standards.",
        globePosition: new THREE.Vector3(1.8, 0.6, 0),
        color: 0xAAAAAA, // Gray
    },
    {
        id: 'hdl-generation',
        icon: <BubbleChartIcon sx={{ fontSize: 50, mb: 1, color: '#000000' }} />, // Larger icon
        title: "HDL GENERATE",
        desc: "Automate HDL file generation for error-free uploads, like a perfect combo.",
        globePosition: new THREE.Vector3(0, -1.8, 0),
        color: 0x555555, // Darker Gray
    },
];

// New data for the 2D interactive modules (formerly coral formations)
const interactiveModulesData = [
    {
        id: 'hcm-core-hr',
        title: "HCM CORE HR",
        desc: "Streamline migration of core HR data including employee records, assignments, and organizations.",
        icon: <GroupsIcon sx={{ fontSize: 50, mb: 1, color: '#000000' }} />, // Black icon for contrast
        modulecolor: '#555555', // Darker gray module
    },
    {
        id: 'payroll-data',
        title: "PAYROLL DATA",
        desc: "Ensure accurate and secure transfer of complex payroll information and historical records.",
        icon: <SubdirectoryArrowRightIcon sx={{ fontSize: 50, mb: 1, color: '#000000' }} />,
        modulecolor: '#555555', // Gray module
    },
    {
        id: 'talent-management',
        title: "TALENT MGMT",
        desc: "Migrate talent profiles, performance reviews, and learning data with ease.",
        icon: <DiamondIcon sx={{ fontSize: 50, mb: 1, color: '#000000' }} />,
        modulecolor: '#555555', // White module
    },
];

// New data for Key Features section
const keyFeaturesData = [
    {
        id: 'feature-1',
        icon: <InsightsIcon sx={{ fontSize: 60, color: '#FFFFFF' }} />, // Larger icons
        title: "AUTO VALIDATION",
        description: "Built-in validation rules ensure data integrity and compliance with Oracle Fusion standards.",
    },
    {
        id: 'feature-2',
        icon: <LockIcon sx={{ fontSize: 60, color: '#FFFFFF' }} />,
        title: "SECURE DATA",
        description: "Your sensitive HCM data is protected with robust security measures during migration.",
    },
    {
        id: 'feature-3',
        icon: <CloudQueueIcon sx={{ fontSize: 60, color: '#FFFFFF' }} />,
        title: "FUSION INTEGRATE",
        description: "Seamlessly integrates with Oracle Fusion, accelerating your go-live process.",
    },
    {
        id: 'feature-4',
        icon: <LiveHelpIcon sx={{ fontSize: 60, color: '#FFFFFF' }} />,
        title: "REDUCE EFFORT",
        description: "Minimize rework and manual intervention, making migration faster and more efficient.",
    },
];

const sampleRows = [
    { id: 1, name: "CORE HR MIGRATION", status: "COMPLETE", lastRun: "2025-06-20" },
    { id: 2, name: "PAYROLL CONVERSION", status: "IN PROGRESS", lastRun: "2025-06-18" },
    { id: 3, name: "TALENT SYNC", status: "VALIDATE PENDING", lastRun: "2025-06-15" },
    { id: 4, name: "BENEFITS LOAD", status: "FAILED", lastRun: "2025-06-19" },
    { id: 5, name: "ABSENCE HDL", status: "SCHEDULED", lastRun: "2025-06-21" },
];

const sampleColumns = [
    { field: "name", headerName: "MIGRATION TASK", flex: 1 },
    { field: "status", headerName: "STATUS", flex: 1 },
    { field: "lastRun", headerName: "LAST ACTIVITY", flex: 1 },
];

// --- Feature Detail Modal (formerly Planet Detail Modal) ---
const FeatureDetailModal = ({ open, handleClose, feature }) => {
    return (
        <Modal
            open={open}
            onClose={handleClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: {
                    timeout: 500,
                },
            }}
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <Fade in={open}>
                <Box sx={{ // Use Box and inline styles for modal content
                    background: 'repeating-linear-gradient(45deg, #000000 0px, #000000 4px, #333333 4px, #333333 8px)', // More defined pixel pattern
                    color: '#FFFFFF',
                    p: 5, // More padding
                    borderRadius: '0px', // Sharp corners
                    border: '4px solid #FFFFFF', // Thicker white border
                    boxShadow: '10px 10px 0px #000000', // More pronounced shadow
                    maxWidth: '600px', // Wider modal
                    width: '90%',
                    position: 'relative',
                    outline: 'none',
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: '1rem', // Larger font
                }}>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: '#FFFFFF',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } // Stronger hover
                        }}
                    >
                        X
                    </IconButton>
                    <Typography id="transition-modal-title" variant="h5" component="h2" fontWeight="bold" sx={{ color: '#FFFFFF', fontSize: '1.8rem', textShadow: '2px 2px 0px #000000' }}>
                        {feature?.title}
                    </Typography>
                    <Divider sx={{ bgcolor: '#FFFFFF', my: 3, height: '2px' }} /> {/* Thicker divider */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}> {/* More gap */}
                        {feature?.icon}
                        <StyledInfoBoxSmall>
                            {feature?.desc}
                        </StyledInfoBoxSmall>
                    </Box>
                    <StyledButton
                        variant="contained"
                        sx={{ mt: 3 }}
                        onClick={handleClose}
                    >
                        CLOSE
                    </StyledButton>
                </Box>
            </Fade>
        </Modal>
    );
};

// --- Main Home Component ---
function Home({ collapsed }) {
    const loginId = JSON.parse(sessionStorage.getItem("user")).username || "Guest"; // Default to "GUEST"
    const navigate = useNavigate();
    const theme = useTheme();

    const [isLoading, setIsLoading] = useState(false); // Set to false to skip loading screen
    
    // Refs
    const mainRef = useRef(null);
    const pinnedHeroContainerRef = useRef(null);
    const heroContentRef = useRef(null);
    const charlieTitleRef = useRef(null);
    const heroSubtitleRef = useRef(null);
    const heroTextRef = useRef(null); // This will now be the StyledInfoBox ref
    const pixelatedLightBeamRef = useRef(null);
    const monochromeGlowRef = useRef(null);
    const pixelParticlesRef = useRef(null);
    const interactiveModulesSectionRef = useRef(null);
    const dataProcessingNetworkSectionRef = useRef(null);
    const keyFeaturesSectionRef = useRef(null);
    const callToActionSectionRef = useRef(null);
    const dataGridSectionRef = useRef(null);
    const loginButtonRef = useRef(null);
    const pixelSpriteRef = useRef(null);
    const floatingGlitchRef = useRef(null);
    const pixelWavesRef = useRef(null);
    const dataFlowSVGRef = useRef(null);
    const marioCharacterRef = useRef(null); // Ref for Mario character
    // const magneticCursorRef = useRef(null); // Removed magneticCursorRef


    // New refs for other headings
    const migrationCapabilitiesTitleRef = useRef(null);
    const dataConversionLifecycleTitleRef = useRef(null);
    const keyAdvantagesTitleRef = useRef(null);
    const recentMigrationLogsTitleRef = useRef(null);
    const callToActionHeadingRef = useRef(null);
    const callToActionSubtitleRef = useRef(null);


    // Three.js refs for the globe section
    const canvasRef2 = useRef(null);
    const globeSceneRef = useRef(null);
    const globeCameraRef = useRef(null);
    const globeRendererRef = useRef(null);
    const globeModelsRef = []; // Changed to array for direct manipulation
    const physicsWorldRef = useRef(null);
    const splitTitleRef = useRef(null);
    const dataParticlesRef = [];

    // Mouse interaction for 3D camera
    const isMouseDown = useRef(false);
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const rotationX = useRef(0);
    const rotationY = useRef(0);
    const targetRotationX = useRef(0);
    const targetRotationY = useRef(0);

    // Modal state for features
    const [openModal, setOpenModal] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);

    const handleOpenModal = (feature) => {
        setSelectedFeature(feature);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedFeature(null);
    };

    // Text hover effect utility (GSAP)
    const applyHoverEffect = (elementRef, initialColor, hoverColor) => {
        const element = elementRef.current;
        if (!element) return () => { };

        gsap.set(element, { color: initialColor, ease: "power1.out" });

        const handleMouseEnter = () => {
            gsap.to(element, {
                scale: 1.05, // More pronounced scale for pixel art
                color: hoverColor,
                duration: 0.1, // Instant pixel change
                overwrite: true,
                textShadow: '4px 4px 0px #000000', // Larger pixelated shadow
            });
            // if (magneticCursorRef.current) { // Removed magneticCursorRef calls
            //     magneticCursorRef.current.enter(element.getBoundingClientRect(), 80, '#FF00FF');
            // }
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                scale: 1,
                color: initialColor,
                duration: 0.1, 
                overwrite: true,
                textShadow: 'none',
            });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            gsap.killTweensOf(element);
        };
    };

    useEffect(() => {
        setIsLoading(false); 

        const cleanupSubtitleHover = applyHoverEffect(heroSubtitleRef, '#000000', '#FFFFFF'); // Black to White

        return () => {
            cleanupSubtitleHover();
        };
    }, []);

    useLayoutEffect(() => {
        if (isLoading) return;

        let cleanupMigrationCapabilitiesTitleHover = null;
        let cleanupDataConversionLifecycleTitleHover = null;
        let cleanupKeyAdvantagesTitleHover = null;
        let cleanupRecentMigrationLogsTitleRef = null;
        let cleanupCallToActionHeadingHover = null;
        let cleanupCallToActionSubtitleHover = null;
        let mainCtx = gsap.context(() => {
            gsap.set(pinnedHeroContainerRef.current, { background: "repeating-linear-gradient(45deg, #000000 0px, #000000 4px, #FFFFFF 4px, #FFFFFF 8px)" });
            gsap.set(pixelParticlesRef.current, { opacity: 1 });
            gsap.set([heroContentRef.current, loginButtonRef.current], { opacity: 1, y: 0, scale: 1, filter: 'none' });
            gsap.set(heroSubtitleRef.current, { color: '#000000', opacity: 1, y: 0, scale: 1, filter: 'none', textShadow: '4px 4px 0px #FFFFFF' });

            gsap.set(pixelatedLightBeamRef.current, { opacity: 0, y: 0 });
            gsap.set(monochromeGlowRef.current, { opacity: 0, y: '120vh' });
            gsap.set([
                interactiveModulesSectionRef.current,
                dataProcessingNetworkSectionRef.current,
                keyFeaturesSectionRef.current,
                callToActionSectionRef.current,
                dataGridSectionRef.current
            ], { opacity: 0, y: 100 });
            if (pixelSpriteRef.current) {
                gsap.set(pixelSpriteRef.current, { opacity: 0 });
            }
            if (floatingGlitchRef.current) {
                gsap.set(floatingGlitchRef.current, { opacity: 0 });
            }
            gsap.set([pixelWavesRef.current, dataFlowSVGRef.current], { opacity: 0 });
            if (charlieTitleRef.current) {
                gsap.from(charlieTitleRef.current, {
                    duration: 1.5, 
                    scrambleText: {
                        text: "PROJECT CHARLIE",
                        chars: "upperCase",
                        speed: 0.8, 
                        newClass: "gsap-scramble",
                        revealDelay: 0.2,
                    },
                    delay: 0.5,
                    opacity: 1,
                });

                gsap.delayedCall(2.0, () => { // Adjust delay based on new scramble duration
                    if (splitTitleRef.current) {
                        splitTitleRef.current.revert();
                    }
                    splitTitleRef.current = new SplitText(charlieTitleRef.current, { type: "chars" });

                    splitTitleRef.current.chars.forEach(char => {
                        char.style.display = 'inline-block';
                        char.style.cursor = 'pointer';
                        char.originalColor = window.getComputedStyle(char).color || 'white';
                        // Capture the original text shadow
                        char.originalTextShadow = window.getComputedStyle(char).textShadow || 'none';

                        char.addEventListener('mouseenter', () => {
                            gsap.to(char, {
                                scale: 1.2, // More pronounced scale
                                color: '#00FFFF', // Bright cyan on hover
                                y: -5, // More lift
                                duration: 0.08, // Faster
                                overwrite: true,
                                textShadow: '2px 2px 0px #FFFFFF, -2px -2px 0px #FFFFFF', // Pixelated white glow
                            });
                            // if (magneticCursorRef.current) { // Removed magneticCursorRef calls
                            //     magneticCursorRef.current.enter(char.getBoundingClientRect(), 40, '#FF00FF');
                            // }
                        });

                        char.addEventListener('mouseleave', () => {
                            gsap.to(char, {
                                scale: 1,
                                color: char.originalColor, // Revert to original white
                                y: 0,
                                duration: 0.08, // Faster
                                overwrite: true,
                                textShadow: char.originalTextShadow, // Revert to original black shadow
                            });
                            // if (magneticCursorRef.current) { // Removed magneticCursorRef calls
                            //     magneticCursorRef.current.leave();
                            // }
                        });
                    });
                });
            }

            // --- Overall Background Pattern Transition Timeline ---
            const backgroundTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: mainRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 0.5, // Snappier scrub
                }
            });

            backgroundTimeline
                .to(pinnedHeroContainerRef.current, {
                    background: "repeating-linear-gradient(45deg, #000000 0px, #000000 8px, #555555 8px, #555555 16px)",
                    duration: 0.8, // Faster transition
                }, 0.1)
                .to(pinnedHeroContainerRef.current, {
                    background: "repeating-linear-gradient(-45deg, #000000 0px, #000000 12px, #333333 12px, #333333 24px)",
                    duration: 0.8,
                }, 0.3)
                .to(pinnedHeroContainerRef.current, {
                    background: "repeating-linear-gradient(45deg, #000000 0px, #000000 16px, #111111 16px, #111111 32px)",
                    duration: 0.8,
                }, 0.5)
                .to(pinnedHeroContainerRef.current, {
                    background: "#000000", // Solid black abyss
                    duration: 0.8,
                }, 0.7);


            // --- Hero Content Outro ---
            gsap.to(heroContentRef.current, {
                opacity: 0,
                filter: 'blur(5px)', // Less blur, more pixelated
                y: '-100vh',// Stepped ease
                scrollTrigger: {
                    trigger: pinnedHeroContainerRef.current,
                    start: "top top",
                    end: "center top",
                    scrub: 0.5, // Snappier scrub
                }
            });

            // --- Pixelated Light Beam Animation ---
            gsap.to(pixelatedLightBeamRef.current, {
                opacity: 1,
                y: '150vh',
                scaleY: 0.5,// Stepped ease
                scrollTrigger: {
                    trigger: pinnedHeroContainerRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.8,
                    onLeave: () => gsap.to(pixelatedLightBeamRef.current, { opacity: 0, duration: 0.3, ease: "steps(1)" }),
                    onEnterBack: () => gsap.to(pixelatedLightBeamRef.current, { opacity: 1, duration: 0.3, ease: "steps(1)" }),
                }
            });

            // --- Monochrome Glow Animation ---
            gsap.to(monochromeGlowRef.current, {
                opacity: 1,
                y: '10vh',
                x: '10vw',
                rotation: 0,// Stepped ease
                scrollTrigger: {
                    trigger: dataProcessingNetworkSectionRef.current,
                    start: "top center",
                    end: "bottom top",
                    scrub: 0.8,
                    onLeave: () => gsap.to(monochromeGlowRef.current, { opacity: 0, duration: 0.3, ease: "steps(1)" }),
                    onEnterBack: () => gsap.to(monochromeGlowRef.current, { opacity: 1, duration: 0.3, ease: "steps(1)" }),
                }
            });

            // --- Pixel Waves SVG Animation ---
            gsap.to(pixelWavesRef.current, {
                opacity: 1,
                y: '50px', // Stepped ease
                scrollTrigger: {
                    trigger: pinnedHeroContainerRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.5,
                }
            });

            // --- Data Flow SVG Animation ---
            gsap.fromTo(dataFlowSVGRef.current,
                { opacity: 0, scale: 0.8 },
                {
                    opacity: 0.8, // Stronger opacity for 8-bit
                    scale: 1,
                    duration: 1.0, // Stepped ease
                    scrollTrigger: {
                        trigger: pinnedHeroContainerRef.current,
                        start: "top center",
                        end: "center center",
                        toggleActions: "play none none reverse",
                    }
                }
            );
            // Animate paths within the data flow SVG
            gsap.to(dataFlowSVGRef.current.querySelectorAll('path'), {
                drawSVG: "100%",
                duration: 0.8, // Faster drawing for 8-bit feel
                stagger: 0.1, // Faster stagger
                repeat: -1,
                yoyo: true,// Stepped ease
                delay: 1,
            });


            // --- Individual Section Entrance Animations ---
            const sections = [
                interactiveModulesSectionRef.current,
                dataProcessingNetworkSectionRef.current,
                keyFeaturesSectionRef.current,
                callToActionSectionRef.current,
                dataGridSectionRef.current
            ];

            sections.forEach((section) => {
                gsap.fromTo(section,
                    { opacity: 0, y: 100 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8, // Stepped ease
                        scrollTrigger: {
                            trigger: section,
                            start: "top bottom",
                            end: "top center",
                            toggleActions: "play none none reverse",
                        }
                    }
                );
            });

            // Animate data processing unit overlays (globes' text)
            gsap.fromTo(gsap.utils.toArray(dataProcessingNetworkSectionRef.current.querySelectorAll('.data-unit-overlay')),
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6, // Faster animation
                    stagger: 0.15, // Faster stagger
                    // Stepped ease
                    scrollTrigger: {
                        trigger: dataProcessingNetworkSectionRef.current,
                        start: "top 70%",
                        toggleActions: "play none none reverse",
                    }
                }
            );

            // --- Apply hover effects to all headings ---
            cleanupMigrationCapabilitiesTitleHover = applyHoverEffect(migrationCapabilitiesTitleRef, '#FFFFFF', '#AAAAAA');
            cleanupDataConversionLifecycleTitleHover = applyHoverEffect(dataConversionLifecycleTitleRef, '#FFFFFF', '#AAAAAA');
            cleanupKeyAdvantagesTitleHover = applyHoverEffect(keyAdvantagesTitleRef, '#FFFFFF', '#AAAAAA');
            cleanupRecentMigrationLogsTitleRef = applyHoverEffect(recentMigrationLogsTitleRef, '#FFFFFF', '#AAAAAA');
            cleanupCallToActionHeadingHover = applyHoverEffect(callToActionHeadingRef, '#FFFFFF', '#AAAAAA');
            cleanupCallToActionSubtitleHover = applyHoverEffect(callToActionSubtitleRef, '#FFFFFF', '#AAAAAA');


            // --- Login Button Pulse Animation (always pulse now as loginId is always set) ---
            if (loginButtonRef.current) {
                gsap.to(loginButtonRef.current, {
                    scale: 1.05, // More pronounced pixel pulse
                    repeat: -1,
                    yoyo: true,
                    duration: 0.3, // Faster pulse
                    // Instant pixel change
                    delay: 0.5, // Start pulsing immediately
                    boxShadow: '8px 8px 0px #000000', // Stronger shadow
                });
            }

            // --- Mario Character Horizontal Movement ---
            if (marioCharacterRef.current) {
                gsap.to(marioCharacterRef.current, {
                    x: () => window.innerWidth - marioCharacterRef.current.offsetWidth - 100, // Move across the screen
                    duration: 5, // Slower movement
                    repeat: -1,
                    yoyo: true,
                    // Stepped movement
                    scrollTrigger: {
                        trigger: interactiveModulesSectionRef.current,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true,
                    }
                });
            }

            // --- 3D Scene Continuous Rotation (Data Processing Network) ---
            if (globeSceneRef.current) {
                gsap.to(globeSceneRef.current.rotation, {
                    y: Math.PI * 2, // Full rotation
                    ease: "none",
                    duration: 20, // Slower rotation
                    repeat: -1,
                    scrollTrigger: {
                        trigger: dataProcessingNetworkSectionRef.current,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true,
                    }
                });
            }

            // --- Animated Backgrounds ---
            gsap.to(interactiveModulesSectionRef.current, {
                backgroundPosition: "200px 200px", // Animate background position
                // Stepped background animation
                repeat: -1,
                duration: 30, // Slower animation
                scrollTrigger: {
                    trigger: interactiveModulesSectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                }
            });

            gsap.to(dataGridSectionRef.current, {
                backgroundPosition: "200px 200px", // Animate background position
                // Stepped background animation
                repeat: -1,
                duration: 30, // Slower animation
                scrollTrigger: {
                    trigger: dataGridSectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                }
            });


        }, mainRef); // End GSAP context


        // --- Three.js Setup and Animations for Data Processing Units ---
        let globeScene, globeCamera, globeRenderer;
        let connections = [];
        let physicsWorld;

        const initGlobesThree = () => {
            if (!canvasRef2.current) return;

            const containerWidth = canvasRef2.current.clientWidth;
            const containerHeight = canvasRef2.current.clientHeight;

            // Three.js setup
            globeScene = new THREE.Scene();
            globeSceneRef.current = globeScene;

            globeCamera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 100);
            globeCamera.position.z = 4;
            globeCameraRef.current = globeCamera;

            globeRenderer = new THREE.WebGLRenderer({
                canvas: canvasRef2.current,
                antialias: false, // No antialiasing for 8-bit
                alpha: true
            });
            globeRenderer.setSize(containerWidth, containerHeight);
            globeRenderer.setPixelRatio(1); // No high pixel ratio for 8-bit
            globeRendererRef.current = globeRenderer;

            const ambientLightGlobes = new THREE.AmbientLight(0x404040, 3);
            globeScene.add(ambientLightGlobes);
            const pointLightGlobes = new THREE.PointLight(0xffffff, 50, 100);
            pointLightGlobes.position.set(10, 10, 10);
            globeScene.add(pointLightGlobes);

            // Cannon.js physics world setup
            physicsWorld = new CANNON.World();
            physicsWorldRef.current = physicsWorld;
            physicsWorld.gravity.set(0, -0.5, 0);

            // Create boundaries for physics world
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            groundBody.position.y = -3;
            physicsWorld.addBody(groundBody);

            const ceilingShape = new CANNON.Plane();
            const ceilingBody = new CANNON.Body({ mass: 0, shape: ceilingShape });
            ceilingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            ceilingBody.position.y = 3;
            physicsWorld.addBody(ceilingBody);

            const wallShape = new CANNON.Plane();
            const wallBody1 = new CANNON.Body({ mass: 0, shape: wallShape });
            wallBody1.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
            wallBody1.position.x = -5;
            physicsWorld.addBody(wallBody1);

            const wallBody2 = new CANNON.Body({ mass: 0, shape: wallShape });
            wallBody2.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
            wallBody2.position.x = 5;
            physicsWorld.addBody(wallBody2);

            const wallBody3 = new CANNON.Body({ mass: 0, shape: wallShape });
            wallBody3.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -Math.PI / 2);
            wallBody3.position.z = -5;
            physicsWorld.addBody(wallBody3);

            const wallBody4 = new CANNON.Body({ mass: 0, shape: wallShape });
            wallBody4.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
            wallBody4.position.z = 5;
            physicsWorld.addBody(wallBody4);


            dataProcessingUnits.forEach(feature => {
                // Three.js mesh - now a cube for 8-bit feel
                const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // Cube geometry
                const material = new THREE.MeshStandardMaterial({
                    color: feature.color,
                    roughness: 0.1, // More metallic/sharp look
                    metalness: 0.9,
                    flatShading: true, // Crucial for pixelated look
                });
                const cubeMesh = new THREE.Mesh(geometry, material);
                cubeMesh.position.copy(feature.globePosition);
                globeScene.add(cubeMesh);

                // Cannon.js body (still sphere for simpler physics, but size matches cube)
                const boxShape = new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.4)); // Half extents of the cube
                const boxBody = new CANNON.Body({ mass: 1, shape: boxShape });
                boxBody.position.copy(feature.globePosition);
                boxBody.linearDamping = 0.9;
                boxBody.angularDamping = 0.9;
                physicsWorld.addBody(boxBody);

                boxBody.applyImpulse(
                    new CANNON.Vec3(Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25),
                    boxBody.position
                );

                globeModelsRef.push({ mesh: cubeMesh, body: boxBody }); // Direct push to array
            });

            // Add floating data particles (now small cubes)
            const particleGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12); // Larger cubes for particles
            // Changed MeshBasicMaterial to MeshStandardMaterial to support flatShading
            const particleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFFFF, transparent: true, opacity: 0.9, flatShading: true }); // White particles
            for (let i = 0; i < 500; i++) { // More particles for more immersion
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.set(
                    (Math.random() - 0.5) * 12, // Wider spread
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 12
                );
                globeScene.add(particle);
                dataParticlesRef.push(particle);

                gsap.to(particle.position, {
                    x: particle.position.x + (Math.random() - 0.5) * 5, // Faster movement
                    y: particle.position.y + (Math.random() - 0.5) * 5,
                    z: particle.position.z + (Math.random() - 0.5) * 5,
                    duration: 2 + Math.random() * 2, // Faster movement
                    repeat: -1,
                    yoyo: true,
                });
            }


            // Create connections (lines) between cubes
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFFFF, linewidth: 5 }); // White lines, much thicker
            const createConnection = (startObj, endObj) => {
                const points = [];
                points.push(startObj.body.position);
                points.push(endObj.body.position);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                globeScene.add(line);
                connections.push(line);
            };

            if (globeModelsRef.length >= 3) { // Changed .current to direct array
                createConnection(globeModelsRef[0], globeModelsRef[1]);
                createConnection(globeModelsRef[1], globeModelsRef[2]);
                createConnection(globeModelsRef[2], globeModelsRef[0]);
            }

            // Mouse interaction for camera control
            const onMouseDown = (event) => {
                isMouseDown.current = true;
                mouseX.current = event.clientX;
                mouseY.current = event.clientY;
            };

            const onMouseMove = (event) => {
                if (isMouseDown.current) {
                    const deltaX = event.clientX - mouseX.current;
                    const deltaY = event.clientY - mouseY.current;
                    targetRotationY.current += deltaX * 0.008; // Faster rotation
                    targetRotationX.current += deltaY * 0.008;
                    mouseX.current = event.clientX;
                    mouseY.current = event.clientY;
                }
            };

            const onMouseUp = () => {
                isMouseDown.current = false;
            };

            canvasRef2.current.addEventListener('mousedown', onMouseDown);
            canvasRef2.current.addEventListener('mousemove', onMouseMove);
            canvasRef2.current.addEventListener('mouseup', onMouseUp);

            const animateGlobes = () => {
                requestAnimationFrame(animateGlobes);

                physicsWorld.step(1 / 60);

                globeModelsRef.forEach(item => { // Changed .current to direct array
                    item.mesh.position.copy(item.body.position);
                    item.mesh.quaternion.copy(item.body.quaternion);
                });

                if (connections.length > 0 && globeModelsRef.length >= 3) { // Changed .current to direct array
                    connections[0].geometry.setFromPoints([globeModelsRef[0].body.position, globeModelsRef[1].body.position]);
                    connections[1].geometry.setFromPoints([globeModelsRef[1].body.position, globeModelsRef[2].body.position]);
                    connections[2].geometry.setFromPoints([globeModelsRef[2].body.position, globeModelsRef[0].body.position]);
                    connections.forEach(line => line.geometry.attributes.position.needsUpdate = true);
                }

                rotationX.current += (targetRotationX.current - rotationX.current) * 0.1;
                rotationY.current += (targetRotationY.current - rotationY.current) * 0.1;

                globeCamera.position.x = 4 * Math.sin(rotationY.current) * Math.cos(rotationX.current);
                globeCamera.position.y = 4 * Math.sin(rotationX.current);
                globeCamera.position.z = 4 * Math.cos(rotationY.current) * Math.cos(rotationX.current);
                globeCamera.lookAt(globeScene.position);


                globeRenderer.render(globeScene, globeCamera);
            };
            animateGlobes();

            const onGlobeCanvasResize = () => {
                if (globeCamera && globeRenderer && canvasRef2.current) {
                    const newWidth = canvasRef2.current.clientWidth;
                    const newHeight = canvasRef2.current.clientHeight;
                    globeCamera.aspect = newWidth / newHeight;
                    globeCamera.updateProjectionMatrix();
                    globeRenderer.setSize(newWidth, newHeight);
                }
            };
            window.addEventListener('resize', onGlobeCanvasResize);

            return () => {
                window.removeEventListener('resize', onGlobeCanvasResize);
                canvasRef2.current.removeEventListener('mousedown', onMouseDown);
                canvasRef2.current.removeEventListener('mousemove', onMouseMove);
                canvasRef2.current.removeEventListener('mouseup', onMouseUp);

                if (globeRenderer) globeRenderer.dispose();
                globeModelsRef.forEach(item => { // Changed .current to direct array
                    if (item.mesh.geometry) item.mesh.geometry.dispose();
                    if (item.mesh.material) item.mesh.material.dispose();
                    if (physicsWorldRef.current && item.body) {
                        physicsWorldRef.current.removeBody(item.body);
                    }
                });
                dataParticlesRef.forEach(particle => {
                    if (particle.geometry) particle.geometry.dispose();
                    if (particle.material) particle.material.dispose();
                    globeScene.remove(particle);
                });
                connections.forEach(line => {
                    if (line.geometry) line.geometry.dispose();
                    if (line.material) line.material.dispose();
                });
                if (physicsWorldRef.current) {
                    physicsWorldRef.current = null;
                }
            };
        };

        const cleanupGlobesThree = initGlobesThree();

        // --- Pixel Sprite Continuous Animation ---
        let pixelSpriteTimeline = null;
        if (pixelSpriteRef.current) {
            pixelSpriteTimeline = gsap.timeline({ repeat: -1, yoyo: false, paused: true });
            pixelSpriteTimeline.fromTo(pixelSpriteRef.current,
                { x: '-60vw', y: '110vh', opacity: 0, scale: 0.8, rotation: 0 },
                {
                    x: '160vw', y: '-60vh', opacity: 1, scale: 1.2, rotation: 720, duration: 10, ease: "steps(20)",
                    delay: Math.random() * 2
                }
            );
        }


        let pixelST = ScrollTrigger.create({
            trigger: dataProcessingNetworkSectionRef.current,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => pixelSpriteTimeline && pixelSpriteTimeline.play(),
            onLeave: () => pixelSpriteTimeline && pixelSpriteTimeline.pause(0),
            onEnterBack: () => pixelSpriteTimeline && pixelSpriteTimeline.play(),
            onLeaveBack: () => pixelSpriteTimeline && pixelSpriteTimeline.pause(0),
        });

        // --- Floating Glitch Continuous Animation ---
        let glitchTimeline = null;
        if (floatingGlitchRef.current) {
            glitchTimeline = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
            glitchTimeline.fromTo(floatingGlitchRef.current,
                { x: '-30vw', y: '-30vh', opacity: 0, scale: 1, rotation: 0 },
                {
                    x: '130vw', y: '130vh', opacity: 1, scale: 2.0, rotation: 1080, duration: 15, ease: "steps(15)",
                    delay: Math.random() * 3
                }
            );
        }


        let glitchST = ScrollTrigger.create({
            trigger: dataGridSectionRef.current,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => glitchTimeline && glitchTimeline.play(),
            onLeave: () => glitchTimeline && glitchTimeline.pause(0),
            onEnterBack: () => glitchTimeline && glitchTimeline.play(),
            onLeaveBack: () => glitchTimeline && glitchTimeline.pause(0),
        });

        // Store ScrollTrigger instances to kill them later
        let scrollTriggersToKill = [pixelST, glitchST];


        // --- Cleanup function for all contexts ---
        return () => {
            mainCtx.revert();
            cleanupGlobesThree();
            if (pixelSpriteTimeline) pixelSpriteTimeline.kill();
            if (glitchTimeline) glitchTimeline.kill();
            scrollTriggersToKill.forEach(st => st.kill());
            ScrollTrigger.getAll().forEach(st => st.kill());
            if (splitTitleRef.current) {
                splitTitleRef.current.revert();
            }
            if (cleanupMigrationCapabilitiesTitleHover) cleanupMigrationCapabilitiesTitleHover();
            if (cleanupDataConversionLifecycleTitleHover) cleanupDataConversionLifecycleTitleHover();
            if (cleanupKeyAdvantagesTitleHover) cleanupKeyAdvantagesTitleHover();
            if (cleanupRecentMigrationLogsTitleRef) cleanupRecentMigrationLogsTitleRef();
            if (cleanupCallToActionHeadingHover) cleanupCallToActionHeadingHover();
            if (cleanupCallToActionSubtitleHover) cleanupCallToActionSubtitleHover();
        };
    }, [loginId, collapsed, isLoading]);


    const handleLogin = () => {
        navigate("/setup");
    };

    // GSAP hover animation for Feature Cards
    const FeatureCardAnimated = ({ children, ...props }) => {
        const cardRef = useRef(null);

        const handleMouseEnter = () => {
            gsap.to(cardRef.current, {
                scale: 1.05, // More pronounced scale
                boxShadow: '10px 10px 0px #000000', // Lifted pixelated shadow
                duration: 0.08, // Faster
                overwrite: true,
                filter: 'brightness(1.2) contrast(1.1)', // Subtle glitch effect
            });
            // if (magneticCursorRef.current) { // Removed magneticCursorRef calls
            //     magneticCursorRef.current.enter(e.currentTarget.getBoundingClientRect(), 80, '#00FFFF');
            // }
        };

        const handleMouseLeave = () => {
            gsap.to(cardRef.current, {
                scale: 1,
                boxShadow: '8px 8px 0px #000000', // Revert to original pixelated shadow
                duration: 0.08, // Faster
                overwrite: true,
                filter: 'none', // Remove filter
            });
            // if (magneticCursorRef.current) { // Removed magneticCursorRef calls
            //     magneticCursorRef.current.leave();
            // }
        };

        return (
            <FeatureCard
                ref={cardRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                {children}
            </FeatureCard>
        );
    };

    // Framer Motion variants for staggered entrance of sections
    const sectionVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8, // Fixed duration
                // Removed 'ease: "steps(10)"' as Framer Motion's ease property doesn't support GSAP's steps() directly.
                // Spring physics already provide a distinct, non-smooth motion.
                staggerChildren: 0.08, // Faster stagger
                when: "beforeChildren"
            }
        },
    };

    // Framer Motion variants for individual items within sections
    const itemVariants = {
        hidden: { opacity: 0, y: 80 }, // More pronounced lift
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 } // Removed 'ease: "steps(8)"'
        },
    };


    return (
        <Box ref={mainRef} sx={{
            minHeight: '600vh',
            flexGrow: 1,
            overflow: 'auto', // Changed from 'hidden' to 'auto'
            position: 'relative',
            fontFamily: '"Press Start 2P", cursive', // Apply 8-bit font globally
            fontSize: '0.9rem', // Base font size for 8-bit feel
            lineHeight: 1.5, // Standard line height
            // cursor: 'none', // Removed custom cursor style
        }}>
            {/* SVG Filter for Pixelation Effect */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <filter id="pixelateFilter">
                    <feFlood x="0" y="0" height="4" width="4" result="flood" /> {/* Larger flood for more pixelation */}
                    <feComposite in="SourceGraphic" in2="flood" operator="in" />
                    <feMorphology operator="dilate" radius="2" /> {/* Larger radius for more blockiness */}
                    <feComponentTransfer>
                        <feFuncA type="discrete" tableValues="0 1" />
                    </feComponentTransfer>
                </filter>
            </svg>

            {/* Global Scanline/CRT Overlay */}
            <ScanlineOverlay />

            {/* Magnetic Cursor Component (REMOVED) */}
            {/* <MagneticCursor ref={magneticCursorRef} /> */}

            {/* Always visible username chip in top right */}
            {loginId && (
                <Chip
                    label={`USER: ${loginId}`}
                    color="success"
                    icon={<InfoOutlinedIcon sx={{ color: '#000000 !important' }} />}
                    sx={{
                        fontSize: '0.8rem',
                        zIndex: 1000, // High z-index to stay on top
                        bgcolor: '#00FF00', // Green for "logged in"
                        color: '#000000',
                        '& .MuiChip-icon': { color: '#000000' },
                        borderRadius: '0px',
                        border: '3px solid #000000',
                        padding: '8px 12px',
                        position: 'fixed', // Fixed position
                        top: '20px',
                        right: '20px',
                        textShadow: '1px 1px 0px #000000',
                    }}
                />
            )}

            {/* Pinned Hero Section Container */}
            <PinnedHeroContainer ref={pinnedHeroContainerRef}>
                {/* Pixel Particles Layer */}
                <StyledPixelParticles ref={pixelParticlesRef} />

                {/* Pixelated Light Beam */}
                <StyledPixelatedLightBeam ref={pixelatedLightBeamRef} />
                {/* Monochrome Glow */}
                <StyledMonochromeGlow ref={monochromeGlowRef} />

                {/* Pixel Waves SVG */}
                <StyledPixelWaves ref={pixelWavesRef} viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path fill="#FFFFFF" fillOpacity="1" d="M0,96L48,90.7C96,85,192,75,288,74.7C384,64,480,32,576,21.3C672,11,768,21,864,26.7C960,32,1056,32,1152,32C1248,32,1344,32,1392,32L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                </StyledPixelWaves>

                {/* Data Flow SVG */}
                <StyledDataFlowSVG ref={dataFlowSVGRef} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                    <path d="M 50 50 L 250 50 L 450 50 L 650 50 L 800 50" fill="none" stroke="#FFFFFF" strokeWidth="4" vectorEffect="non-scaling-stroke" /> {/* Thicker lines */}
                    <path d="M 50 150 L 250 150 L 450 150 L 650 150 L 800 150" fill="none" stroke="#FFFFFF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                    <path d="M 50 250 L 250 250 L 450 250 L 650 250 L 800 250" fill="none" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </StyledDataFlowSVG>


                {/* Pixel Sprite and Floating Glitch */}
                <StyledPixelSprite ref={pixelSpriteRef} />
                <StyledFloatingGlitch ref={floatingGlitchRef} />

                {/* Main Hero Content - visible initially */}
                <StyledHeroContent ref={heroContentRef}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom ref={charlieTitleRef}
                        sx={{
                            fontFamily: '"Press Start 2P", cursive',
                            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }, // Larger for impact
                            letterSpacing: { xs: '2px', sm: '4px', md: '6px' }, // More pronounced spacing
                            textTransform: 'uppercase',
                            whiteWhiteSpace: 'nowrap',
                            display: 'inline-block',
                            color: '#FFFFFF',
                            textShadow: '6px 6px 0px #000000', // Even bolder pixel shadow
                            textAlign: 'center', // Explicitly center the text
                            marginBottom: 4,
                        }}
                    >
                        PROJECT CHARLIE
                    </Typography>
                    <StyledInfoBox >
                        YOUR NAVIGATOR FOR HCM DATA MIGRATION
                    </StyledInfoBox>
                    <Divider sx={{ my: 4, bgcolor: "#FFFFFF", opacity: 0.8, width: '60%', maxWidth: '300px', height: '2px' }} /> {/* Thicker divider */}
                    <Box>
                        <StyledInfoBox ref={heroTextRef}>
                            CHARLIE IS AN INTELLIGENT, IN-HOUSE BUILT TOOL DESIGNED TO STREAMLINE AND ACCELERATE THE MIGRATION OF LEGACY HCM DATA INTO ORACLE FUSION. IT SIMPLIFIES THE ENTIRE DATA CONVERSION LIFECYCLE—RIGHT FROM EXTRACTION AND TRANSFORMATION TO AUTOMATED HDL GENERATION AND VALIDATION—MAKING THE MIGRATION PROCESS FASTER, ERROR-FREE, AND REPEATABLE. WITH ROBUST MAPPING CAPABILITIES, BUILT-IN VALIDATION RULES, AND SUPPORT FOR COMPLEX BUSINESS OBJECTS, CHARLIE ENSURES SEAMLESS AND SECURE DATA MOVEMENT WHILE ADHERING TO ORACLE FUSION STANDARDS. WHETHER YOU'RE MIGRATING CORE HR, PAYROLL, OR TALENT DATA, CHARLIE MINIMIZES MANUAL EFFORT, REDUCES REWORK, AND HELPS CUSTOMERS GO LIVE WITH CONFIDENCE.
                        </StyledInfoBox>
                    </Box>
                    {/* The login button is always visible now */}
                    <StyledButton
                        variant="contained"
                        size="large"
                        startIcon={<LoginIcon sx={{ fontSize: '1.5rem !important' }} />} // Larger icon
                        onClick={handleLogin}
                        ref={loginButtonRef}
                        // onMouseEnter={() => magneticCursorRef.current && magneticCursorRef.current.enter(loginButtonRef.current.getBoundingClientRect(), 100, '#FF00FF')} // Removed magneticCursorRef calls
                        // onMouseLeave={() => magneticCursorRef.current && magneticCursorRef.current.leave()}
                    >
                        START YOUR MIGRATION
                    </StyledButton>
                </StyledHeroContent>
            </PinnedHeroContainer>

            {/* Interactive Modules Section */}
            <InteractiveModulesSection ref={interactiveModulesSectionRef} id="interactive-modules-section">
                <Typography variant="h4" align="center" fontWeight="bold" gutterBottom sx={{ mb: 8, zIndex: 5, position: 'relative', fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.5rem' }, textShadow: '4px 4px 0px #000000', textAlign: 'center' }} ref={migrationCapabilitiesTitleRef}>
                    CHARLIE'S MIGRATION CAPABILITIES
                </Typography>
                {/* Mario Character SVG */}
                <MarioCharacter ref={marioCharacterRef} viewBox="0 0 16 16" sx={{ position: 'absolute', bottom: '20px', left: '50px' }}>
                    <rect x="6" y="0" width="4" height="2" fill="#FF0000" /> {/* Cap top */}
                    <rect x="4" y="2" width="8" height="2" fill="#FF0000" /> {/* Cap brim */}
                    <rect x="6" y="2" width="2" height="2" fill="#000000" /> {/* Cap detail */}
                    <rect x="4" y="4" width="8" height="4" fill="#FFCC00" /> {/* Face */}
                    <rect x="5" y="5" width="1" height="1" fill="#000000" /> {/* Eye left */}
                    <rect x="10" y="5" width="1" height="1" fill="#000000" /> {/* Eye right */}
                    <rect x="6" y="6" width="4" height="1" fill="#000000" /> {/* Mustache */}
                    <rect x="5" y="8" width="6" height="2" fill="#0000FF" /> {/* Shirt */}
                    <rect x="4" y="10" width="2" height="4" fill="#0000FF" /> {/* Left arm */}
                    <rect x="10" y="10" width="2" height="4" fill="#0000FF" /> {/* Right arm */}
                    <rect x="6" y="10" width="4" height="2" fill="#FFCC00" /> {/* Hands */}
                    <rect x="6" y="12" width="4" height="4" fill="#FF0000" /> {/* Body */}
                </MarioCharacter>

                <HorizontalScrollContainer>
                    {interactiveModulesData.map((feature, index) => (
                        <Box key={feature.id} className="interactive-module-card" sx={{
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'opacity 0.3s, transform 0.3s',
                        }}>
                            <StyledPixelatedModule
                                modulecolor={feature.modulecolor}
                                onClick={() => handleOpenModal(feature)}
                                // onMouseEnter={(e) => magneticCursorRef.current && magneticCursorRef.current.enter(e.currentTarget.getBoundingClientRect(), 80, '#00FFFF')} // Removed magneticCursorRef calls
                                // onMouseLeave={() => magneticCursorRef.current && magneticCursorRef.current.leave()}
                            >
                                {feature.icon}
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1.5, fontSize: '1rem', color: '#FFFFFF' }}>{feature.title}</Typography>
                            </StyledPixelatedModule>
                            <Box sx={{ mt: 2, width: '100%', maxWidth: '200px' }}>
                                <StyledInfoBoxSmall>
                                    {feature.desc}
                                </StyledInfoBoxSmall>
                            </Box>
                        </Box>
                    ))}
                </HorizontalScrollContainer>
            </InteractiveModulesSection>

            {/* Deep Sea Data Network (with Three.js canvas) */}
            <DataProcessingNetworkSectionContainer ref={dataProcessingNetworkSectionRef} id="data-processing-network-section">
                {/* Canvas for Three.js Cubes (now data nodes) - full section background */}
                <canvas ref={canvasRef2} style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0
                }} />

                {/* Content Overlayed on Canvas */}
                <Box sx={{
                    position: 'relative',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    width: '100%',
                    height: '100%',
                    paddingTop: '120px', // More padding
                    paddingBottom: '120px',
                    boxSizing: 'border-box',
                    color: '#FFFFFF',
                }}>
                    <Typography variant="h4" align="center" fontWeight="bold" gutterBottom sx={{ mb: 8, fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.5rem' }, textShadow: '4px 4px 0px #000000', textAlign: 'center' }} ref={dataConversionLifecycleTitleRef}>
                        CHARLIE'S DATA CONVERSION LIFECYCLE
                    </Typography>
                    <HorizontalScrollContainer>
                        {dataProcessingUnits.map((feature, idx) => (
                            <Box
                                key={feature.id}
                                sx={{
                                    transition: 'opacity 0.3s, transform 0.3s',
                                    pointerEvents: 'auto',
                                }}
                                onClick={() => handleOpenModal(feature)}
                                // onMouseEnter={(e) => magneticCursorRef.current && magneticCursorRef.current.enter(e.currentTarget.getBoundingClientRect(), 80, '#FF00FF')} // Removed magneticCursorRef calls
                                // onMouseLeave={() => magneticCursorRef.current && magneticCursorRef.current.leave()}
                            >
                                <Paper
                                    elevation={3}
                                    sx={{
                                        p: 4, // More padding
                                        borderRadius: '0px',
                                        bgcolor: 'repeating-linear-gradient(45deg, #000000 0px, #000000 2px, #333333 2px, #333333 4px)', // More defined pixel pattern
                                        color: '#FFFFFF',
                                        backdropFilter: 'none',
                                        border: '2px solid #FFFFFF',
                                        textAlign: 'center',
                                        width: '220px', // Larger cards
                                        height: '200px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'transform 0.08s steps(1), box-shadow 0.08s steps(1)',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                            boxShadow: '6px 6px 0px #FFFFFF', // White pixelated glow
                                        },
                                        fontFamily: '"Press Start 2P", cursive',
                                        fontSize: '0.8rem',
                                    }}
                                    // onMouseEnter={(e) => magneticCursorRef.current && magneticCursorRef.current.enter(e.currentTarget.getBoundingClientRect(), 80, '#FF00FF')} // Removed magneticCursorRef calls
                                    // onMouseLeave={() => magneticCursorRef.current && magneticCursorRef.current.leave()}
                                >
                                    {feature.icon}
                                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1.5, fontSize: '1rem' }}>{feature.title}</Typography>
                                    <StyledInfoBoxSmall>
                                        {feature.desc}
                                    </StyledInfoBoxSmall>
                                </Paper>
                            </Box>
                        ))}
                    </HorizontalScrollContainer>
                </Box>
            </DataProcessingNetworkSectionContainer>

            {/* New: Key Features Section */}
            <Box
                ref={keyFeaturesSectionRef}
                id="key-features-section" // Added ID for clarity
                component={motion.div}
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                sx={{
                    minHeight: '100vh',
                    background: "repeating-linear-gradient(-45deg, #000000 0px, #000000 8px, #555555 8px, #555555 16px)",
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '100px 20px',
                    boxSizing: 'border-box',
                    fontFamily: '"Press Start 2P", cursive',
                }}
            >
                <Typography variant="h4" align="center" fontWeight="bold" gutterBottom sx={{ mb: 8, fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.5rem' }, textShadow: '4px 4px 0px #000000', textAlign: 'center' }} ref={keyAdvantagesTitleRef}>
                    KEY ADVANTAGES OF CHARLIE
                </Typography>
                <Box
                    className="key-features-horizontal-scroll-content" // Added class for selection
                    sx={{
                        display: 'flex', // Change to flex to force single row
                        flexWrap: 'wrap', // Changed to wrap
                        justifyContent: 'center', // Center items
                        gap: { xs: 4, md: 6 },
                        width: '100%', // Take full width
                        padding: '20px', // Add some padding for visual separation
                    }}
                >
                    {keyFeaturesData.map((feature, index) => (
                        <motion.div key={feature.id} variants={itemVariants} sx={{
                            flexShrink: 0,
                            transition: 'opacity 0.3s, transform 0.3s',
                        }}> {/* Prevent shrinking */}
                            <FeatureCardAnimated
                                // onMouseEnter={(e) => magneticCursorRef.current && magneticCursorRef.current.enter(e.currentTarget.getBoundingClientRect(), 80, '#00FFFF')} // Removed magneticCursorRef calls
                                // onMouseLeave={() => magneticCursorRef.current && magneticCursorRef.current.leave()}
                            >
                                {feature.icon}
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 2.5, mb: 1.5, fontSize: '1rem' }}>{feature.title}</Typography>
                            </FeatureCardAnimated>
                        </motion.div>
                    ))}
                </Box>
            </Box>

            {/* DataGrid Section */}
            <DataGridSectionContainer ref={dataGridSectionRef} id="data-grid-section">
                <Box
                    className="data-grid-horizontal-scroll-content" // Added class for selection
                    sx={{
                        maxWidth: 900, mx: "auto", my: 8, p: 5, borderRadius: '0px',
                        bgcolor: 'repeating-linear-gradient(45deg, #000000 0px, #000000 4px, #111111 4px, #111111 8px)',
                        border: '4px solid #FFFFFF', boxShadow: '10px 10px 0px #000000',
                        '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar
                        msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
                        scrollbarWidth: 'none', // Hide scrollbar for Firefox
                    }}
                >
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', mb: 4, fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' }, textShadow: '4px 4px 0px #000000', textAlign: 'center' }} ref={recentMigrationLogsTitleRef}>
                        RECENT MIGRATION LOGS
                    </Typography>
                    <Paper elevation={2} sx={{ height: 350, p: 3, bgcolor: '#000000', borderRadius: '0px', color: '#FFFFFF', border: '2px solid #FFFFFF', overflow: 'auto' }}> {/* Thicker border, more padding */}
                        <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
                            <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontFamily: '"Press Start 2P", cursive', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ background: '#333333', textAlign: 'left', borderBottom: '3px solid #FFFFFF' }}>
                                        <th style={{ padding: '10px', borderRight: '2px solid #FFFFFF' }}>MIGRATION TASK</th>
                                        <th style={{ padding: '10px', borderRight: '2px solid #FFFFFF' }}>STATUS</th>
                                        <th style={{ padding: '10px' }}>LAST ACTIVITY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sampleRows.map(row => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #555555' }}>
                                            <td style={{ padding: '10px', borderRight: '1px solid #555555' }}>{row.name}</td>
                                            <td style={{ padding: '10px', borderRight: '1px solid #555555' }}>
                                                <Chip
                                                    label={row.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: row.status.includes('FAILED') ? '#FF0000' : row.status.includes('PENDING') || row.status.includes('PROGRESS') ? '#FFFF00' : '#00FF00', // Use bright 8-bit colors
                                                        color: '#000000',
                                                        borderRadius: '0px',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.7rem', // Slightly larger
                                                        height: '24px', // Taller chips
                                                        textShadow: '1px 1px 0px #000000' // Pixel shadow on chip text
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>{row.lastRun}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                </Box>
            </DataGridSectionContainer>

            {/* New: Call to Action Section */}
            <CallToActionSection
                ref={callToActionSectionRef}
                component={motion.div}
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                <Typography variant="h4" align="center" fontWeight="bold" gutterBottom sx={{ mb: 5, fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.5rem' }, textShadow: '4px 4px 0px #000000', textAlign: 'center' }} ref={callToActionHeadingRef}>
                    READY TO ACCELERATE YOUR HCM MIGRATION?
                </Typography>
                <StyledInfoBox>
                    JOIN THE EXPEDITION TO UNPARALLELED INSIGHTS AND AUTOMATION IN THE OCEAN OF INFORMATION.
                </StyledInfoBox>
                <StyledButton
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon sx={{ fontSize: '1.5rem !important' }} />}
                    onClick={handleLogin}
                    component={motion.button}
                    whileHover={{ scale: 1.08, boxShadow: "10px 10px 0px #FFFFFF" }} // Stronger white shadow
                    whileTap={{ scale: 0.95, transform: 'translate(4px, 4px)', boxShadow: '4px 4px 0px #FFFFFF' }} // Press effect
                    transition={{ type: "spring", stiffness: 400, damping: 17, duration: 0.05 }}
                    // onMouseEnter={(e) => magneticCursorRef.current && magneticCursorRef.current.enter(e.currentTarget.getBoundingClientRect(), 100, '#FF00FF')} // Removed magneticCursorRef calls
                    // onMouseLeave={() => magneticCursorRef.current && magneticCursorRef.current.leave()}
                >
                    START YOUR EXPEDITION
                </StyledButton>
            </CallToActionSection>

            {/* Feature Detail Modal */}
            <FeatureDetailModal
                open={openModal}
                handleClose={handleCloseModal}
                feature={selectedFeature}
            />
        </Box>
    );
}

export default Home;
