import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GavelIcon from '@mui/icons-material/Gavel';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR] },
  { label: 'Users', icon: <PeopleIcon />, path: '/users', roles: [UserRole.ADMIN, UserRole.OWNER] },
  { label: 'Projects', icon: <BusinessIcon />, path: '/projects', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR] },
  { label: 'Budget Control', icon: <AccountBalanceWalletIcon />, path: '/budget', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR] },
  { label: 'Inventory', icon: <InventoryIcon />, path: '/inventory', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR] },
  { label: 'Vendors', icon: <LocalShippingIcon />, path: '/vendors', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR] },
  { label: 'Safety', icon: <HealthAndSafetyIcon />, path: '/safety', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR] },
  { label: 'Compliance', icon: <GavelIcon />, path: '/compliance', roles: [UserRole.ADMIN, UserRole.OWNER] },
  { label: 'Financials', icon: <CurrencyRupeeIcon />, path: '/financials', roles: [UserRole.ADMIN, UserRole.OWNER] },
  { label: 'Reports', icon: <BarChartIcon />, path: '/reports', roles: [UserRole.ADMIN, UserRole.OWNER], badge: 'Phase 5' },
];

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Forever
            </Typography>
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              BUILDCON
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems
          .filter((item) => hasRole(...item.roles))
          .map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton
                selected={location.pathname.startsWith(item.path)}
                onClick={() => { navigate(item.path); onClose(); }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {item.badge && (
                  <Chip label={item.badge} size="small" sx={{ fontSize: 10, height: 18 }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Logged in as
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Chip label={user?.role} size="small" color="primary" variant="outlined" sx={{ mt: 0.5, textTransform: 'capitalize' }} />
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        open
      >
        {content}
      </Drawer>
    </Box>
  );
}
