import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { userApi } from '@/api/user.api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { User, UserRole, UserStatus, CreateUserFormData, UpdateUserFormData } from '@/types';
import { useSnackbar } from 'notistack';

const ROLE_COLORS: Record<UserRole, 'error' | 'warning' | 'info' | 'success'> = {
  [UserRole.ADMIN]: 'error',
  [UserRole.OWNER]: 'warning',
  [UserRole.SUPERVISOR]: 'info',
  [UserRole.CUSTOMER]: 'success',
};

const createSchema = yup.object({
  email: yup.string().email('Invalid email').required('Required'),
  password: yup
    .string()
    .min(8, 'Min 8 characters')
    .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'Must contain uppercase, lowercase, number')
    .required('Required'),
  firstName: yup.string().min(2).required('Required'),
  lastName: yup.string().min(2).required('Required'),
  phone: yup.string().matches(/^[6-9]\d{9}$/, 'Invalid phone').optional(),
  role: yup.mixed<UserRole>().oneOf(Object.values(UserRole)).required('Required'),
});

const updateSchema = yup.object({
  firstName: yup.string().min(2).optional(),
  lastName: yup.string().min(2).optional(),
  phone: yup.string().matches(/^[6-9]\d{9}$/, 'Invalid phone').optional().nullable(),
  role: yup.mixed<UserRole>().oneOf(Object.values(UserRole)).optional(),
  status: yup.mixed<UserStatus>().oneOf(Object.values(UserStatus)).optional(),
});

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const queryKey = ['users', { page: page + 1, limit: pageSize, search, role: roleFilter, status: statusFilter }];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      userApi.getAll({ page: page + 1, limit: pageSize, search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      enqueueSnackbar('User created successfully', { variant: 'success' });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Create failed';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserFormData }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      enqueueSnackbar('User updated successfully', { variant: 'success' });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
      enqueueSnackbar('User deleted', { variant: 'success' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: userApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('Status updated', { variant: 'success' });
    },
  });

  const createForm = useForm<CreateUserFormData>({
    resolver: yupResolver(createSchema) as never,
    defaultValues: { role: UserRole.SUPERVISOR },
  });

  const editForm = useForm<UpdateUserFormData>({
    resolver: yupResolver(updateSchema) as never,
  });

  const handleEditOpen = useCallback((user: User) => {
    setEditUser(user);
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? undefined,
      role: user.role,
      status: user.status,
    });
  }, [editForm]);

  const columns: GridColDef<User>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13 }}>
            {row.firstName[0]}{row.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={ROLE_COLORS[value as UserRole]}
          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === UserStatus.ACTIVE ? 'success' : 'default'}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last Login',
      width: 160,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditOpen(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => toggleMutation.mutate(row.id)}>
              {row.status === UserStatus.ACTIVE ? (
                <BlockIcon fontSize="small" color="warning" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteUser(row)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">User Management</Typography>
          <Typography color="text.secondary" variant="body2">
            Manage platform users and their access roles
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select value={roleFilter} label="Role" onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="">All Roles</MenuItem>
                  {Object.values(UserRole).map((r) => (
                    <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="">All Status</MenuItem>
                  {Object.values(UserStatus).map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load users.</Alert>}

      <Card>
        <DataGrid
          rows={data?.data ?? []}
          columns={columns}
          rowCount={data?.meta.total ?? 0}
          loading={isLoading}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0, '& .MuiDataGrid-cell': { borderColor: 'divider' } }}
          getRowHeight={() => 64}
        />
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            id="create-user-form"
            onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
            noValidate
          >
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  {...createForm.register('firstName')}
                  label="First Name"
                  fullWidth
                  error={!!createForm.formState.errors.firstName}
                  helperText={createForm.formState.errors.firstName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...createForm.register('lastName')}
                  label="Last Name"
                  fullWidth
                  error={!!createForm.formState.errors.lastName}
                  helperText={createForm.formState.errors.lastName?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...createForm.register('email')}
                  label="Email Address"
                  type="email"
                  fullWidth
                  error={!!createForm.formState.errors.email}
                  helperText={createForm.formState.errors.email?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...createForm.register('password')}
                  label="Password"
                  type="password"
                  fullWidth
                  error={!!createForm.formState.errors.password}
                  helperText={createForm.formState.errors.password?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...createForm.register('phone')}
                  label="Phone (optional)"
                  fullWidth
                  error={!!createForm.formState.errors.phone}
                  helperText={createForm.formState.errors.phone?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="role"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!createForm.formState.errors.role}>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        {Object.values(UserRole).map((r) => (
                          <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setCreateOpen(false); createForm.reset(); }}>Cancel</Button>
          <Button type="submit" form="create-user-form" variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            id="edit-user-form"
            onSubmit={editForm.handleSubmit((d) => updateMutation.mutate({ id: editUser!.id, data: d }))}
            noValidate
          >
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  {...editForm.register('firstName')}
                  label="First Name"
                  fullWidth
                  error={!!editForm.formState.errors.firstName}
                  helperText={editForm.formState.errors.firstName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...editForm.register('lastName')}
                  label="Last Name"
                  fullWidth
                  error={!!editForm.formState.errors.lastName}
                  helperText={editForm.formState.errors.lastName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...editForm.register('phone')}
                  label="Phone"
                  fullWidth
                  error={!!editForm.formState.errors.phone}
                  helperText={editForm.formState.errors.phone?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="role"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        {Object.values(UserRole).map((r) => (
                          <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="status"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        {Object.values(UserStatus).map((s) => (
                          <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button type="submit" form="edit-user-form" variant="contained" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteUser?.firstName} ${deleteUser?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        onCancel={() => setDeleteUser(null)}
      />
    </Box>
  );
}
