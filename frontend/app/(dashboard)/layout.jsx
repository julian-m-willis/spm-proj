"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

// MUI Components
import Snackbar from "@mui/material/Snackbar";
import { ListItemButton, Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";

export default function Layout(props) {
  const maxNotificationsToDisplay = 5;
  const router = useRouter();
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0); // Current notification count
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0); // Previous notification count
  const [notifications, setNotifications] = useState([]); // Store all notifications
  const [openSnackbar, setOpenSnackbar] = useState(false); // State to control Snackbar visibility
  const [snackbarMessage, setSnackbarMessage] = useState(""); // State for the Snackbar message
  const [anchorEl, setAnchorEl] = useState(null); // State for Popover

  useEffect(() => {
    if (session?.user) {
      setToken(session.user?.token);
    } else {
      window.location.reload(); // Reload the page if session data is missing
    }
  }, [session]);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const notificationResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/notification/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const notificationsData = notificationResponse.data;
        const unreadCount = notificationsData.filter(
          (n) => n.status === "unread"
        ).length;

        // Compare with the previous count and only show the Snackbar if the new count is higher
        if (unreadCount > previousNotificationCount) {
          setSnackbarMessage(
            `You have ${unreadCount - previousNotificationCount} new notification(s).`
          );
          setOpenSnackbar(true); // Show the Snackbar
        }

        // Update the previous notification count to the current count after comparison
        setPreviousNotificationCount(unreadCount);

        // Update the notification count and store notifications
        setNotificationCount(unreadCount);
        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Fetch notifications immediately when the component mounts
    fetchNotifications();

    // Set up polling to fetch notifications every 3 seconds
    const interval = setInterval(fetchNotifications, 3000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [token, previousNotificationCount]); // Track token and previousNotificationCount

  // Handle closing of the Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Open the Popover when notification icon or Snackbar is clicked
  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget); // Anchor the popover to the clicked element
  };

  // Close the Popover
  const handleClosePopover = () => {
    setAnchorEl(null); // Close the popover
  };

  const isPopoverOpen = Boolean(anchorEl); // Determine if Popover is open

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/notification/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update notifications to mark all as "read"
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        status: "read",
      }));
      setNotifications(updatedNotifications);
      setNotificationCount(0); // Reset notification count to 0
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  const handleMarkAsRead = async (notificationId) => {
    try {
      // API call to mark notification as read
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/notification/mark-read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update the local state to reflect the read status
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, status: "read" }
          : notification
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  const handleNotificationClickType = (notification) => {
    handleMarkAsRead(notification.id);
    handleClosePopover();
    switch (notification.type) {
      case "New WFH Request":
        router.push("/arrangement/approve-arrangements"); // Navigate to the WFH Request page
        break;
      case "WFH Approved":
        router.push("/schedule/view-own-schedule"); // Navigate to the View My Request page
        break;
      default:
        router.push("/notifications"); // Fallback to notifications center
    }
  };

  return (
    <DashboardLayout>
      {/* Floating Notification Icon with Badge */}
      <div
        style={{
          position: "absolute",
          top: "75px",
          right: "10px",
          zIndex: 1000,
        }}
      >
        <IconButton
          aria-label="notifications"
          onClick={handleNotificationClick}
        >
          <Badge badgeContent={notificationCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </div>

      {/* Snackbar to notify user of new notifications */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position: top and center
        style={{ top: "75px" }} // Move it down from the top
        open={openSnackbar}
        autoHideDuration={6000} // Automatically close the Snackbar after 6 seconds
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />

      {/* Popover to show notification details */}
      <Popover
        open={isPopoverOpen}
        anchorEl={anchorEl} // Set Popover position relative to the clicked element
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
            overflowY: "auto",
            padding: "10px",
          },
        }}
      >
        {/* Button to mark all as read */}
        {/* Link to Notification Center */}
        <Link
          href="/notifications"
          underline="hover"
          sx={{ display: "block", textAlign: "center", padding: "10px 0px 0px 0" }}
        >
          Notifications
        </Link>
        <Button
          onClick={handleMarkAllAsRead}
          sx={{ textTransform: "none", margin: "10px 0", justifyself: "end" }}
        >
          Mark All as Read
        </Button>

        <Divider />

        {/* List notifications */}
        {notifications.length === 0 ? (
          <Typography sx={{ p: 2 }}>No new notifications.</Typography>
        ) : (
          notifications
            .slice(0, maxNotificationsToDisplay)
            .map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClickType(notification)} // Navigate based on type
                sx={{
                  backgroundColor:
                    notification.status === "unread" && "#ffbf80",
                }}
              >
                <Avatar sx={{ marginRight: 2 }}></Avatar>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight:
                        notification.status === "unread" ? "bold" : "normal",
                    }}
                  >
                    {notification.type}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(notification.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true, // For 12-hour time format (AM/PM)
                    })}
                  </Typography>
                </Box>
              </ListItemButton>
            ))
        )}

        <Divider />
      </Popover>

      {/* Page Content */}
      <PageContainer>{props.children}</PageContainer>
    </DashboardLayout>
  );
}
