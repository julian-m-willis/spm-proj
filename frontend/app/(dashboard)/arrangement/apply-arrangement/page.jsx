"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
// import dayjsBusinessDays from 'dayjs-business-days';
import {
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import axios from "axios";
import moment from "moment";

// disable keyboard inputs
const disableKeyboardInput = (event) => {
  event.preventDefault();
};

const addBusinessDays = (date, days) => {
  let tempDate = moment(date); // Create a copy of the date
  while (days > 0) {
    tempDate = tempDate.add(1, 'days'); // Add one day
    // If the day is not Saturday (6) or Sunday (0), count it as a business day
    if (tempDate.isoWeekday() !== 6 && tempDate.isoWeekday() !== 7) {
      days -= 1;
    }
  }
  return tempDate;
};

const ApplyArrangementPage = () => {
  const { data: session} = useSession();
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(addBusinessDays(moment(), 2));
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [schedules, setSchedules] = useState({});
  const [appliedDates, setAppliedDates] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [sessionType, setSessionType] = useState("")
  const [desc, setDesc] = useState("")
  const [errorMessage, setErrorMessage] = useState('');  // Line added


  const handleSessionType = (event) => {
    setSessionType(event.target.value)
  }

  const handleDescChange = (event) => {
    setDesc(event.target.value)
  }

  const handleDateChange = (event) => {
    const newDate = dayjs(event.target.value);
    const today = dayjs().startOf('day'); // Get today's date at the start of the day
    if (newDate.day() == 0 || newDate.day() == 6) {
      alert("Please select a weekday")
    }
    else {
      if (today.day() == 4) {
        const checkdate = today.add(4, 'day')
        if (newDate.isAfter(checkdate)) {
          setSelectedDate(newDate);
        } else {
          alert("Please select a date that is at least 2 working days later.");
        }
      }
      else if (today.day() == 5) {
        const checkdate = today.add(3, 'day')
        if (newDate.isAfter(checkdate)) {
          setSelectedDate(newDate);
        } else {
          alert("Please select a date that is at least 2 working days later.");
        }
      }
      else {
        const checkdate = today.add(2, 'day')
        if (newDate.isAfter(checkdate)) {
          setSelectedDate(newDate);
        } else {
          alert("Please select a date that is at least 2 working days later.");
        }
      }

    }

  };

  const fetchScheduleData = async () => {
    try {
      if (!token) return;

      const response = await axios.get(
        `http://localhost:3001/schedules/staff/?start_date='1990-10-01'&end_date='2099-10-01'`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Process the fetched schedule data
      const scheduleData = response.data.schedules;
      setSchedules(scheduleData);

      // Filter dates that are not marked as "In office"
      const nonOfficeDates = Object.entries(scheduleData)
        .filter(([date, status]) => status !== "In office")
        .map(([date]) => date); // Extract only the date

      setAppliedDates(nonOfficeDates);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  // Effect to handle session changes
  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
      fetchScheduleData();
    }
  }, [session]);

  const submitRequest = async () => {
    if (!token) {
      setToken(session?.user?.token);
      return;
    }
    if (!sessionType) {
      alert("Please select a session type before submitting.");
      return;
    }
    if (!desc.trim()) {
      alert("Please provide a description before submitting.");
      return;
    }

    try {
      const formattedDate = selectedDate.format("YYYY-MM-DD");

      // Check if the selected date is already "In office"
      if (appliedDates.includes(formattedDate)) {
        alert("You cannot apply for WFH on this date as it is not marked as 'In office'.");
        return;
      }

      const response = await axios.post(
        `http://localhost:3001/arrangements/`,
        {
          session_type: sessionType,
          start_date: formattedDate,
          description: desc,
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
      alert("There was an error processing your request. Please try again.")
    }
  };

  return (
    <Container>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Session Type</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={sessionType}
          label="Session Type"
          onChange={handleSessionType}
        >
          <MenuItem value={"Work from home"}>Work from Home</MenuItem>
          <MenuItem value={"Work from home (AM)"}>Work from Home (AM)</MenuItem>
          <MenuItem value={"Work from home (PM)"}>Work from Home (PM)</MenuItem>
        </Select>
        <TextField
          type="date"
          value={selectedDate.format("YYYY-MM-DD")}
          onKeyDown={disableKeyboardInput}  // Disable typing in the input field
          
          onChange={handleDateChange}
          style={{ marginBottom: "20px", marginTop: "20px" }}
        />
        <TextField id="outlined-basic" label="Description" variant="outlined" onChange={handleDescChange}/>
        <Button variant="contained" style={{marginTop: "20px"}} onClick={submitRequest}>Submit Request</Button>
      </FormControl>
      {/* {loading ? <CircularProgress /> : isMobile ? renderMobileCards() : renderTable()} */}
    </Container>
  );
};

export default ApplyArrangementPage;
