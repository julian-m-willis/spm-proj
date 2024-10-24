"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Import isSameOrAfter plugin
dayjs.extend(isSameOrAfter); // Extend Day.js

import {
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Box,
} from '@mui/material';
import axios from "axios";

const ApplyArrangementPage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);

  // Function to calculate 2 working days in advance
  const calculateTwoWorkingDays = () => {
    const today = dayjs().startOf('day');
    let daysToAdd = 2;
    let adjustedDate = today;

    while (daysToAdd > 0) {
      adjustedDate = adjustedDate.add(1, 'day');
      if (adjustedDate.day() !== 0 && adjustedDate.day() !== 6) { // Skip weekends
        daysToAdd--;
      }
    }
    return adjustedDate;
  };

  // Set placeholder to 2 working days in advance
  const [selectedDate, setSelectedDate] = useState(calculateTwoWorkingDays()); 
  const [startDate, setStartDate] = useState(calculateTwoWorkingDays());
  const [loading, setLoading] = useState(false);
  const [applyMode, setApplyMode] = useState("ad-hoc");
  const [sessionType, setSessionType] = useState("");
  const [desc, setDesc] = useState("");

  // For batch apply
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
  });
  const [numOccurrences, setNumOccurrences] = useState(1);
  const [repeatType, setRepeatType] = useState("weekly");

  const handleSessionType = (event) => {
    setSessionType(event.target.value);
  };

  const handleDescChange = (event) => {
    setDesc(event.target.value);
  };

  const handleDateChange = (event) => {
    const newDate = dayjs(event.target.value);
    const adjustedDate = calculateTwoWorkingDays();

    if (newDate.day() === 0 || newDate.day() === 6) {
      alert("You cannot apply for WFH on weekends. Please select a weekday.");
    } else if (newDate.isSameOrAfter(adjustedDate, 'day')) {
      setSelectedDate(newDate);
    } else {
      alert("Please select a date that is at least 2 working days in advance.");
    }
  };

  const handleStartDateChange = (event) => {
    const newStartDate = dayjs(event.target.value);
    const adjustedDate = calculateTwoWorkingDays();

    if (newStartDate.day() === 0 || newStartDate.day() === 6) {
      alert("The start date cannot be on a weekend. Please select a weekday.");
    } else if (newStartDate.isSameOrAfter(adjustedDate, 'day')) {
      setStartDate(newStartDate);
    } else {
      alert("The start date must be at least 2 working days in advance.");
    }
  };

  const handleDayOfWeekChange = (day) => {
    setSelectedDaysOfWeek({
      ...selectedDaysOfWeek,
      [day]: !selectedDaysOfWeek[day],
    });
  };

  const handleNumOccurrencesChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setNumOccurrences(value > 0 ? Math.min(value, 12) : 1); // Ensure minimum of 1 and maximum of 12 occurrences
  };

  const submitAdhocRequest = async () => {
    if (!token) {
      setToken(session?.user?.token);
      return;
    }
    if (!sessionType) {
      alert("Please select a session type before submitting.");
      return;
    }

    try {
      const formattedDate = selectedDate.format("YYYY-MM-DD");

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/`,
        {
          session_type: sessionType,
          start_date: formattedDate,
          description: desc || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Your WFH request has been submitted successfully!");
    } catch (error) {
      console.error("Error applying:", error);
      alert("There was an error processing your request. Please try again.");
    }
  };

  const submitBatchRequest = async () => {
    if (!token) {
      setToken(session?.user?.token);
      return;
    }
  
    if (!sessionType) {
      alert("Please select a session type before submitting.");
      return;
    }
  
    const selectedDays = Object.keys(selectedDaysOfWeek).filter(
      (day) => selectedDaysOfWeek[day]
    );
  
    if (selectedDays.length === 0) {
      alert("Please select at least one day of the week.");
      return;
    }
  
    try {
      const batchData = {
        staff_id: session.user.staff_id, // Send the staff_id from session data
        session_type: sessionType,
        description: desc || null, // Optional description
        selected_days: selectedDays,
        num_occurrences: numOccurrences,
        repeat_type: repeatType,
        start_date: startDate.format("YYYY-MM-DD"),
      };
  
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/batch/`,
        batchData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const { message, new_requests, cancelled_requests } = response.data;
      let successMessage = message;
      
      if (new_requests.length > 0) {
        successMessage += `\nNew Requests Created: ${new_requests.map((req) => dayjs(req.start_date).format('DD MMM YYYY')).join(', ')}`;
      }
      if (cancelled_requests.length > 0) {
        successMessage += `\nCancelled Requests: ${cancelled_requests.map((req) => dayjs(req.start_date).format('DD MMM YYYY')).join(', ')}`;
      }

      alert(successMessage);
    } catch (error) {
      console.error("Error applying batch request:", error);
      alert("There was an error processing your batch request. Please try again.");
    }
  };
  

  return (
    <Container>
      <FormControl fullWidth>
        {/* Dropdown to switch between Ad-hoc and Batch Apply */}
        <InputLabel id="apply-mode-select-label">Apply Mode</InputLabel>
        <Select
          labelId="apply-mode-select-label"
          id="apply-mode-select"
          value={applyMode}
          onChange={(e) => setApplyMode(e.target.value)}
          style={{ marginBottom: "20px" }}
        >
          <MenuItem value="ad-hoc">Ad-hoc</MenuItem>
          <MenuItem value="batch">Batch Apply</MenuItem>
        </Select>

        {/* Session Type Selection */}
        <Select
          id="session-type-select"
          value={sessionType}
          onChange={handleSessionType}
          style={{ marginBottom: "20px" }}
        >
          <MenuItem value={"Work from home"}>Work from Home</MenuItem>
          <MenuItem value={"Work from home (AM)"}>Work from Home (AM)</MenuItem>
          <MenuItem value={"Work from home (PM)"}>Work from Home (PM)</MenuItem>
        </Select>

        {/* Ad-hoc Apply Form */}
        {applyMode === "ad-hoc" && (
          <>
            <TextField
              type="date"
              value={selectedDate.format("YYYY-MM-DD")}
              onChange={handleDateChange}
              style={{ marginBottom: "20px" }}
            />
            <TextField
              id="description"
              label="Description (Optional)"
              variant="outlined"
              onChange={handleDescChange}
            />
          </>
        )}

        {/* Batch Apply Form */}
        {applyMode === "batch" && (
          <>
            <TextField
              label="Batch Start Date"
              type="date"
              value={startDate.format("YYYY-MM-DD")}
              onChange={handleStartDateChange}
              style={{ marginBottom: "20px" }}
            />

            <Box>
              <Typography>Choose Days of the Week:</Typography>
              <FormGroup row>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                  (day) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedDaysOfWeek[day]}
                          onChange={() => handleDayOfWeekChange(day)}
                        />
                      }
                      label={day}
                      key={day}
                    />
                  )
                )}
              </FormGroup>
            </Box>

            <TextField
              label="Number of Occurrences"
              type="number"
              value={numOccurrences}
              onChange={handleNumOccurrencesChange}
              inputProps={{ min: 1, max: 12 }}
              style={{ marginBottom: "20px" }}
            />

            {/* Repeat Options */}
            <FormControl fullWidth>
              <InputLabel id="repeat-type-label">Repeat Type</InputLabel>
              <Select
                labelId="repeat-type-label"
                id="repeat-type-select"
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value)}
                style={{ marginBottom: "20px" }}
              >
                <MenuItem value="weekly">Repeat Weekly</MenuItem>
                <MenuItem value="monthly">Repeat Monthly</MenuItem>
              </Select>
            </FormControl>

            {/* Description (Optional) */}
            <TextField
              id="description"
              label="Description (Optional)"
              variant="outlined"
              onChange={handleDescChange}
            />
          </>
        )}

        {/* Submit Button */}
        <Button
          variant="contained"
          style={{ marginTop: "20px" }}
          onClick={applyMode === "ad-hoc" ? submitAdhocRequest : submitBatchRequest}
        >
          Submit Request
        </Button>
      </FormControl>
    </Container>
  );
};

export default ApplyArrangementPage;
