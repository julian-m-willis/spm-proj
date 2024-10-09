import * as React from 'react';
import { AppProvider } from '@toolpad/core/nextjs';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import LanguageIcon from '@mui/icons-material/Language';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
// import type { Navigation } from '@toolpad/core';
import { SessionProvider, signIn, signOut } from 'next-auth/react';
import { auth } from '../auth';
import theme from '../theme';

const NAVIGATION = [
  {
    segment: '',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Schedules',
  },
  {
    segment: 'schedule/view-own-schedule',
    title: 'View Own Schedule',
    icon: <PersonIcon />,
  },
  {
    segment: 'schedule/view-team-schedule',
    title: "View Team's Schedule",
    icon: <GroupIcon />,
  },
  {
    segment: 'schedule/view-department-schedule',
    title: "View Department's Schedule",
    icon: <BusinessIcon />,
    roles: [1, 3],
  },
  {
    segment: 'schedule/view-organization-schedule',
    title: "View Organization's Schedule",
    icon: <LanguageIcon />,
    roles: [1],
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Arrangement Requests',
  },
  {
    segment: 'arrangement/apply-arrangement',
    title: 'Apply for Arrangement',
    icon: <AddIcon />,
  },
  {
    segment: 'arrangement/view-my-request',
    title: 'View My Request',
    icon: <CalendarTodayIcon />,
  },
  {
    segment: 'arrangement/approve-arrangements',
    title: 'Approve Arrangements',
    icon: <AssignmentIcon />,
    roles: [1, 3],
  },
  {
    segment: 'arrangement/revoke-arrangements',
    title: 'Revoke Arrangements',
    icon: <CancelScheduleSendIcon />,
    roles: [1, 3],
  },
  {
    kind: 'divider',
  },
];

const BRANDING = {
  title: 'All-in-One',
};


const AUTHENTICATION = {
  signIn,
  signOut,
};


export default async function RootLayout(props) {
  const session = await auth();
  const userRoles = session?.user?.roles; // Assuming roles are stored in session

  // Filter navigation based on user roles
  const accessibleNavigation = NAVIGATION.filter(item => 
    !item.roles || item.roles.includes(userRoles)
  );

  return (
    <html lang="en" data-toolpad-color-scheme="light" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <AppProvider
              navigation={accessibleNavigation}
              branding={BRANDING}
              session={session}
              authentication={AUTHENTICATION}
              theme={theme}
            >
              {props.children}
            </AppProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
