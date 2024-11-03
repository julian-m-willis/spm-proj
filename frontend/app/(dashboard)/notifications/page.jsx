"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Paper,
  Button,
} from "@mui/material";

export default function NotificationCenter() {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 6;
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setToken(session.user?.token);
    } else {
      window.location.reload();
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

        setNotifications(notificationResponse.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [token]);

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
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        status: "read",
      }));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/notification/mark-read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);
    if (notification.type === "WFH Request") {
      router.push("/arrangement/approve-arrangements");
    } else if (notification.type === "WFH Approved") {
      router.push("/arrangement/view-my-request");
    }
  };

  // Pagination Calculations
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstNotification, indexOfLastNotification);

  const nextPage = () => {
    if (currentPage < Math.ceil(notifications.length / notificationsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Check if all notifications are read
  const allRead = notifications.length == 0 || notifications.every(notification => notification.status === "read");

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="contained"
        onClick={handleMarkAllAsRead}
        sx={{ mb: 2 }}
        disabled={allRead} // Disable button if all notifications are read
      >
        Mark All as Read
      </Button>
      <Paper elevation={3}>
        {notifications.length === 0 ? ( // Check if notifications list is empty
          <Typography sx={{ p: 2, textAlign: "center" }}>
            No notifications available.
          </Typography>
        ) : (
          <List>
            {currentNotifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  backgroundColor: notification.status === "unread" ? "#ffbf80" : "transparent",
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8, // Minimal hover effect for both light and dark modes
                  },
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <ListItemText
                  primary={notification.message}
                  secondary={new Date(notification.created_at).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
          <Button variant="outlined" onClick={prevPage} disabled={currentPage === 1}>
            Previous
          </Button>
          <Typography variant="body2">
            Page {currentPage} of {Math.ceil(notifications.length / notificationsPerPage)}
          </Typography>
          <Button
            variant="outlined"
            onClick={nextPage}
            disabled={currentPage === Math.ceil(notifications.length / notificationsPerPage)}
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
