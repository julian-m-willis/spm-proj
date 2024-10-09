/*import * as React from 'react';
import Typography from '@mui/material/Typography';

export default function ViewOwnSchedulePage() {
  return <Typography>Welcome to the orders page!</Typography>;
}*/

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";
import { useMediaQuery } from "@mui/material";

const SchedulePage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [ownTeamSchedules, setOwnTeamSchedules] = useState({});
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
      setDepartmentName(session.user.dept);
    }
  }, [session]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/team/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(response.data);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchTeamMembers();
  }, [token]);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await axios.get(
          `http://localhost:3000/schedules/staff/team/?start_date=${formattedDate}&end_date=${formattedDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSchedules(response.data);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [selectedDate, token]);

  useEffect(() => {
    if (schedules) {
      const dateKey = selectedDate.format("YYYY-MM-DD");
      const teamSchedules = teamMembers.reduce((acc, member) => {
        const memberSchedule = schedules[dateKey]?.[departmentName]?.[member.role];
        if (memberSchedule) {
          acc[member.name] = memberSchedule;
        }
        return acc;
      }, {});
      setOwnTeamSchedules(teamSchedules);
    }
  }, [schedules, teamMembers, selectedDate, departmentName]);

  const renderScheduleCard = (name, schedule) => {
    return (
      <Card key={name} style={{ marginBottom: "15px" }}>
        <CardContent>
          <Typography variant="h6">{name}</Typography>
          {renderScheduleSection("In office", schedule["In office"])}
          {renderScheduleSection("Work from home", schedule["Work from home"])}
          {renderScheduleSection("Work from home (AM)", schedule["Work from home (AM)"])}
          {renderScheduleSection("Work from home (PM)", schedule["Work from home (PM)"])}
        </CardContent>
      </Card>
    );
  };

  const renderScheduleSection = (title, schedule) => {
    if (!schedule || schedule.length === 0) return null;

    return (
      <div>
        <Typography variant="h7" style={{ textDecoration: "underline" }}>
          {title}:<br />
        </Typography>
        <Typography variant="body2">
          {schedule.join(", ")}
        </Typography>
      </div>
    );
  };

  return (
    <Container>
      <TextField
        type="date"
        value={selectedDate.format("YYYY-MM-DD")}
        onChange={(e) => setSelectedDate(dayjs(e.target.value))}
        style={{ marginBottom: "20px" }}
      />

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {Object.keys(ownTeamSchedules).length > 0 ? (
            Object.entries(ownTeamSchedules).map(([name, schedule]) => renderScheduleCard(name, schedule))
          ) : (
            <Typography>No schedules available for your team on this date.</Typography>
          )}
        </>
      )}
    </Container>
  );
};

export default SchedulePage;
