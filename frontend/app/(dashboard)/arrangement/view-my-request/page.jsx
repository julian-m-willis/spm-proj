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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

const RequestGroupsPage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [sortBy, setSortBy] = useState("request_created_date");
  const [filterByStatus, setFilterByStatus] = useState("all");
  const [requestGroups, setRequestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [withdrawComment, setWithdrawComment] = useState("");

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    }
  }, [session]);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/staff/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setRequestGroups(data.request_groups || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterByStatus(event.target.value);
  };

  // Define an order for "Show All" filter: "Pending" > "Approved" > "Revoked" > "Withdrawn"
  const statusOrder = { pending: 1, approved: 2, revoked: 3, withdrawn: 4 };

  const filteredRequests = requestGroups
  .filter((group) => {
    const status = group.arrangement_requests[0].request_status.toLowerCase();

    if (filterByStatus === "all") return true;
    if (filterByStatus === "pending") return status === "pending";
    if (filterByStatus === "active") return status === "approved";
    if (filterByStatus === "history") return ["withdrawn", "completed", "revoked", "rejected"].includes(status);

    return false;
  })
  .sort((a, b) => {
    // Sort based on 'sortBy' selection: either by 'request_created_date' or 'start_date'
    const dateA = new Date(
      sortBy === "request_created_date"
        ? a.request_created_date
        : a.arrangement_requests[0].start_date
    );
    const dateB = new Date(
      sortBy === "request_created_date"
        ? b.request_created_date
        : b.arrangement_requests[0].start_date
    );

    return dateB - dateA; // Sort in descending order
  });

  const openWithdrawDialog = (groupId) => {
    setSelectedGroupId(groupId);
    setOpenDialog(true);
  };

  const closeWithdrawDialog = () => {
    setOpenDialog(false);
    setSelectedGroupId(null);
  };

  const confirmWithdraw = async () => {
    if (!selectedGroupId) return;
  
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/arrangements/staff/withdraw/${selectedGroupId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: withdrawComment }), // Include comment
      });
  
      if (!response.ok) throw new Error("Failed to withdraw the request");
  
      // Update the request status in local state
      updateGroupStatus(selectedGroupId, "Withdrawn");
      closeWithdrawDialog();
    } catch (err) {
      console.error(err.message);
      setError(err.message);
      closeWithdrawDialog();
    }
  };

  const updateGroupStatus = (groupId, newStatus) => {
    setRequestGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.request_group_id === groupId
          ? {
              ...group,
              arrangement_requests: group.arrangement_requests.map((request) => ({
                ...request,
                request_status: newStatus,
              })),
            }
          : group
      )
    );
  };
  

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Arrangement Requests</Typography>
        <Select value={sortBy} onChange={handleSortChange}>
          <MenuItem value="request_created_date">Sort by Creation Date</MenuItem>
          <MenuItem value="arrangement_requests.0.start_date">Sort by Request Date</MenuItem>
        </Select>
      </Box>

      <Box display="flex" justifyContent="space-between" mb={3}>
        <Select value={filterByStatus} onChange={handleFilterChange}>
          <MenuItem value="all">Show All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="history">History</MenuItem>
        </Select>
      </Box>

      <Stack spacing={3}>
        {filteredRequests.map((group) => (
          <Card key={group.request_group_id} sx={{ display: "flex", flexDirection: "column", borderRadius: 2, boxShadow: 3, p: 2, width: "100%" }}>
            <CardContent>
              <Typography variant="h6" align="right">{group.arrangement_requests[0].request_status}</Typography>
              <Typography variant="body2" color="textSecondary">Created on: {format(new Date(group.request_created_date), "dd/MM/yyyy")}</Typography>
              <Typography variant="body2">Number of Requests: {group.arrangement_requests.length}</Typography>

              <Stack spacing={1} mt={2}>
                {group.arrangement_requests.slice(0, 1).map((request) => (
                  <Box key={request.arrangement_id}>
                    <Typography>Start Date: {format(new Date(request.start_date), "dd/MM/yyyy")}</Typography>
                    <Typography>Session Type: {request.session_type}</Typography>
                    <Typography>Comment: {request.approval_comment}</Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </Stack>

              <Box mt={2} display="flex" justifyContent="space-between">
                {(group.arrangement_requests[0].request_status === "Approved" || group.arrangement_requests[0].request_status === "Pending") && (
                  <Button variant="contained" color="primary" size="small" onClick={() => openWithdrawDialog(group.request_group_id)}>
                    Withdraw
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Confirmation Dialog for Withdrawal */}
      <Dialog open={openDialog} onClose={closeWithdrawDialog}>
        <DialogTitle>Confirm Withdrawal</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to withdraw this request?</Typography>
          <TextField
            label="Optional Comment" 
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={withdrawComment}
            onChange={(e) => setWithdrawComment(e.target.value)}
            sx={{ mt: 2 }}
          />          
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWithdrawDialog} color="primary">Cancel</Button>
          <Button onClick={confirmWithdraw} color="secondary" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestGroupsPage;
