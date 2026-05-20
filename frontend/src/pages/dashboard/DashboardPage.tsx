import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const areaData = [
  { month: 'Oct', budget: 40, actual: 38 },
  { month: 'Nov', budget: 55, actual: 50 },
  { month: 'Dec', budget: 60, actual: 65 },
  { month: 'Jan', budget: 80, actual: 78 },
  { month: 'Feb', budget: 90, actual: 88 },
  { month: 'Mar', budget: 100, actual: 95 },
];

const barData = [
  { project: 'Skyline A', completed: 65, pending: 35 },
  { project: 'Green Valley', completed: 45, pending: 55 },
  { project: 'Heritage Park', completed: 80, pending: 20 },
  { project: 'Lotus Heights', completed: 30, pending: 70 },
];

const recentActivity = [
  { id: 1, user: 'Ramesh Patel', action: 'Raised PO for RCC Material', time: '2h ago', type: 'purchase' },
  { id: 2, user: 'Suresh Mehta', action: 'Submitted daily safety checklist', time: '3h ago', type: 'safety' },
  { id: 3, user: 'Admin', action: 'Added new project: Lotus Heights', time: '5h ago', type: 'project' },
  { id: 4, user: 'Dinesh Shah', action: 'Updated inventory: Steel Rods', time: '6h ago', type: 'inventory' },
];

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
            {trend && (
              <Chip label={trend} size="small" color="success" variant="outlined" sx={{ mt: 1 }} />
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 52, height: 52 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5">
          Welcome, {user?.firstName}! 👋
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening with your projects today.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Projects"
            value="4"
            subtitle="2 on schedule"
            icon={<BusinessIcon />}
            color="primary"
            trend="+1 this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value="18"
            subtitle="12 supervisors"
            icon={<PeopleIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Budget Utilization"
            value="76%"
            subtitle="₹3.8Cr of ₹5Cr"
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Alerts"
            value="3"
            subtitle="2 cost overruns"
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget vs Actual Spend (₹ Crores)
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F57C00" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F57C00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="budget" stroke="#1565C0" fill="url(#colorBudget)" name="Budget" />
                  <Area type="monotone" dataKey="actual" stroke="#F57C00" fill="url(#colorActual)" name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                {recentActivity.map((item, i) => (
                  <Box key={item.id}>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: 12 }}>
                          {item.user[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2">{item.action}</Typography>}
                        secondary={`${item.user} · ${item.time}`}
                      />
                    </ListItem>
                    {i < recentActivity.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {hasRole(UserRole.ADMIN, UserRole.OWNER) && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Progress Overview
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="project" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed %" fill="#1565C0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending %" fill="#E3F2FD" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
