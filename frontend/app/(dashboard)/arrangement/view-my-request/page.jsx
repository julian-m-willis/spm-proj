"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Box,
  Stack,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import { useSession } from "next-auth/react";
import axios from "axios";
import dayjs from "dayjs";

export default function ViewOwnSchedulePage() {
  const [requests, setRequests] = useState({ pending: [], approved: [] });
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { data: session } = useSession();
  const today = dayjs(); // For past arrangement validation

  // Fetch pending and approved requests from the API
  const fetchRequests = async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      const existingRequests = await db.ArrangementRequest.findAll({
        include: [
          {
            model: db.RequestGroup,
            where: { staff_id: arrangementData.staff_id },
          },
        ],
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn('DATE', sequelize.col('start_date')), '=', arrangementData.start_date),  // Compare only the date part
            { request_status: ['Pending', 'Approved'] },  // Check for Pending and Approved requests
          ],
        },
      });

      setRequests({
        pending: existingRequests.filter((request) => request.request_status === "Pending"),
        approved: existingRequests.filter((request) => request.request_status === "Approved"),
      });
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  // Create new arrangement and handle errors
  const createArrangement = async (arrangementData) => {
    try {
      const response = await axios.post("/api/arrangements", arrangementData);
      alert(response.data.message); // Success message
      fetchRequests(); // Refresh the requests list
    } catch (err) {
      console.error("Error creating arrangement:", err);
      setError(err.response?.data?.message || "Failed to create arrangement.");
    }
  };

  // Fetch data when session is available
  useEffect(() => {
    if (session?.user) {
      fetchRequests(); // Fetch the requests after session is available
    }
  }, [session]);

  // Open confirmation dialog for withdrawal
  const handleWithdrawClick = (groupId, arrangementId, requestStatus, startDate) => {
    if ((requestStatus === "Approved" || requestStatus === "Pending") && dayjs(startDate).isAfter(today)) {
      setSelectedRequest({ groupId, arrangementId });
      setOpenDialog(true);
    } else {
      setError("Cannot withdraw past or non-pending/non-approved arrangements.");
    }
  };

  // Close confirmation dialog
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
  };

  // Confirm withdrawal request
  const handleWithdrawConfirm = async () => {
    try {
      await axios.delete(`/api/arrangements/${selectedRequest.arrangementId}`, {
        headers: { Authorization: `Bearer ${session?.user?.token}` },
      });
      fetchRequests(); // Refresh after withdrawal
      handleDialogClose();
    } catch (err) {
      console.error("Error withdrawing request:", err);
      setError("Failed to withdraw request.");
    }
  };

  const handleCommentChange = (arrangementId, event) => {
    setComments((prev) => ({
      ...prev,
      [arrangementId]: event.target.value,
    }));
  };

  const RequestList = ({ title, requestGroups }) => (
    <>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={3}>
        {loading ? (
          <CircularProgress />
        ) : requestGroups.length > 0 ? (
          requestGroups.map((group) => (
            <Card key={group.request_group_id} sx={{ display: "flex", flexDirection: "column", borderRadius: 2, boxShadow: 3, p: 2, width: "100%" }}>
              <CardContent>
                <Typography variant="h6">
                  {group.staff.staff_fname} {group.staff.staff_lname}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {group.staff.dept} - {group.staff.position}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Created on: {dayjs(group.request_created_date).format("DD/MM/YYYY")}
                </Typography>
                <Stack spacing={2} mt={2}>
                  {group.arrangement_requests.map((request) => (
                    <Box key={request.arrangement_id}>
                      <Typography>
                        Start Date: {dayjs(request.start_date).format("DD/MM/YYYY")}
                      </Typography>
                      <Typography>Session Type: {request.session_type || "N/A"}</Typography>
                      <Typography color="green">
                        Status: {request.request_status}
                      </Typography>

                      {request.request_status === "Pending" && (
                        <>
                          <TextField
                            label="Reason for Withdrawal"
                            multiline
                            rows={2}
                            variant="outlined"
                            fullWidth
                            value={comments[request.arrangement_id] || ""}
                            onChange={(event) => handleCommentChange(request.arrangement_id, event)}
                            sx={{ mt: 1 }}
                          />
                          <Divider sx={{ my: 2 }} />
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => handleWithdrawClick(group.request_group_id, request.arrangement_id, request.request_status, request.start_date)}
                          >
                            Withdraw
                          </Button>
                        </>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography>No {title.toLowerCase()} requests available.</Typography>
        )}
      </Stack>
    </>
  );

  return (
    <Box p={2}>
      <RequestList title="Pending Requests" requestGroups={requests.pending} />
      <RequestList title="Approved Requests" requestGroups={requests.approved} />

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Confirm Withdrawal</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to withdraw this request? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleWithdrawConfirm} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
    </Box>
  );
}
