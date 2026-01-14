import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemText, CssBaseline, Breadcrumbs, Link as MuiLink, Divider, CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useState, Suspense, useRef } from 'react'; // Import useRef
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  onLogout: () => void;
  employeeId: string | null;
  employeeName: string | null; // New prop for employee name
}

const drawerWidth = 200;

const nameMap: { [key: string]: string } = {
  'dashboard': 'Dashboard',
  'schedule': 'Visit Schedule',
  // 'activity': 'Visit Activity',
  'report': 'Activity Report',
  'profile': 'User Profile',
  'input-visit': 'Create Planning',
  'add-customer': 'Add Customer',
  'history': 'Order History'
};


const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
    <CircularProgress />
  </Box>
);

const Layout = ({ onLogout, employeeId, employeeName }: LayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Declare navigate hook
  const pathnames = location.pathname.split('/').filter((x) => x);
  const menuButtonRef = useRef<HTMLButtonElement>(null); // Ref for the menu button

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
    // Return focus to the menu button when the drawer closes
    menuButtonRef.current?.focus();
  };

  const drawer = (
    <Box onClick={handleDrawerClose} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ my: 2, textAlign: 'center' }}>
        <img src="logo-siumang@0.33x.svg" alt="Si Umang Logo" style={{ maxHeight: '50px' }} />
      </Box>
      <List>
        <ListItemButton component={RouterLink} to="/dashboard" selected={location.pathname === '/dashboard' || location.pathname === '/'}>
          <HomeIcon sx={{ mr: 1 }} />
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={RouterLink} to="/schedule" selected={location.pathname.startsWith('/schedule')}>
          <ScheduleIcon sx={{ mr: 1 }} />
          <ListItemText primary="Visit Schedule" />
        </ListItemButton>
        <ListItemButton component={RouterLink} to="/input-visit" selected={location.pathname.startsWith('/input-visit')}>
          <AddLocationAltIcon sx={{ mr: 1 }} />
          <ListItemText primary="Create Planning" />
        </ListItemButton>
        <ListItemButton component={RouterLink} to="/add-customer" selected={location.pathname.startsWith('/add-customer')}>
          <PersonAddIcon sx={{ mr: 1 }} />
          <ListItemText primary="Add Customer" />
        </ListItemButton>
        {/* <ListItemButton component={RouterLink} to="/activity" selected={location.pathname.startsWith('/activity')}>
          <HistoryIcon sx={{ mr: 1 }} />
          <ListItemText primary="Visit Activity" />
        </ListItemButton> */}
        <ListItemButton component={RouterLink} to="/report" selected={location.pathname.startsWith('/report')}>
          <BarChartIcon sx={{ mr: 1 }} />
          <ListItemText primary="Activity Report" />
        </ListItemButton>
        <Divider />
        <ListItemButton component={RouterLink} to="/profile" selected={location.pathname.startsWith('/profile')}>
          <PersonIcon sx={{ mr: 1 }} />
          <ListItemText primary="User Profile" />
        </ListItemButton>
        <ListItemButton onClick={onLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
      {/* --- Footer --- */}
      <Box sx={{ p: 2, mt: 'auto', textAlign: 'center' }}>
        <Typography variant="caption" display="block" color="text.secondary">
          Version 1.0.2
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            ref={menuButtonRef} // Assign ref to the button
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap component="div">
              Sales Monitoring
            </Typography>
            <Box sx={{ ml: 2 }}>
                <Breadcrumbs aria-label="breadcrumb" color="inherit">
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">
                    Home
                </MuiLink>
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const breadcrumbName = nameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                    return last ? (
                    <Typography color="text.primary" key={to} sx={{color: 'white'}}>
                        {breadcrumbName}
                    </Typography>
                    ) : (
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to={to} key={to}>
                        {breadcrumbName}
                    </MuiLink>
                    );
                })}
                </Breadcrumbs>
            </Box>
          </Box>
          <Box
            sx={{
              mr: 2,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              cursor: 'pointer',
              minHeight: '24px',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            onClick={() => navigate('/profile')} // Navigate to profile page
          >
            <Typography variant="body1" color="inherit" sx={{ mr: 1 }}>
              {employeeName ? `Hi, ${employeeName}` : ''}
            </Typography>
            <PersonIcon sx={{ fontSize: 20 }} /> {/* Add a person icon */}
          </Box>
          <IconButton color="inherit" onClick={onLogout} title="Log Out">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerClose} // Use the new handler
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar /> {/* This is to offset the AppBar */}
        <Suspense fallback={<PageLoader />}>
          <Outlet context={{ employeeId }} /> {/* Render child routes here */}
        </Suspense>
      </Box>
    </Box>
  );
};

export default Layout;