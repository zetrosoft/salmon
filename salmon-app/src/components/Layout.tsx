import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemText, Box, CssBaseline, Breadcrumbs, Link as MuiLink, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

interface LayoutProps {
  onLogout: () => void;
  employeeId: string | null;
}

const drawerWidth = 200;

const nameMap: { [key: string]: string } = {
  'dashboard': 'Dashboard',
  'schedule': 'Visit Schedule',
  'activity': 'Visit Activity',
  'report': 'Activity Report',
  'profile': 'User Profile',
  'input-visit': 'Input Kunjungan',
  'history': 'Order History'
};

const Layout = ({ onLogout, employeeId }: LayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ my: 2 }}>
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
          <ListItemText primary="Input Kunjungan" />
        </ListItemButton>
        <ListItemButton component={RouterLink} to="/activity" selected={location.pathname.startsWith('/activity')}>
          <HistoryIcon sx={{ mr: 1 }} />
          <ListItemText primary="Visit Activity" />
        </ListItemButton>
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
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
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
          <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            Hi, {employeeId}
          </Typography>
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
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
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
        <Outlet context={{ employeeId }} /> {/* Render child routes here */}
      </Box>
    </Box>
  );
};

export default Layout;