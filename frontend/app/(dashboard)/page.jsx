import * as React from "react";
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
import { auth } from "../../auth";

export default async function HomePage() {
  // Fetch session data from the server
  const session = await auth();

  // Example of some static data to render, you can replace this with dynamic data
  const stats = [
    { title: "Pending Tasks", count: 5, icon: "assignment", link: "#" },
    { title: "Pending Tasks", count: 5, icon: "assignment", link: "#" },
    { title: "Notifications", count: 8, icon: "notifications_active", link: "#" },
  ];

  const statsWithIcons = stats.map((stat) => ({
    ...stat,
    icon:
      stat.icon === "assignment" ? (
        <AssignmentIcon fontSize="large" />
      ) : stat.icon === "access_time" ? (
        <AccessTimeIcon fontSize="large" />
      ) : (
        <NotificationsActiveIcon fontSize="large" />
      ),
  }));

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
            size={{ xs: 12, md: "grow" }}
          >
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                padding: 2,
                width: "100%",
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

      {/* Recent Activity Section */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activities
        </Typography>
        <Paper elevation={3} sx={{ padding: 3 }}>
        </Paper>
      </Box>
    </Box>
  );
}
