"use client";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Grid, Box, Typography, Paper, useMediaQuery, Badge, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import React, { useState, useEffect } from 'react';
import { DateCalendar, PickersDay } from '@mui/x-date-pickers';
import axios from 'axios';
import { useSession } from 'next-auth/react'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Custom day component with badges
function CustomDay(props) {
  const { day, outsideCurrentMonth, schedules, ...other } = props;

  // Get the schedule for the current day
  const formattedDay = day.format('YYYY-MM-DD');
  const scheduleForDay = schedules[formattedDay] || null;

  // Determine badge content based on the schedule, adding "Pending" status
  const badgeContent = scheduleForDay
    ? scheduleForDay === "WFH" 
      ? '🏡' 
      : scheduleForDay === "WFH (AM)" 
        ? '🌞' 
        : scheduleForDay === "WFH (PM)" 
          ? '🌚'
          : scheduleForDay === "Pending Arrangement Request"
            ? '⏳'  // Display pending status
            : '🏢'  // Default to In-Office
    : undefined;

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={badgeContent}  // Display the badge for the day's work schedule
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

export default function ResponsiveCalendar() {
  const { data: session } = useSession(); // Assuming you use next-auth for authentication
  const [selectedMonth, setSelectedMonth] = useState(dayjs());  // Current month
  const [schedules, setSchedules] = useState({});
  const isMobile = useMediaQuery('(max-width: 600px)');  // Detect if screen width is mobile
  const [token, setToken] = useState(null);

  // Set token when session is available
  useEffect(() => {
    if (session?.user?.token) {
      setToken(session.user.token);
    }
  }, [session]);

  // Function to fetch schedule data from the backend
  const fetchScheduleData = async (month) => {
    try {
      if (!token) {
        return;
      }
      const startOfMonth = dayjs(month).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = dayjs(month).endOf('month').format('YYYY-MM-DD');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/staff/?start_date=${startOfMonth}&end_date=${endOfMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Set the fetched schedule data from the backend
      setSchedules(response.data.schedules);  
      console.log(response.data.schedules);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  // Trigger API call when selectedMonth changes (including after navigating months)
  useEffect(() => {
    if (token) {
      fetchScheduleData(selectedMonth);
    }
  }, [selectedMonth, token]);

  const handleMonthChange = (direction) => {
    setSelectedMonth((prev) => 
      direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month')
    );
  };

  const handleMonthChangeMobile = (newMonth) => {
    setSelectedMonth(newMonth); // Update the selected month for mobile
  };

  const getScheduleColor = (scheduleType) => {
    if (scheduleType.startsWith('WFH')) return '#2196F3';  // Blue for WFH
    if (scheduleType.startsWith('In office')) return '#4CAF50';  // Green for In-Office
    if (scheduleType === 'Pending Arrangement Request') return '#FF9800';  // Orange for Pending
    if (scheduleType.startsWith('WFH (AM)') || scheduleType.startsWith('WFH (PM)')) return 'orange';  // Orange for half-day
    return 'inherit';  // Default (if no schedule)
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
  
        {isMobile ? (
          <>
            {/* Collapsed View for Mobile */}
            <DateCalendar
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue)}  // Sync with full view
              onMonthChange={handleMonthChangeMobile}  // Trigger API call on month change in mobile view
              renderDay={(day, _value, DayComponentProps) => {
                const schedule = schedules[day.format('YYYY-MM-DD')];
                const color = schedule ? getScheduleColor(schedule) : null;
                return (
                  <Box
                    sx={{
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      backgroundColor: color || 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color ? '#fff' : '#000',
                    }}
                  >
                    {day.format('D')}
                  </Box>
                );
              }}
              slots={{
                day: (props) => (
                  <CustomDay {...props} schedules={schedules} />
                ),
              }}
              showDaysOutsideCurrentMonth
              allowKeyboardControl={false}
            />
  
            {/* Legend only for Mobile View */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Legend:</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="body2">🏡 WFH (Full Day)</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">🌞 WFH (AM)</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">🌚 WFH (PM)</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">🏢 In-Office</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">⏳ Pending Arrangement Request</Typography>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : (
          // Full Calendar View for Larger Screens
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <IconButton onClick={() => handleMonthChange('prev')}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5">
                {selectedMonth.format('MMMM YYYY')}
              </Typography>
              <IconButton onClick={() => handleMonthChange('next')}>
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            <Grid container spacing={1}>
              {/* Day of Week Headers */}
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <Grid item xs={12 / 7} key={day}>
                  <Typography variant="subtitle2" align="center">{day}</Typography>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={2}>
              {getDaysInMonthWithPadding(selectedMonth).map((day, index) => (
                <Grid item xs={12 / 7} key={index}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      padding: '10px', 
                      minHeight: '100px', 
                      maxHeight: '100px', 
                      overflow: 'hidden',
                    }}
                  >
                    {day ? (
                      <>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {day.format('D')}
                        </Typography>
                        {schedules[day.format('YYYY-MM-DD')] && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: getScheduleColor(schedules[day.format('YYYY-MM-DD')]),
                              fontWeight: 'bold',
                              mb: 0.5,
                            }}
                          >
                            {schedules[day.format('YYYY-MM-DD')]}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Box sx={{ minHeight: '40px' }}></Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </LocalizationProvider>
    </Box>
  );
}

// Helper function to get days in the month with padding for the first weekday
function getDaysInMonthWithPadding(selectedMonth) {
  const firstDayOfMonth = selectedMonth.startOf('month');
  const daysInMonth = selectedMonth.daysInMonth();
  const startDayOfWeek = firstDayOfMonth.day();  // Get the weekday index of the first day
  const daysArray = [];

  // Add padding for the days before the 1st of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }

  // Add the actual days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(dayjs(selectedMonth).date(i));
  }

  return daysArray;
}
