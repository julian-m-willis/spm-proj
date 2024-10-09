"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, Select, MenuItem, Divider, Box, Stack } from '@mui/material';
import { format } from 'date-fns';
import { useSession } from "next-auth/react";

const RequestGroupsPage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [sortBy, setSortBy] = useState('request_created_date');
  const [requestGroups, setRequestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    }
  }, [session]);

  const fetchData = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/arrangements/manager/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Fetch error:', response);
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log(data);
      setRequestGroups(data.request_groups || []); // Use fallback to avoid undefined
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when token is set
  useEffect(() => {
    fetchData();
  }, [token]);

  // Sorting Logic
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

  const handleApprove = (groupId) => {
    console.log(`Approved group ID: ${groupId}`);
  };

  const handleReject = (groupId) => {
    console.log(`Rejected group ID: ${groupId}`);
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

      <Stack spacing={3}>
        {requestGroups.map((group) => (
          <Card
            key={group.request_group_id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              boxShadow: 3,
              p: 2,
              width: '100%',
            }}
          >
            <CardContent>
              <Typography variant="h6">
                {group.staff.staff_fname} {group.staff.staff_lname}
              </Typography>
              <Typography variant="body2" color="textSecondary">{group.staff.dept} - {group.staff.position}</Typography>
              <Typography variant="body2" color="textSecondary">
                Created on: {format(new Date(group.request_created_date), 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2">Number of Requests: {group.arrangement_requests.length}</Typography>

              <Stack spacing={1} mt={2}>
                {group.arrangement_requests.slice(0, 1).map((request) => (
                  <Box key={request.arrangement_id}>
                    <Typography>
                      Start Date: {format(new Date(request.start_date), 'dd/MM/yyyy')}
                    </Typography>
                    <Typography>
                      Session Type: {request.session_type}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </Stack>

              <Box mt={2} display="flex" justifyContent="space-between">
                {group.arrangement_requests.length > 1 ? (
                  <>
                    <Button variant="contained" color="primary" size="small" onClick={() => handleApprove(group.request_group_id)}>
                      Approve All
                    </Button>
                    <Button variant="contained" color="primary" size="small" onClick={() => handleViewDetails(group.request_group_id)}>
                      View Details
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" color="primary" size="small" onClick={() => handleApprove(group.request_group_id)}>
                    Approve
                  </Button>
                )}
                <Button variant="contained" color="secondary" size="small" onClick={() => handleReject(group.request_group_id)}>
                  Reject
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default function App() {
  return <RequestGroupsPage />;
}
