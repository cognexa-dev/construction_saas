import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, InputAdornment, MenuItem,
  Select, TextField, Tooltip, Typography, FormControl, InputLabel,
  Stack, Alert, Tab, Tabs, Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import WarningIcon from '@mui/icons-material/Warning';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { inventoryApi } from '@/api/inventory.api';
import { InventoryItem, ItemCategory, ItemUnit, TransactionType } from '@/types';
import { useSnackbar } from 'notistack';

const CATEGORY_COLORS: Record<string, string> = {
  cement: '#6d4c41', steel: '#37474f', sand: '#f9a825',
  aggregate: '#9e9e9e', bricks: '#bf360c', tiles: '#1565c0',
};

export default function InventoryPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [itemOpen, setItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [txOpen, setTxOpen] = useState<InventoryItem | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { page: page + 1, search, category, lowStock: tab === 1 }],
    queryFn: () => inventoryApi.getAll({ page: page + 1, limit: 50, search: search || undefined, category: category || undefined, lowStock: tab === 1 || undefined }),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryApi.getLowStockAlerts,
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setItemOpen(false); enqueueSnackbar('Item created', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to create item', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => inventoryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setItemOpen(false); enqueueSnackbar('Updated', { variant: 'success' }); },
  });

  const txMutation = useMutation({
    mutationFn: inventoryApi.recordTransaction,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setTxOpen(null); enqueueSnackbar('Transaction recorded', { variant: 'success' }); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Transaction failed';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const form = useForm();
  const txForm = useForm();

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    form.reset({ name: item.name, unit: item.unit, category: item.category, unitPrice: item.unitPrice, minimumStock: item.minimumStock, description: item.description ?? '' });
    setItemOpen(true);
  };

  const columns: GridColDef<InventoryItem>[] = [
    {
      field: 'name', headerName: 'Item', flex: 1, minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
            {row.isLowStock && <WarningIcon fontSize="small" color="warning" />}
          </Box>
          <Typography variant="caption" color="text.secondary">{row.sku}</Typography>
        </Box>
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 120,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ bgcolor: CATEGORY_COLORS[value] || '#1565c0', color: 'white', textTransform: 'capitalize', fontSize: 11 }} />
      ),
    },
    { field: 'unit', headerName: 'Unit', width: 80, renderCell: ({ value }) => value?.toUpperCase() },
    {
      field: 'currentStock', headerName: 'Stock', width: 110,
      renderCell: ({ row }) => (
        <Typography variant="body2" color={row.isLowStock ? 'error.main' : 'text.primary'} fontWeight={row.isLowStock ? 700 : 400}>
          {parseFloat(row.currentStock).toFixed(2)} {row.unit}
        </Typography>
      ),
    },
    {
      field: 'minimumStock', headerName: 'Min Stock', width: 110,
      renderCell: ({ row }) => `${parseFloat(row.minimumStock).toFixed(2)} ${row.unit}`,
    },
    {
      field: 'unitPrice', headerName: 'Unit Price', width: 120,
      renderCell: ({ value }) => `₹${parseFloat(value).toLocaleString('en-IN')}`,
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Record Transaction">
            <IconButton size="small" onClick={() => { txForm.reset({ transactionType: TransactionType.INWARD }); setTxOpen(row); }}>
              <SwapVertIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)}>
              <EditIcon fontSize="small" />
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
          <Typography variant="h5">Inventory & Procurement</Typography>
          <Typography color="text.secondary" variant="body2">Master catalog with QR/barcode support and stock tracking</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); form.reset({ unit: ItemUnit.NOS, category: ItemCategory.OTHER }); setItemOpen(true); }}>
          Add Item
        </Button>
      </Box>

      {(alerts as InventoryItem[]).length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <strong>{(alerts as InventoryItem[]).length} items</strong> are below minimum stock level: {(alerts as InventoryItem[]).slice(0, 3).map((a: InventoryItem) => a.name).join(', ')}{(alerts as InventoryItem[]).length > 3 ? '...' : ''}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="All Items" />
            <Tab label={<Badge badgeContent={(alerts as InventoryItem[]).length} color="warning">Low Stock</Badge>} />
          </Tabs>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
                fullWidth size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {Object.values(ItemCategory).map((c) => (
                    <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>
                  ))}
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
          paginationModel={{ page, pageSize: 50 }}
          onPaginationModelChange={({ page: p }) => setPage(p)}
          pageSizeOptions={[50]}
          autoHeight
          disableRowSelectionOnClick
          getRowHeight={() => 60}
          sx={{ border: 0 }}
        />
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemOpen} onClose={() => setItemOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="inv-form" onSubmit={form.handleSubmit((d) => editItem ? updateMutation.mutate({ id: editItem.id, data: d }) : createMutation.mutate(d))} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField {...form.register('name')} label="Item Name *" fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select {...form.register('category')} label="Category" defaultValue={ItemCategory.OTHER}>
                      {Object.values(ItemCategory).map((c) => <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select {...form.register('unit')} label="Unit" defaultValue={ItemUnit.NOS}>
                      {Object.values(ItemUnit).map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField {...form.register('unitPrice')} label="Unit Price (₹) *" type="number" fullWidth />
              <TextField {...form.register('minimumStock')} label="Minimum Stock *" type="number" fullWidth />
              <TextField {...form.register('qrCode')} label="QR / Barcode" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeIcon fontSize="small" /></InputAdornment> }} />
              <TextField {...form.register('description')} label="Description" fullWidth multiline rows={2} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setItemOpen(false)}>Cancel</Button>
          <Button type="submit" form="inv-form" variant="contained">{editItem ? 'Save' : 'Add Item'}</Button>
        </DialogActions>
      </Dialog>

      {/* Record Transaction Dialog */}
      <Dialog open={!!txOpen} onClose={() => setTxOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Transaction — {txOpen?.name}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="tx-form" onSubmit={txForm.handleSubmit((d) => txMutation.mutate({ ...d, inventoryItemId: txOpen!.id }))} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type *</InputLabel>
                <Select {...txForm.register('transactionType')} label="Transaction Type *" defaultValue={TransactionType.INWARD}>
                  {Object.values(TransactionType).map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField {...txForm.register('quantity')} label={`Quantity (${txOpen?.unit ?? ''})`} type="number" fullWidth />
              <TextField {...txForm.register('unitPrice')} label="Unit Price (₹)" type="number" fullWidth />
              <TextField {...txForm.register('referenceNo')} label="Reference No. / GRN" fullWidth />
              <TextField {...txForm.register('notes')} label="Notes" fullWidth multiline rows={2} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setTxOpen(null)}>Cancel</Button>
          <Button type="submit" form="tx-form" variant="contained" disabled={txMutation.isPending}>
            {txMutation.isPending ? 'Saving...' : 'Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
