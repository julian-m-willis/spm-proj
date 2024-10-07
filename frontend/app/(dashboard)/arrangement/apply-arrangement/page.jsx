"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
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

const ApplyArrangementPage = () => {
  const { data: session} = useSession();
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");
  const [sessionType, setSessionType] = useState("")
  const [desc, setDesc] = useState("")

  const handleSessionType = (event) => {
    setSessionType(event.target.value)
  }

  const handleDescChange = (event) => {
    setDesc(event.target.value)
  }

  const handleDateChange = (event) => {
    setSelectedDate(dayjs(event.target.value));
  };

  // Effect to handle session changes
  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    }
  }, [session]);

  const submitRequest = async () => {
    if (!token) {
      setToken(session?.user?.token);
      return;
    }; 
    try {
      const formattedDate = selectedDate.format("YYYY-MM-DD");
      const response = await axios.post(
        `http://localhost:3001/arrangements/`,
        {
          "session_type": sessionType,
          "start_date": formattedDate,
          "description": desc
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )
      alert(response.data)
    }
    catch (error) {
      console.error("Error applying:", error);
    }
  }


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
          <MenuItem value={"wfhRegular"}>Work from Home</MenuItem>
          <MenuItem value={"wfhAM"}>Work from Home (AM)</MenuItem>
          <MenuItem value={"wfhPM"}>Work from Home (PM)</MenuItem>
        </Select>
        <TextField
          type="date"
          value={selectedDate.format("YYYY-MM-DD")}
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
