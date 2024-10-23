"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  Card, 
  CardContent,
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
} from "@mui/material";
import axios from "axios";
import { useMediaQuery } from "@mui/material";

const SchedulePage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    }
  }, [session]);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!token) {
        setToken(session?.user?.token);
        return;
      }
      setLoading(true);
      try {
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/schedules/hr/?start_date=${formattedDate}&end_date=${formattedDate}`,
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

  // Get unique roles and departments from schedules
  const roles = schedules
    ? Object.keys(schedules[selectedDate.format("YYYY-MM-DD")]?.[departmentName] || {})
    : [];

  const departments = schedules
    ? Object.keys(schedules[selectedDate.format("YYYY-MM-DD")] || {})
    : [];

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setDepartmentName(event.target.value);
    setSelectedRole(""); // Reset selected role when department changes
  };

  const handleDateChange = (event) => {
    setSelectedDate(dayjs(event.target.value));
  };

  // Renders the table with department-wise grouping and role-based schedules
  const renderTable = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const allDepartments = schedules?.[dateKey];

    if (!allDepartments) {
      return <Typography>No schedules available for this date.</Typography>;
    }

    const filteredDepartments = Object.keys(allDepartments)
    .filter((department) => department !== "CEO")
    .reduce((acc, department) => {
      acc[department] = allDepartments[department];
      console.log("Available departments:", departments);

      return acc;
    }, {});

    return Object.keys(filteredDepartments).map((department) => {
      const departmentSchedules = filteredDepartments[department];
      const filteredSchedules = selectedRole
        ? { [selectedRole]: departmentSchedules[selectedRole] }
        : departmentSchedules;

      if (!filteredSchedules || Object.keys(filteredSchedules).length === 0) {
        return null;
      }

      return (
        <div key={department} style={{ marginBottom: "30px" }}>
          <Typography variant="h5" gutterBottom>
            {department} Department
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "16.66%", fontWeight: "bold" }}>Role</TableCell>
                  <TableCell sx={{ width: "41.67%", fontWeight: "bold" }}>In Office</TableCell>
                  <TableCell sx={{ width: "41.67%", fontWeight: "bold" }}>Work from Home</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(filteredSchedules).map((role) => {
                  const roleSchedule = filteredSchedules[role];

                  const renderWFHCell = () => {
                    const wfhRegular = roleSchedule["Work from home"] || [];
                    const wfhAM = roleSchedule["Work from home (AM)"] || [];
                    const wfhPM = roleSchedule["Work from home (PM)"] || [];

                    if (wfhRegular.length > 0 && wfhAM.length === 0 && wfhPM.length === 0) {
                      return <Typography variant="subtitle2">{wfhRegular.join(", ")}</Typography>;
                    } else if (wfhAM.length > 0 && wfhPM.length > 0) {
                      return (
                        <div>
                          <Typography variant="subtitle2">{wfhRegular.join(", ")}<br /></Typography>
                          <Typography variant="subtitle2" style={{ marginTop: "8px" }}>
                            <span style={{ textDecoration: "underline" }}>WFH AM:</span><br /> {wfhAM.join(", ")}<br />
                          </Typography>
                          <Typography variant="subtitle2" style={{ marginTop: "8px" }}>
                            <span style={{ textDecoration: "underline" }}>WFH PM:</span><br /> {wfhPM.join(", ")}<br />
                          </Typography>
                        </div>
                      );
                    } else if (wfhAM.length > 0) {
                      return (
                        <div>
                          <Typography variant="subtitle2">{wfhRegular.join(", ")}<br /></Typography>
                          <Typography variant="subtitle2" style={{ marginTop: "8px" }}>
                            <span style={{ textDecoration: "underline" }}>WFH AM:</span><br /> {wfhAM.join(", ")}<br />
                          </Typography>
                        </div>
                      );
                    } else if (wfhPM.length > 0) {
                      return (
                        <div>
                          <Typography variant="subtitle2">{wfhRegular.join(", ")}<br /></Typography>
                          <Typography variant="subtitle2" style={{ marginTop: "8px" }}>
                            <span style={{ textDecoration: "underline" }}>WFH PM:</span><br /> {wfhPM.join(", ")}<br />
                          </Typography>
                        </div>
                      );
                    } else {
                      return <Typography variant="subtitle2"></Typography>;
                    }
                  };

                  return (
                    <TableRow key={role}>
                      <TableCell sx={{ width: "16.66%" }}>{role}</TableCell>
                      <TableCell sx={{ width: "41.67%" }}>{(roleSchedule["In office"] || []).join(", ")}</TableCell>
                      <TableCell sx={{ width: "41.67%" }}>{renderWFHCell()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      );
    });
  };

  const renderMobileCards = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const allDepartments = schedules?.[dateKey];

    if (!allDepartments) {
      return <Typography>No schedules available for this date.</Typography>;
    }

    const filteredDepartments = Object.keys(allDepartments)
    .filter((department) => department !== "CEO")
    .reduce((acc, department) => {
      acc[department] = allDepartments[department];
      return acc;
    }, {});

    return Object.keys(filteredDepartments).map((department) => {
      const departmentSchedules = filteredDepartments[department];
      const filteredSchedules = selectedRole
        ? { [selectedRole]: departmentSchedules[selectedRole] }
        : departmentSchedules;

      if (!filteredSchedules || Object.keys(filteredSchedules).length === 0) {
        return null;
      }

      return (
        <div key={department} style={{ marginBottom: "30px" }}>
          <Typography variant="h5" gutterBottom>
            {department} Department
          </Typography>
          {Object.keys(filteredSchedules).map((role) => {
            const roleSchedule = filteredSchedules[role];

            const renderWFHText = () => {
              const wfhRegular = roleSchedule["Work from home"] || [];
              const wfhAM = roleSchedule["Work from home (AM)"] || [];
              const wfhPM = roleSchedule["Work from home (PM)"] || [];

              if (wfhRegular.length > 0 && wfhAM.length === 0 && wfhPM.length === 0) {
                return wfhRegular.join(", ");
              } else if (wfhAM.length > 0 && wfhPM.length > 0) {
                return `WFH Regular: ${wfhRegular.join(", ")}\nWFH AM: ${wfhAM.join(", ")}\nWFH PM: ${wfhPM.join(", ")}`;
              } else if (wfhAM.length > 0) {
                return `WFH Regular: ${wfhRegular.join(", ")}\nWFH AM: ${wfhAM.join(", ")}`;
              } else if (wfhPM.length > 0) {
                return `WFH Regular: ${wfhRegular.join(", ")}\nWFH PM: ${wfhPM.join(", ")}`;
              } else {
                return "";
              }
            };

            return (
              <Card key={role} style={{ marginBottom: "15px" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {role}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>In Office: </strong>
                    {(roleSchedule["In office"] || []).join(", ")}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Work from Home: </strong>
                    {renderWFHText()}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    });
  };

  return (
    <Container>
      <TextField
        type="date"
        value={selectedDate.format("YYYY-MM-DD")}
        onChange={handleDateChange}
        style={{ marginBottom: "20px" }}
      />

      {/* Department Filter */}
      <FormControl fullWidth style={{ marginBottom: "20px" }}>
        <InputLabel id="department-select-label">Select Department</InputLabel>
        <Select
          labelId="department-select-label"
          value={departmentName}
          onChange={handleDepartmentChange}
        >
          <MenuItem value="">
            <em>All Departments</em>
          </MenuItem>
          {departments
            .filter((dept) => dept !== "CEO")   
            .map((dept) => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Role Filter */}
      <FormControl fullWidth style={{ marginBottom: "20px" }}>
        <InputLabel id="role-select-label">Select Role</InputLabel>
        <Select
          labelId="role-select-label"
          value={selectedRole}
          onChange={handleRoleChange}
          disabled={!departmentName} // Disable if no department is selected
        >
          <MenuItem value="">
            <em>All Roles</em>
          </MenuItem>
          {roles.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? <CircularProgress /> : isMobile ? renderMobileCards() : renderTable()}
    </Container>
  );
};

export default SchedulePage;
