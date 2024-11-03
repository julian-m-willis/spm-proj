"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import axios from "axios";
import { useSession } from "next-auth/react";
import { signOut } from 'next-auth/react';

const ChangePassword = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldsDisabled, setFieldsDisabled] = useState(false);
  const [passwordChecklist, setPasswordChecklist] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    specialChar: false,
    number: false,
    match: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  // useEffect to validate passwords when the new password or confirm password changes
  useEffect(() => {
    const validatePassword = (password, confirmPassword) => {
      const rules = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        specialChar: /[!@#$%^&*]/.test(password),
        number: /[0-9]/.test(password),
        match: password === confirmPassword,
      };
      setPasswordChecklist(rules);
    };

    validatePassword(newPassword, confirmPassword);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordChecklist.match) {
      setError("Passwords do not match.");
      return;
    }

    if (!Object.values(passwordChecklist).every(Boolean)) {
      setError("New password does not meet all the required rules.");
      return;
    }

    if (!token) {
      setToken(session?.user?.token);
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/changepassword`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Password changed successfully! Signing Out ... ");
      setFieldsDisabled(true);
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 2000);

    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mt: 5, display: "flex", flexDirection: "column", gap: 3 }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label="Current Password"
          type="password"
          variant="outlined"
          required
          fullWidth
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={fieldsDisabled}
        />

        <TextField
          label="New Password"
          type="password"
          variant="outlined"
          required
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={fieldsDisabled}
        />

        <TextField
          label="Confirm New Password"
          type="password"
          variant="outlined"
          required
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={fieldsDisabled}
        />

        {/* Password Checklist */}
        <Typography variant="subtitle1">Password must contain:</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              {passwordChecklist.minLength ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary="At least 8 characters long" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {passwordChecklist.uppercase ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary="At least one uppercase letter" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {passwordChecklist.lowercase ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary="At least one lowercase letter" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {passwordChecklist.number ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary="At least one number" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {passwordChecklist.specialChar ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary="At least one special character (!@#$%^&*)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {passwordChecklist.match ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary="Passwords must match" />
          </ListItem>
        </List>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={
            !passwordChecklist.match ||
            !Object.values(passwordChecklist).every(Boolean)
          }
        >
          Change Password
        </Button>
      </Box>
    </Container>
  );
};

export default ChangePassword;
