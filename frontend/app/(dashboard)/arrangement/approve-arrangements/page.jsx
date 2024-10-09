"use client";

import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Select, MenuItem, Divider, Box, Stack } from '@mui/material';
import { format } from 'date-fns';

const RequestGroupsPage = ({ data }) => {
  const [sortBy, setSortBy] = useState('request_created_date');
  const [requestGroups, setRequestGroups] = useState(data.request_groups);

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

  return (
    <Box p={2}>
      {/* Sorting Options */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Arrangement Requests</Typography>
        <Select value={sortBy} onChange={handleSortChange}>
          <MenuItem value="request_created_date">Sort by Creation Date</MenuItem>
          <MenuItem value="arrangement_requests.0.start_date">Sort by Request Date</MenuItem>
        </Select>
      </Box>

      {/* Request Group Cards */}
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
              width: '100%',  // Make each card take up full width of its container
            }}
          >
            {/* Header with Staff Info */}
            <CardContent>
              <Typography variant="h6">
                {group.staff.staff_fname} {group.staff.staff_lname}
              </Typography>
              <Typography variant="body2" color="textSecondary">{group.staff.dept}  - {group.staff.position}</Typography>
              <Typography variant="body2" color="textSecondary">
                Created on: {format(new Date(group.request_created_date), 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2">Number of Requests: {group.arrangement_requests.length}</Typography>

              {/* Arrangement Requests */}
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

              {/* Action Buttons */}
              <Box mt={2} display="flex" justifyContent="space-between">
                {group.arrangement_requests.length > 1 ? (
                  <>
                    <Button variant="contained" color="primary" size="small" onClick={() => handleApproveAll(group.request_group_id)}>
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

// Example Data
const data = {
  manager_id: 101,
  request_groups: [
    {
      request_group_id: 1,
      staff: {
        staff_id: 1,
        staff_fname: 'Test1',
        staff_lname: 'User',
        dept: 'Department1',
        position: 'Position1',
      },
      request_created_date: '2024-09-15',
      arrangement_requests: [
        {
          arrangement_id: 1001,
          session_type: 'Work from Home',
          start_date: '2024-10-01',
          description: 'Request to work from home due to personal reasons',
          request_status: 'Pending',
          updated_at: '2024-09-16',
        },
        {
          arrangement_id: 1002,
          session_type: 'Work from Home',
          start_date: '2024-10-02',
          description: 'Vacation leave for 5 days',
          request_status: 'Pending',
          updated_at: '2024-09-10',
        },
      ],
    },
    {
      request_group_id: 2,
      staff: {
        staff_id: 2,
        staff_fname: 'Test1',
        staff_lname: 'User',
        dept: 'Department1',
        position: 'Position1',
      },
      request_created_date: '2024-09-10',
      arrangement_requests: [
        {
          arrangement_id: 1003,
          session_type: 'Remote Work',
          start_date: '2024-09-22',
          description: 'Work from home due to health issues',
          request_status: 'Pending',
          updated_at: '2024-09-18',
        },
      ],
    },
    {
      request_group_id: 3,
      staff: {
        staff_id: 3,
        staff_fname: 'Test1',
        staff_lname: 'User',
        dept: 'Department1',
        position: 'Position2',
      },
      request_created_date: '2024-09-08',
      arrangement_requests: [
        {
          arrangement_id: 1004,
          session_type: 'Remote Work',
          start_date: '2024-09-19',
          description: 'Work from home due to family emergency',
          request_status: 'Pending',
          updated_at: '2024-09-10',
        },
      ],
    },
  ],
};

export default function App() {
  return <RequestGroupsPage data={data} />;
}
