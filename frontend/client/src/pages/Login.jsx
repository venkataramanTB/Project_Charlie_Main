import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    TextField,
    Typography,
    Box,
    Paper,
    Avatar,
    Alert,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { styled } from "@mui/system";
import { gsap } from "gsap";

// align the login form to the center of the page
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: 400,
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing(20),
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
    borderRadius: theme.shape.borderRadius * 2,
    overflow: "hidden",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
}));

const Login = () => {
    const [UserName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState("info");
    const navigate = useNavigate();
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;

    // Refs for GSAP animations
    const paperRef = useRef(null);
    const avatarRef = useRef(null);
    const titleRef = useRef(null);
    const formRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        // Ensure refs are not null before animating
        if (!paperRef.current || !avatarRef.current || !titleRef.current || !formRef.current || !buttonRef.current) {
            console.warn("One or more refs are null, skipping GSAP animations on mount.");
            return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(paperRef.current,
            { opacity: 0, y: 50, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 1, delay: 0.2 }
        )
        .fromTo(avatarRef.current,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
            "<0.3"
        )
        .fromTo(titleRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5 },
            "<0.2"
        );

        // Animate children of the form
        const formChildren = Array.from(formRef.current.children);
        if (formChildren.length > 0) {
            tl.fromTo(formChildren,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
                "<0.2"
            );
        } else {
             console.warn("Form has no children to animate, skipping form children animation.");
        }


        // Optional: Add a subtle hover effect to the button
        // Store the tween to kill it later
        let buttonHoverTween = null;
        if (buttonRef.current) {
            buttonRef.current.onmouseenter = () => {
                buttonHoverTween = gsap.to(buttonRef.current, { scale: 1.05, duration: 0.2 });
            };
            buttonRef.current.onmouseleave = () => {
                if (buttonHoverTween) buttonHoverTween.reverse(); // Reverse the tween
                buttonHoverTween = gsap.to(buttonRef.current, { scale: 1, duration: 0.2 }); // Ensure it returns to scale 1
            };
        }

        // Cleanup function: This will run when the component unmounts
        return () => {
            tl.kill(); // Kill the main timeline
            if (buttonHoverTween) buttonHoverTween.kill(); // Kill the hover tween if it exists
            // Also explicitly remove event listeners if added manually
            if (buttonRef.current) {
                buttonRef.current.onmouseenter = null;
                buttonRef.current.onmouseleave = null;
            }
            gsap.killTweensOf(paperRef.current);
            gsap.killTweensOf(avatarRef.current);
            gsap.killTweensOf(titleRef.current);
            gsap.killTweensOf(formRef.current);
            gsap.killTweensOf(buttonRef.current);
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage(null);
        setMessageType("info");

        try {
            const response = await fetch(`${apiEndpoint}/api/utils/login-access`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: UserName, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Login successful!");
                setMessageType("success");

                sessionStorage.setItem("user", JSON.stringify({
                    username: data.username,
                    userType: data.user_type,
                }));

                // Animate out and then navigate
                gsap.to(paperRef.current, {
                    opacity: 0,
                    y: -50,
                    scale: 0.9,
                    duration: 0.5,
                    onComplete: () => navigate("/home"),
                });

            } else {
                setMessage(data.detail || "Login failed. Please check your credentials.");
                setMessageType("error");
                // Optional: Add a shake animation for failed login
                gsap.to(paperRef.current, {
                    x: -10,
                    duration: 0.1,
                    repeat: 5,
                    yoyo: true,
                    ease: "power1.inOut",
                    onComplete: () => gsap.to(paperRef.current, { x: 0 }),
                });
            }
        } catch (error) {
            setMessage("Network error or server unavailable.");
            setMessageType("error");
            console.error("Login API error:", error);
        }
    };

    return (
        <StyledPaper elevation={3} ref={paperRef}>
            <StyledAvatar ref={avatarRef}>
                <LockOutlinedIcon />
            </StyledAvatar>
            <Typography variant="h5" gutterBottom ref={titleRef}>
                Login
            </Typography>
            {message && (
                <Alert severity={messageType} sx={{ width: '100%', mb: 2 }}>
                    {message}
                </Alert>
            )}
            <form onSubmit={handleLogin} ref={formRef} style={{ width: '100%' }}>
                <TextField
                    fullWidth
                    margin="normal"
                    label="UserName"
                    type="text"
                    value={UserName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                    ref={buttonRef}
                >
                    Login
                </Button>
            </form>
        </StyledPaper>
    );
};

export default Login;