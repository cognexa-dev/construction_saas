import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, LinearProgress, MenuItem, Select, TextField,
  Tooltip, Typography, FormControl, InputLabel, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { budgetApi } from '@/api/budget.api';
import { projectApi } from '@/api/project.api';
import { vendorApi } from '@/api/vendor.api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { BudgetItem, BudgetCategory, BudgetStatus } from '@/types';
import { useSnackbar } from 'notistack';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';

const STATUS_COLOR = {
  [BudgetStatus.GREEN]: '#2e7d32',
  [BudgetStatus.AMBER]: '#f57c00',
  [BudgetStatus.RED]: '#c62828',
};

const CR = 10_000_000;
const fmt = (n: string | number) =>
  `₹${(parseFloat(String(n)) / CR).toFixed(2)} Cr`;

export default function BudgetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [itemOpen, setItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [costOpen, setCostOpen] = useState<BudgetItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<BudgetItem | null>(null);

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getById(projectId!),
    enabled: !!projectId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['budget', projectId],
    queryFn: () => budgetApi.getByProject(projectId!),
    enabled: !!projectId,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const createItemMutation = useMutation({
    mutationFn: budgetApi.createItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); setItemOpen(false); enqueueSnackbar('Budget item added', { variant: 'success' }); },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => budgetApi.updateItem(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); setItemOpen(false); enqueueSnackbar('Updated', { variant: 'success' }); },
  });

  const deleteItemMutation = useMutation({
    mutationFn: budgetApi.deleteItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); setDeleteItem(null); enqueueSnackbar('Deleted', { variant: 'success' }); },
  });

  const addCostMutation = useMutation({
    mutationFn: budgetApi.addCostEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); setCostOpen(null); enqueueSnackbar('Cost entry added', { variant: 'success' }); },
  });

  const form = useForm();
  const costForm = useForm();

  const openEditItem = (item: BudgetItem) => {
    setEditItem(item);
    form.reset({ name: item.name, category: item.category, budgetedAmount: item.budgetedAmount, description: item.description ?? '' });
    setItemOpen(true);
  };

  const onItemSubmit = (d: Record<string, unknown>) => {
    if (editItem) updateItemMutation.mutate({ id: editItem.id, data: d });
    else createItemMutation.mutate({ ...d, projectId });
  };

  const onCostSubmit = (d: Record<string, unknown>) => {
    addCostMutation.mutate({ ...d, projectId, budgetItemId: costOpen!.id });
  };

  const items: BudgetItem[] = data?.items ?? [];
  const summary = data?.summary;

  const chartData = items.map((i) => ({
    name: i.name.length > 12 ? `${i.name.slice(0, 12)}…` : i.name,
    Budgeted: parseFloat(i.budgetedAmount) / CR,
    Actual: parseFloat(i.actualAmount) / CR,
    status: i.status,
  }));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">{projectData?.name ?? 'Budget'} — Cost Control</Typography>
        <Typography color="text.secondary" variant="body2">
          Track line-item budgets vs actual spend. Green &lt;75% · Amber 75–90% · Red &gt;90%
        </Typography>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Budgeted', value: fmt(summary.totalBudgeted), icon: <TrendingUpIcon />, color: 'primary.main' },
            { label: 'Total Actual', value: fmt(summary.totalActual), icon: <ReceiptIcon />, color: 'warning.main' },
            { label: 'Variance', value: fmt(summary.totalBudgeted - summary.totalActual), color: summary.totalBudgeted >= summary.totalActual ? 'success.main' : 'error.main' },
            { label: 'Utilization', value: `${Math.round((summary.totalActual / (summary.totalBudgeted || 1)) * 100)}%` },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h6" fontWeight={700} color={s.color}>{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
              {[
                { label: 'Green', count: summary.greenCount, color: '#2e7d32' },
                { label: 'Amber', count: summary.amberCount, color: '#f57c00' },
                { label: 'Red', count: summary.redCount, color: '#c62828' },
              ].map((s) => (
                <Box key={s.label} sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h5" fontWeight={700} color={s.color}>{s.count}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
              ))}
            </Card>
          </Grid>
        </Grid>
      )}

      {items.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Budget vs Actual (₹ Crores)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip formatter={(v) => [`₹${Number(v).toFixed(2)} Cr`]} />
                <Legend />
                <Bar dataKey="Budgeted" fill="#1565C0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLOR[entry.status as BudgetStatus]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Line Items</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditItem(null); form.reset({ category: BudgetCategory.OTHER }); setItemOpen(true); }}>
          Add Line Item
        </Button>
      </Box>

      {isLoading && <LinearProgress />}

      <Stack spacing={1.5}>
        {items.map((item) => (
          <Card key={item.id} sx={{ borderLeft: 4, borderColor: STATUS_COLOR[item.status] }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight={600}>{item.name}</Typography>
                  <Chip label={item.category} size="small" variant="outlined" sx={{ mt: 0.5, textTransform: 'capitalize', fontSize: 11 }} />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Box sx={{ mb: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {fmt(item.actualAmount)} / {fmt(item.budgetedAmount)}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color={STATUS_COLOR[item.status]}>
                        {item.utilizationPercent}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, item.utilizationPercent)}
                      sx={{
                        height: 6, borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': { bgcolor: STATUS_COLOR[item.status] },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                  <Tooltip title="Add Cost Entry">
                    <IconButton size="small" onClick={() => { costForm.reset({ entryDate: new Date().toISOString().split('T')[0] }); setCostOpen(item); }}>
                      <ReceiptIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEditItem(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => setDeleteItem(item)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
        {!isLoading && items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No budget items yet. Add line items to start tracking costs.</Typography>
          </Box>
        )}
      </Stack>

      {/* Add/Edit Budget Item Dialog */}
      <Dialog open={itemOpen} onClose={() => setItemOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editItem ? 'Edit Budget Item' : 'Add Budget Line Item'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="item-form" onSubmit={form.handleSubmit(onItemSubmit)} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField {...form.register('name')} label="Item Name *" fullWidth />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select {...form.register('category')} label="Category" defaultValue={BudgetCategory.OTHER}>
                  {Object.values(BudgetCategory).map((c) => (
                    <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField {...form.register('budgetedAmount')} label="Budgeted Amount (₹) *" type="number" fullWidth />
              <TextField {...form.register('description')} label="Description" fullWidth multiline rows={2} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setItemOpen(false)}>Cancel</Button>
          <Button type="submit" form="item-form" variant="contained">
            {editItem ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Cost Entry Dialog */}
      <Dialog open={!!costOpen} onClose={() => setCostOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Cost Entry — {costOpen?.name}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="cost-form" onSubmit={costForm.handleSubmit(onCostSubmit)} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField {...costForm.register('amount')} label="Amount (₹) *" type="number" fullWidth />
              <TextField {...costForm.register('entryDate')} label="Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField {...costForm.register('invoiceNumber')} label="Invoice No." fullWidth />
              <FormControl fullWidth>
                <InputLabel>Vendor (optional)</InputLabel>
                <Select {...costForm.register('vendorId')} label="Vendor (optional)" defaultValue="">
                  <MenuItem value="">None</MenuItem>
                  {vendors.map((v: { id: string; name: string }) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField {...costForm.register('description')} label="Description" fullWidth multiline rows={2} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCostOpen(null)}>Cancel</Button>
          <Button type="submit" form="cost-form" variant="contained" disabled={addCostMutation.isPending}>
            {addCostMutation.isPending ? 'Saving...' : 'Add Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete Budget Item"
        message={`Delete "${deleteItem?.name}"? All cost entries will also be removed.`}
        confirmLabel="Delete"
        onConfirm={() => deleteItem && deleteItemMutation.mutate(deleteItem.id)}
        onCancel={() => setDeleteItem(null)}
      />
    </Box>
  );
}
