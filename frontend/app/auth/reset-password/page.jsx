"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Avatar,
  Button,
  TextField,
  Link,
  Box,
  Typography,
  Container,
  CssBaseline,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme();

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success");
  const [open, setOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Password validation rules
  const passwordRules = {
    minLength: 8,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*]/,
  };

  const [ruleValidation, setRuleValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get("token");
    if (tokenFromURL) {
      setToken(tokenFromURL);
    } else {
      setMessage("Invalid token or token not provided");
      setSeverity("error");
      setOpen(true);
    }
  }, []);

  const handlePasswordChange = (value) => {
    setPassword(value);
    validatePassword(value, confirmPassword);
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    validatePassword(password, value);
  };

  const validatePassword = (password, confirmPassword) => {
    const validation = {
      minLength: password.length >= passwordRules.minLength,
      hasUpperCase: passwordRules.hasUpperCase.test(password),
      hasLowerCase: passwordRules.hasLowerCase.test(password),
      hasNumber: passwordRules.hasNumber.test(password),
      hasSpecialChar: passwordRules.hasSpecialChar.test(password),
      passwordsMatch: password === confirmPassword,
    };
    setRuleValidation(validation);

    let error = "";
    if (!validation.passwordsMatch) {
      error = "Passwords do not match.";
    }

    setPasswordError(error);
    return !error && Object.values(validation).every(Boolean); // Ensure all rules pass
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password, confirmPassword)) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resetpassword`,
        { token, newPassword: password }
      );
      setMessage(response.data.message);
      setSeverity("success");
      setOpen(true);
      setTimeout(() => router.push("/auth/signin"), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Something went wrong");
      setSeverity("error");
      setOpen(true);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Reset Password
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Enter your new password below
          </Typography>
          {/* Password rules */}{" "}
          <List sx={{ mt: 2, mb: 2 }} dense>
            <ListItem>
              <ListItemIcon>
                {ruleValidation.minLength ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary="At least 8 characters long" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {ruleValidation.hasUpperCase ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary="At least one uppercase letter" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {ruleValidation.hasLowerCase ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary="At least one lowercase letter" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {ruleValidation.hasNumber ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary="At least one number" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {ruleValidation.hasSpecialChar ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary="At least one special character (!@#$%^&*)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {ruleValidation.passwordsMatch ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary="Passwords must match" />
            </ListItem>
          </List>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 3 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              label="New Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={Boolean(passwordError)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              error={Boolean(passwordError)}
            />
            {passwordError && (
              <Typography color="error" variant="body2">
                {passwordError}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!token || Object.values(ruleValidation).includes(false)}
            >
              Reset Password
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="/auth/signin" variant="body2">
                  Back to Sign In
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        {/* Snackbar to display success or error message */}
        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleClose}
            severity={severity}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}
