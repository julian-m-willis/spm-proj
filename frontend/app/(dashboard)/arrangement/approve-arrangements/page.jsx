"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  Divider,
  Box,
  Stack,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { FormControlLabel } from "@mui/material";

const RequestGroupsPage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [sortBy, setSortBy] = useState("request_created_date");
  const [requestGroups, setRequestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [actionStatus, setActionStatus] = useState({});
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [selectedRequests, setSelectedRequests] = useState({});

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  const fetchData = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Fetch error:", response);
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log(data);
      setRequestGroups(data.request_groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSort = (sortField) => {
    const sortedGroups = [...requestGroups].sort((a, b) => {
      const firstDate = new Date(a[sortField]);
      const secondDate = new Date(b[sortField]);
      return firstDate - secondDate;
    });
    setRequestGroups(sortedGroups);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    handleSort(event.target.value);
  };

  // Handle approval
  const handleApprove = async (groupId) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/approve/${groupId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestGroupId: groupId }),
      });

      if (!response.ok) throw new Error("Failed to approve the request");
      updateGroupStatus(groupId, "Approved");
      setActionStatus((prev) => ({
        ...prev,
        [groupId]: "approved",
      }));
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  // Handle rejection - opens the rejection dialog
  const handleRejectOpen = (groupId) => {
    setSelectedGroupId(groupId);
    setOpenRejectDialog(true);
  };

  const handleRejectClose = () => {
    setOpenRejectDialog(false);
    setRejectComment("");
    setSelectedGroupId(null);
  };

  // Handle rejection with comment
  const handleReject = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/reject/${selectedGroupId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestGroupId: selectedGroupId,
          comment: rejectComment,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject the request");
      updateGroupStatus(selectedGroupId, "Rejected");
      setActionStatus((prev) => ({
        ...prev,
        [selectedGroupId]: "rejected",
      }));

      handleRejectClose();
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  // Undo action
  const handleUndo = async (groupId) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/undo/${groupId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestGroupId: groupId }),
      });

      if (!response.ok) throw new Error("Failed to undo the request");

      updateGroupStatus(groupId, "Pending");
      setActionStatus((prev) => ({
        ...prev,
        [groupId]: null,
      }));
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  const updateGroupStatus = (groupId, newStatus) => {
    setRequestGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.request_group_id === groupId
          ? {
              ...group,
              arrangement_requests: group.arrangement_requests.map(
                (request) => ({
                  ...request,
                  request_status: newStatus,
                })
              ),
            }
          : group
      )
    );
  };

  const handleToggleSelect = (arrangementId) => {
    setSelectedRequests((prev) => ({
      ...prev,
      [arrangementId]: !prev[arrangementId], // Toggle the selection state for the given arrangement ID
    }));
  };

  const handleBatchApproveSelected = async (groupId) => {
    const selectedIds = Object.keys(selectedRequests).filter(
      (id) => selectedRequests[id]
    );

    if (selectedIds.length === 0) {
      alert("No requests selected for approval.");
      return;
    }

    try {
      const data = selectedIds.reduce((acc, id) => {
        acc[id] = "Approved"; // Set the status to "Approved" for each selected request
        return acc;
      }, {});

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/approve_partial/${groupId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // Ensure `token` is defined in your component
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data }), // Send the data object as the request body
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve selected requests");
      }

      // Optionally, update the UI or state to reflect the change
      updateGroupStatus(groupId, "Partially Approved");

      alert("Selected requests approved successfully.");
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Arrangement Requests</Typography>
        <Select value={sortBy} onChange={handleSortChange}>
          <MenuItem value="request_created_date">
            Sort by Creation Date
          </MenuItem>
          <MenuItem value="arrangement_requests.0.start_date">
            Sort by Request Date
          </MenuItem>
        </Select>
      </Box>

      <Stack spacing={3}>
        {requestGroups.map((group) => (
          <Card
            key={group.request_group_id}
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              boxShadow: 3,
              p: 2,
              width: "100%",
            }}
          >
            <CardContent>
              <Typography variant="h6" align="right">
                {group.arrangement_requests[0].request_status}
              </Typography>
              <Typography variant="h6">
                {group.staff.staff_fname} {group.staff.staff_lname}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {group.staff.dept} - {group.staff.position}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Created on:{" "}
                {format(new Date(group.request_created_date), "dd/MM/yyyy")}
              </Typography>
              <Typography variant="body2">
                Number of Requests: {group.arrangement_requests.length}
              </Typography>

              <Stack spacing={1} mt={2}>
                {group.arrangement_requests
                  .sort(
                    (a, b) => new Date(a.start_date) - new Date(b.start_date)
                  ) // Sort by date
                  .map((request) => (
                    <Box key={request.arrangement_id}>
                      <Typography>
                        Start Date:{" "}
                        {format(new Date(request.start_date), "dd/MM/yyyy")}
                      </Typography>
                      <Typography>
                        Session Type: {request.session_type}
                      </Typography>
                      <Typography color="green">
                        Status: {request.request_status}
                      </Typography>
                      <Divider sx={{ my: 1 }} />

                      {/* Toggle button for batch processing only */}
                      {group.arrangement_requests.length > 1 && (
                        <FormControlLabel
                          control={
                            <Switch
                              disabled={
                                group.arrangement_requests[0].request_status !==
                                "Pending"
                              }
                              checked={
                                !!selectedRequests[request.arrangement_id]
                              }
                              onChange={() =>
                                handleToggleSelect(request.arrangement_id)
                              }
                            />
                          }
                          label="Approve"
                        />
                      )}
                    </Box>
                  ))}
              </Stack>

              <Box mt={2} display="flex" justifyContent="space-between">
                {/* Adhoc application buttons */}
                {group.arrangement_requests.length === 1 ? (
                  <>
                    {group.arrangement_requests[0].request_status ===
                      "Pending" && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleApprove(group.request_group_id)}
                      >
                        Approve
                      </Button>
                    )}
                    {group.arrangement_requests[0].request_status ===
                      "Pending" && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleRejectOpen(group.request_group_id)}
                      >
                        Reject
                      </Button>
                    )}
                    {(group.arrangement_requests[0].request_status ===
                      "Approved" ||
                      group.arrangement_requests[0].request_status ===
                        "Rejected") && (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => handleUndo(group.request_group_id)}
                      >
                        Undo
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Batch application buttons */}
                    {group.arrangement_requests.some(
                      (request) => request.request_status === "Pending"
                    ) && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleApprove(group.request_group_id)}
                      >
                        Approve All
                      </Button>
                    )}
                    {group.arrangement_requests.some(
                      (request) => request.request_status === "Pending"
                    ) && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleRejectOpen(group.request_group_id)}
                      >
                        Reject All
                      </Button>
                    )}
                    {group.arrangement_requests.some(
                      (request) =>
                        request.request_status === "Approved" ||
                        request.request_status === "Rejected" ||
                        request.request_status === "Partially Approved"
                    ) && (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => handleUndo(group.request_group_id)}
                      >
                        Undo All
                      </Button>
                    )}
                    {group.arrangement_requests.some(
                      (request) => request.request_status === "Pending"
                    ) && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() =>
                          handleBatchApproveSelected(group.request_group_id)
                        }
                      >
                        Approve Selected
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Rejection Comment Dialog */}
      <Dialog open={openRejectDialog} onClose={handleRejectClose}>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Comment"
            type="text"
            fullWidth
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleReject} color="primary">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestGroupsPage;
