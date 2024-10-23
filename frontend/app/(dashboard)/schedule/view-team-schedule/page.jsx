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
  List,
  ListItem,
  ListItemText,
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
  const isMobile = useMediaQuery("(max-width:600px)");

  // Effect to handle session changes
  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
      setDepartmentName(session.user.dept);
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
          `${process.env.NEXT_PUBLIC_API_URL}/schedules/staff/team/?start_date=${formattedDate}&end_date=${formattedDate}`,
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
  }, [selectedDate, departmentName, token]);

  // Get unique roles from schedules
  const roles = schedules
    ? Object.keys(
        schedules[selectedDate.format("YYYY-MM-DD")]?.[departmentName] || {}
      )
    : [];

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(dayjs(event.target.value));
    setSelectedRole(""); // Reset selected role when date changes
  };

  const renderMobileCards = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const departmentSchedules = schedules?.[dateKey]?.[departmentName];

    if (!departmentSchedules) {
      return (
        <Typography>
          No schedules available for this date and department.
        </Typography>
      );
    }

    const filteredSchedules = selectedRole
      ? { [selectedRole]: departmentSchedules[selectedRole] }
      : departmentSchedules;

    if (!filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      return (
        <Typography>
          No schedules available for this date, department, and role.
        </Typography>
      );
    }

    return (
      <>
        {Object.keys(filteredSchedules).map((role) => {
          const roleSchedule = filteredSchedules[role];
          return (
            <Card key={role} style={{ marginBottom: "15px" }}>
              <CardContent>
                <Typography variant="h6">{role}</Typography>
                {roleSchedule["In office"] &&
                  roleSchedule["In office"].length > 0 && (
                    <div>
                      <Typography
                        variant="h7"
                        style={{ textDecoration: "underline" }}
                      >
                        In office:
                        <br />
                      </Typography>
                      <Typography variant="body2">
                        {roleSchedule["In office"].join(", ")}
                      </Typography>
                    </div>
                  )}

                {roleSchedule["Work from home"] &&
                  roleSchedule["Work from home"].length > 0 && (
                    <div>
                      <br />
                      <Typography
                        variant="h7"
                        style={{ textDecoration: "underline" }}
                      >
                        Work from home:
                        <br />
                      </Typography>
                      <Typography variant="body2">
                        {roleSchedule["Work from home"].join(", ")}
                      </Typography>
                    </div>
                  )}

                {roleSchedule["Work from home (AM)"] &&
                  roleSchedule["Work from home (AM)"].length > 0 && (
                    <div>
                      <br />
                      <Typography
                        variant="h7"
                        style={{ textDecoration: "underline" }}
                      >
                        Work from home (AM):
                        <br />
                      </Typography>
                      <Typography variant="body2">
                        {roleSchedule["Work from home (AM)"].join(", ")}
                      </Typography>
                    </div>
                  )}

                {roleSchedule["Work from home (PM)"] &&
                  roleSchedule["Work from home (PM)"].length > 0 && (
                    <div>
                      <br />
                      <Typography
                        variant="h7"
                        style={{ textDecoration: "underline" }}
                      >
                        Work from home (PM):
                        <br />
                      </Typography>
                      <Typography variant="body2">
                        {roleSchedule["Work from home (PM)"].join(", ")}
                      </Typography>
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </>
    );
  };

  const renderTable = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const departmentSchedules = schedules?.[dateKey]?.[departmentName];

    if (!departmentSchedules) {
      return (
        <Typography>
          No schedules available for this date and department.
        </Typography>
      );
    }

    const filteredSchedules = selectedRole
      ? { [selectedRole]: departmentSchedules[selectedRole] }
      : departmentSchedules;

    if (!filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      return (
        <Typography>
          No schedules available for this date, department, and role.
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "50%", fontWeight: "bold" }}>
                In Office
              </TableCell>{" "}
              {/* 5/12 grid */}
              <TableCell sx={{ width: "50%", fontWeight: "bold" }}>
                Work from Home
              </TableCell>{" "}
              {/* 5/12 grid */}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(filteredSchedules).map((role) => {
              const roleSchedule = filteredSchedules[role];

              const renderWFHCell = () => {
                const wfhRegular = roleSchedule["Work from home"] || [];
                const wfhAM = roleSchedule["Work from home (AM)"] || [];
                const wfhPM = roleSchedule["Work from home (PM)"] || [];

                if (
                  wfhRegular.length > 0 &&
                  wfhAM.length === 0 &&
                  wfhPM.length === 0
                ) {
                  return (
                    <Typography variant="subtitle2">
                      {wfhRegular.join(", ")}
                    </Typography>
                  );
                } else if (wfhAM.length > 0 && wfhPM.length > 0) {
                  return (
                    <div>
                      <Typography variant="subtitle2">
                        {wfhRegular.join(", ")}
                        <br />
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        style={{ marginTop: "8px" }}
                      >
                        <span style={{ textDecoration: "underline" }}>
                          WFH AM:
                        </span>
                        <br /> {wfhAM.join(", ")}
                        <br />
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        style={{ marginTop: "8px" }}
                      >
                        <span style={{ textDecoration: "underline" }}>
                          WFH PM:
                        </span>
                        <br /> {wfhPM.join(", ")}
                        <br />
                      </Typography>
                    </div>
                  );
                } else if (wfhAM.length > 0) {
                  return (
                    <div>
                      <Typography variant="subtitle2">
                        {wfhRegular.join(", ")}
                        <br />
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        style={{ marginTop: "8px" }}
                      >
                        <span style={{ textDecoration: "underline" }}>
                          WFH AM:
                        </span>
                        <br /> {wfhAM.join(", ")}
                        <br />
                      </Typography>
                    </div>
                  );
                } else if (wfhPM.length > 0) {
                  return (
                    <div>
                      <Typography variant="subtitle2">
                        {wfhRegular.join(", ")}
                        <br />
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        style={{ marginTop: "8px" }}
                      >
                        <span style={{ textDecoration: "underline" }}>
                          WFH PM:
                        </span>
                        <br /> {wfhPM.join(", ")}
                        <br />
                      </Typography>
                    </div>
                  );
                } else {
                  return <Typography variant="subtitle2"></Typography>;
                }
              };

              return (
                <TableRow key={role}>
                  <TableCell sx={{ width: "50%" }}>
                    {(roleSchedule["In office"] || []).join(", ")}
                  </TableCell>{" "}
                  {/* 5/12 grid */}
                  <TableCell sx={{ width: "50%" }}>
                    {renderWFHCell()}
                  </TableCell>{" "}
                  {/* 5/12 grid */}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container>
      <TextField
        type="date"
        value={selectedDate.format("YYYY-MM-DD")}
        onChange={handleDateChange}
        style={{ marginBottom: "20px" }}
      />

      {loading ? (
        <CircularProgress />
      ) : isMobile ? (
        renderMobileCards()
      ) : (
        renderTable()
      )}
    </Container>
  );
};

export default SchedulePage;
