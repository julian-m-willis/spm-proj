"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function HomePage() {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    waitingApproval: 0,
    notifications: 0,
  });

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const [pendingRes, approvalRes, notificationsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/arrangements/staff/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notification/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const filteredRequests = pendingRes.data.request_groups.filter(
          (group) => {
            const status = group.arrangement_requests[0].request_status.toLowerCase();
            return status === "pending";
          }
        );

        const unreadNotif = notificationsRes.data.filter(
          (group) => {
            const status = group.status;
            return status === "unread";
          }
        );

        setStats({
          pendingRequests: filteredRequests?.length || 0,
          waitingApproval: approvalRes?.data?.request_groups?.length || 0,
          notifications: unreadNotif?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [token]);

  const statsWithIcons = [
    {
      title: "Pending Requests",
      count: stats.pendingRequests,
      icon: <AssignmentIcon fontSize="large" />,
      link: "/arrangement/view-my-request",
    },
    ...(session?.user?.roles === 1 || session?.user?.roles === 3
      ? [
          {
            title: "Waiting Approval",
            count: stats.waitingApproval,
            icon: <AccessTimeIcon fontSize="large" />,
            link: "/arrangement/approve-arrangements",
          },
        ]
      : []),
    {
      title: "Unread Notifications",
      count: stats.notifications,
      icon: <NotificationsActiveIcon fontSize="large" />,
      link: "/notifications",
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, mt: 4 }}>
      {/* Welcome Message */}
      <Typography variant="h4" align="center" gutterBottom>
        Welcome, {session?.user?.name || "User"}!
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="textSecondary"
        gutterBottom
      >
        Here is your dashboard overview.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={4}>
        {statsWithIcons.map((stat, index) => (
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, lg: "grow", height: "100%" }}
          >
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                padding: 2,
                width: "100%",
                height: "100%",
              }}
            >
              <Avatar sx={{ bgcolor: "primary.main", marginRight: 2 }}>
                {stat.icon}
              </Avatar>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  <Link href={stat.link}>{stat.title}</Link>
                </Typography>
                <Typography variant="h4" color="textPrimary">
                  {stat.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
