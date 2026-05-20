import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, InputAdornment, LinearProgress, MenuItem,
  Select, TextField, Tooltip, Typography, FormControl, InputLabel,
  Stack, Rating, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { vendorApi } from '@/api/vendor.api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Vendor, VendorCategory, VendorStatus } from '@/types';
import { useSnackbar } from 'notistack';

const CATEGORY_COLOR: Record<VendorCategory, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  [VendorCategory.MATERIAL]: 'primary',
  [VendorCategory.LABOR]: 'secondary',
  [VendorCategory.CONTRACTOR]: 'success',
  [VendorCategory.CONSULTANT]: 'warning',
  [VendorCategory.OTHER]: 'info',
};

export default function VendorsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [vendorOpen, setVendorOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [ratingOpen, setRatingOpen] = useState<Vendor | null>(null);
  const [deactivate, setDeactivate] = useState<Vendor | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { page: page + 1, search, category }],
    queryFn: () => vendorApi.getAll({ page: page + 1, limit: 20, search: search || undefined, category: category || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: vendorApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setVendorOpen(false); enqueueSnackbar('Vendor added', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to add vendor', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => vendorApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setVendorOpen(false); setDeactivate(null); enqueueSnackbar('Updated', { variant: 'success' }); },
  });

  const ratingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => vendorApi.addRating(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setRatingOpen(null); enqueueSnackbar('Rating submitted', { variant: 'success' }); },
  });

  const form = useForm();
  const ratingForm = useForm<{ qualityScore: number; deliveryScore: number; pricingScore: number; comments: string }>({ defaultValues: { qualityScore: 3, deliveryScore: 3, pricingScore: 3, comments: '' } });

  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    form.reset({ name: v.name, category: v.category, contactPerson: v.contactPerson ?? '', email: v.email ?? '', phone: v.phone ?? '', address: v.address ?? '', gstNumber: v.gstNumber ?? '', panNumber: v.panNumber ?? '' });
    setVendorOpen(true);
  };

  const columns: GridColDef<Vendor>[] = [
    {
      field: 'name', headerName: 'Vendor', flex: 1, minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13 }}>
            {row.name[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.code}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 130,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={CATEGORY_COLOR[value as VendorCategory]} sx={{ textTransform: 'capitalize' }} />
      ),
    },
    { field: 'contactPerson', headerName: 'Contact', width: 130, renderCell: ({ value }) => value || '—' },
    { field: 'phone', headerName: 'Phone', width: 130, renderCell: ({ value }) => value || '—' },
    {
      field: 'performanceScore', headerName: 'Score', width: 140,
      renderCell: ({ value }) => {
        const score = parseFloat(value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={700} color={score >= 70 ? 'success.main' : score >= 50 ? 'warning.main' : 'error.main'}>
              {score.toFixed(0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">/100</Typography>
            <LinearProgress variant="determinate" value={score}
              sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: score >= 70 ? '#2e7d32' : score >= 50 ? '#f57c00' : '#c62828' } }}
            />
          </Box>
        );
      },
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={value === VendorStatus.ACTIVE ? 'success' : value === VendorStatus.BLACKLISTED ? 'error' : 'default'} variant="outlined" sx={{ textTransform: 'capitalize' }} />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Rate Vendor">
            <IconButton size="small" onClick={() => { ratingForm.reset({ qualityScore: 3, deliveryScore: 3, pricingScore: 3 }); setRatingOpen(row); }}>
              <StarIcon fontSize="small" color="warning" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deactivate">
            <IconButton size="small" onClick={() => setDeactivate(row)} disabled={row.status === VendorStatus.INACTIVE}>
              <BlockIcon fontSize="small" color="error" />
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
          <Typography variant="h5">Vendor Management</Typography>
          <Typography color="text.secondary" variant="body2">Manage vendors with performance scoring and ratings</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditVendor(null); form.reset({ category: VendorCategory.MATERIAL }); setVendorOpen(true); }}>
          Add Vendor
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)}
                fullWidth size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {Object.values(VendorCategory).map((c) => <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={data?.data ?? []}
          columns={columns}
          rowCount={data?.meta.total ?? 0}
          loading={isLoading}
          paginationMode="server"
          paginationModel={{ page, pageSize: 20 }}
          onPaginationModelChange={({ page: p }) => setPage(p)}
          pageSizeOptions={[20]}
          autoHeight
          disableRowSelectionOnClick
          getRowHeight={() => 60}
          sx={{ border: 0 }}
        />
      </Card>

      {/* Create/Edit Vendor Dialog */}
      <Dialog open={vendorOpen} onClose={() => setVendorOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="vendor-form" onSubmit={form.handleSubmit((d) => editVendor ? updateMutation.mutate({ id: editVendor.id, data: d }) : createMutation.mutate(d))} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField {...form.register('name')} label="Vendor Name *" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select {...form.register('category')} label="Category *" defaultValue={VendorCategory.MATERIAL}>
                    {Object.values(VendorCategory).map((c) => <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField {...form.register('contactPerson')} label="Contact Person" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...form.register('email')} label="Email" type="email" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...form.register('phone')} label="Phone" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...form.register('gstNumber')} label="GST Number" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...form.register('panNumber')} label="PAN Number" fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField {...form.register('address')} label="Address" fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setVendorOpen(false)}>Cancel</Button>
          <Button type="submit" form="vendor-form" variant="contained">{editVendor ? 'Save' : 'Add Vendor'}</Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={!!ratingOpen} onClose={() => setRatingOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rate Vendor — {ratingOpen?.name}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="rating-form" onSubmit={ratingForm.handleSubmit((d) => ratingMutation.mutate({ id: ratingOpen!.id, data: d }))} noValidate>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {[
                { field: 'qualityScore', label: 'Quality' },
                { field: 'deliveryScore', label: 'On-Time Delivery' },
                { field: 'pricingScore', label: 'Competitive Pricing' },
              ].map((r) => (
                <Box key={r.field}>
                  <Typography variant="body2" gutterBottom>{r.label}</Typography>
                  <Rating
                    value={ratingForm.watch(r.field as 'qualityScore')}
                    onChange={(_, v) => ratingForm.setValue(r.field as 'qualityScore', v ?? 1)}
                  />
                </Box>
              ))}
              <TextField {...ratingForm.register('comments')} label="Comments" fullWidth multiline rows={3} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRatingOpen(null)}>Cancel</Button>
          <Button type="submit" form="rating-form" variant="contained" disabled={ratingMutation.isPending}>Submit Rating</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deactivate}
        title="Deactivate Vendor"
        message={`Deactivate "${deactivate?.name}"?`}
        confirmLabel="Deactivate"
        confirmColor="warning"
        onConfirm={() => deactivate && updateMutation.mutate({ id: deactivate.id, data: { status: VendorStatus.INACTIVE } })}
        onCancel={() => setDeactivate(null)}
      />
    </Box>
  );
}
