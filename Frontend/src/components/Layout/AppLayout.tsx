import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Toolbar, Typography, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../services/auth';

const drawerWidth = 240;

const menuItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Products', to: '/products' },
  { label: 'Sales', to: '/sales' },
  { label: 'Purchases', to: '/purchases' },
  { label: 'Categories', to: '/categories' },
  { label: 'Suppliers', to: '/suppliers' },
  { label: 'Reports', to: '/reports' },
  { label: 'Users', to: '/users' },
  { label: 'Settings', to: '/settings' }
];

const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.to} component={Link} to={item.to} selected={location.pathname.startsWith(item.to)} onClick={() => setMobileOpen(false)}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Stock Management</Typography>
          {user && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2">{user.name} ({user.role})</Typography>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="navigation">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
