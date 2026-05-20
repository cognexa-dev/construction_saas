import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel, LinearProgress,
  MenuItem, Select, Stack, TextField, Tooltip, Typography, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { estimationApi } from '@/api/estimation.api';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const CR = 10_000_000;
const fmtCr = (n: number) => `₹${(n / CR).toFixed(2)} Cr`;
const fmtRaw = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORIES = [
  { value: 'land', label: 'Land Cost', color: '#795548' },
  { value: 'construction', label: 'Construction', color: '#1565c0' },
  { value: 'labour', label: 'Labour', color: '#e65100' },
  { value: 'professional_fees', label: 'Professional Fees', color: '#6a1b9a' },
  { value: 'approvals', label: 'Approvals & Statutory', color: '#2e7d32' },
  { value: 'finance', label: 'Finance Cost', color: '#c62828' },
  { value: 'marketing', label: 'Sales & Marketing', color: '#f57c00' },
  { value: 'overheads', label: 'Staff & Overheads', color: '#00695c' },
  { value: 'other', label: 'Other', color: '#546e7a' },
];


type EstimationItem = {
  id: string;
  category: string;
  description: string;
  amount: string;
  quantity: string | null;
  unit: string | null;
  ratePerUnit: string | null;
  notes: string | null;
};

type Summary = {
  byCategory: Record<string, number>;
  boqTotal: number;
  subtotal: number;
  contingencyPct: number;
  contingency: number;
  profitPct: number;
  profit: number;
  gstPct: number;
  gst: number;
  totalBeforeProfit: number;
  totalBeforeGst: number;
  grandTotal: number;
};

type ItemFormData = {
  category: string;
  description: string;
  amount: number;
  quantity: string;
  unit: string;
  ratePerUnit: string;
  notes: string;
};

type SettingsFormData = {
  contingencyPct: number;
  profitPct: number;
  gstPct: number;
  notes: string;
};

function SummaryRow({ label, value, bold, color, indent }: {
  label: string; value: string; bold?: boolean; color?: string; indent?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, pl: indent ? 2 : 0 }}>
      <Typography variant={bold ? 'subtitle2' : 'body2'} color={color ?? 'text.primary'} fontWeight={bold ? 700 : 400}>
        {label}
      </Typography>
      <Typography variant={bold ? 'subtitle2' : 'body2'} fontWeight={bold ? 700 : 500} color={color ?? 'text.primary'}>
        {value}
      </Typography>
    </Box>
  );
}

export default function EstimationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isMgmt = hasRole(UserRole.ADMIN, UserRole.OWNER);

  const [itemDialog, setItemDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [editItem, setEditItem] = useState<EstimationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EstimationItem | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['estimation', projectId],
    queryFn: () => estimationApi.getByProject(projectId!),
    enabled: !!projectId,
  });

  const itemForm = useForm<ItemFormData>({
    defaultValues: { category: 'construction', description: '', amount: 0, quantity: '', unit: '', ratePerUnit: '', notes: '' },
  });

  const settingsForm = useForm<SettingsFormData>({
    defaultValues: { contingencyPct: 5, profitPct: 20, gstPct: 12, notes: '' },
  });

  const addMutation = useMutation({
    mutationFn: (payload: object) => estimationApi.addItem(projectId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimation', projectId] });
      setItemDialog(false);
      itemForm.reset();
      enqueueSnackbar('Item added', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to add item', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) => estimationApi.updateItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimation', projectId] });
      setItemDialog(false);
      setEditItem(null);
      itemForm.reset();
      enqueueSnackbar('Item updated', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Update failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => estimationApi.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimation', projectId] });
      setDeleteTarget(null);
      enqueueSnackbar('Item deleted', { variant: 'success' });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (payload: object) => estimationApi.updateSettings(projectId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimation', projectId] });
      setSettingsDialog(false);
      enqueueSnackbar('Settings saved', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to save settings', { variant: 'error' }),
  });

  const openCreate = () => {
    setEditItem(null);
    itemForm.reset({ category: 'construction', description: '', amount: 0, quantity: '', unit: '', ratePerUnit: '', notes: '' });
    setItemDialog(true);
  };

  const openEdit = (item: EstimationItem) => {
    setEditItem(item);
    itemForm.reset({
      category: item.category,
      description: item.description,
      amount: parseFloat(item.amount),
      quantity: item.quantity ?? '',
      unit: item.unit ?? '',
      ratePerUnit: item.ratePerUnit ?? '',
      notes: item.notes ?? '',
    });
    setItemDialog(true);
  };

  const openSettings = () => {
    const est = data?.estimation;
    settingsForm.reset({
      contingencyPct: parseFloat(est?.contingencyPct ?? '5'),
      profitPct: parseFloat(est?.profitPct ?? '20'),
      gstPct: parseFloat(est?.gstPct ?? '12'),
      notes: est?.notes ?? '',
    });
    setSettingsDialog(true);
  };

  const onItemSubmit = (d: ItemFormData) => {
    const qty = d.quantity ? parseFloat(d.quantity) : undefined;
    const rate = d.ratePerUnit ? parseFloat(d.ratePerUnit) : undefined;
    const payload = {
      category: d.category,
      description: d.description,
      amount: Number(d.amount),
      quantity: qty,
      unit: d.unit || undefined,
      ratePerUnit: rate,
      notes: d.notes || undefined,
    };
    if (editItem) updateMutation.mutate({ id: editItem.id, payload });
    else addMutation.mutate(payload);
  };

  const onSettingsSubmit = (d: SettingsFormData) => {
    settingsMutation.mutate(d);
  };

  const estimation = data?.estimation;
  const summary: Summary | undefined = data?.summary;
  const project = data?.project;
  const items: EstimationItem[] = estimation?.items ?? [];

  // Group items by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat.value);
    if (catItems.length > 0) acc[cat.value] = catItems;
    return acc;
  }, {} as Record<string, EstimationItem[]>);

  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">Failed to load estimation data.</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {project?.name ?? 'Project'} — Cost Estimation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Build your project cost estimate and compare against actuals
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMgmt && (
            <>
              <Tooltip title="Estimation Settings (Contingency, Profit, GST %)">
                <Button variant="outlined" startIcon={<SettingsIcon />} onClick={openSettings} size="small">
                  Settings
                </Button>
              </Tooltip>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Add Item
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left — Item List */}
        <Grid item xs={12} md={8}>

          {/* BOQ Reference Card */}
          {summary && summary.boqTotal > 0 && (
            <Card variant="outlined" sx={{ mb: 2, borderColor: 'primary.main', borderStyle: 'dashed' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    <strong>BOQ Reference:</strong> Total estimated cost from Bill of Quantities is{' '}
                    <strong>{fmtCr(summary.boqTotal)}</strong>
                    {' '}— use this as your construction cost baseline.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Category Groups */}
          {CATEGORIES.map((cat) => {
            const catItems = grouped[cat.value];
            const catTotal = summary?.byCategory[cat.value] ?? 0;
            if (!catItems && catTotal === 0) return null;

            return (
              <Box key={cat.value} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color }} />
                  <Typography variant="subtitle1" fontWeight={600}>{cat.label}</Typography>
                  {catTotal > 0 && (
                    <Chip label={fmtCr(catTotal)} size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
                  )}
                </Box>

                <Stack spacing={1}>
                  {(catItems ?? []).map((item) => (
                    <Card key={item.id} variant="outlined" sx={{ borderLeft: 3, borderColor: cat.color }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Grid container alignItems="center" spacing={1}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" fontWeight={600}>{item.description}</Typography>
                            {item.quantity && item.unit && (
                              <Typography variant="caption" color="text.secondary">
                                {parseFloat(item.quantity).toFixed(2)} {item.unit.toUpperCase()}
                                {item.ratePerUnit && ` × ₹${parseFloat(item.ratePerUnit).toLocaleString('en-IN')}`}
                              </Typography>
                            )}
                            {item.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">{item.notes}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                              {fmtCr(parseFloat(item.amount))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fmtRaw(parseFloat(item.amount))}
                            </Typography>
                          </Grid>
                          {isMgmt && (
                            <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEdit(item)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            );
          })}

          {items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CalculateIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">No estimation items yet.</Typography>
              {isMgmt && (
                <Button variant="contained" sx={{ mt: 2 }} onClick={openCreate}>
                  Add First Item
                </Button>
              )}
            </Box>
          )}
        </Grid>

        {/* Right — Summary Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Cost Summary
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              {summary ? (
                <>
                  {/* Category breakdown */}
                  {CATEGORIES.map((cat) => {
                    const val = summary.byCategory[cat.value] ?? 0;
                    if (val === 0) return null;
                    return (
                      <SummaryRow
                        key={cat.value}
                        label={cat.label}
                        value={fmtCr(val)}
                        indent
                      />
                    );
                  })}

                  <Divider sx={{ my: 1 }} />
                  <SummaryRow label="Subtotal" value={fmtCr(summary.subtotal)} bold />

                  <SummaryRow
                    label={`Contingency (${summary.contingencyPct}%)`}
                    value={fmtCr(summary.contingency)}
                    color="text.secondary"
                    indent
                  />
                  <SummaryRow label="Total (incl. Contingency)" value={fmtCr(summary.totalBeforeProfit)} bold />

                  <SummaryRow
                    label={`Developer Profit (${summary.profitPct}%)`}
                    value={fmtCr(summary.profit)}
                    color="success.main"
                    indent
                  />
                  <SummaryRow label="Total (incl. Profit)" value={fmtCr(summary.totalBeforeGst)} bold />

                  <SummaryRow
                    label={`GST (${summary.gstPct}%)`}
                    value={fmtCr(summary.gst)}
                    color="warning.main"
                    indent
                  />

                  <Divider sx={{ my: 1 }} />
                  <SummaryRow
                    label="Grand Total"
                    value={fmtCr(summary.grandTotal)}
                    bold
                    color="primary.main"
                  />

                  {/* Comparison with project budget */}
                  {project?.totalBudget && parseFloat(project.totalBudget) > 0 && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        vs. Project Budget
                      </Typography>
                      <SummaryRow
                        label="Project Budget"
                        value={fmtCr(parseFloat(project.totalBudget))}
                      />
                      {(() => {
                        const diff = summary.grandTotal - parseFloat(project.totalBudget);
                        const over = diff > 0;
                        return (
                          <SummaryRow
                            label={over ? 'Over Budget' : 'Under Budget'}
                            value={fmtCr(Math.abs(diff))}
                            color={over ? 'error.main' : 'success.main'}
                            bold
                          />
                        );
                      })()}
                    </>
                  )}

                  {/* BOQ reference */}
                  {summary.boqTotal > 0 && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        BOQ Reference
                      </Typography>
                      <SummaryRow label="BOQ Estimated Cost" value={fmtCr(summary.boqTotal)} />
                    </>
                  )}
                </>
              ) : (
                <Typography color="text.secondary" variant="body2">Add items to see the cost summary.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add / Edit Item Dialog */}
      <Dialog open={itemDialog} onClose={() => { setItemDialog(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Estimation Item' : 'Add Estimation Item'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Controller name="category" control={itemForm.control} render={({ field }) => (
                  <Select {...field} label="Category">
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </Select>
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...itemForm.register('description')}
                label="Description *"
                fullWidth
                placeholder="e.g. Land purchase — Survey No. 123, Ahmedabad"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                {...itemForm.register('quantity')}
                label="Quantity"
                type="number"
                fullWidth
                inputProps={{ step: '0.001', min: '0' }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                {...itemForm.register('unit')}
                label="Unit"
                fullWidth
                placeholder="sqmt, nos, ls"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                {...itemForm.register('ratePerUnit')}
                label="Rate/Unit (₹)"
                type="number"
                fullWidth
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...itemForm.register('amount')}
                label="Amount (₹) *"
                type="number"
                fullWidth
                inputProps={{ step: '1', min: '0' }}
                helperText="If quantity × rate are filled, amount is auto-calculated on save"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...itemForm.register('notes')}
                label="Notes"
                fullWidth
                multiline
                rows={2}
                placeholder="Optional — basis of estimate, assumptions, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setItemDialog(false); setEditItem(null); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={itemForm.handleSubmit(onItemSubmit)}
            disabled={addMutation.isPending || updateMutation.isPending}
          >
            {editItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Estimation Settings</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              {...settingsForm.register('contingencyPct', { valueAsNumber: true })}
              label="Contingency %"
              type="number"
              fullWidth
              inputProps={{ step: '0.5', min: '0', max: '20' }}
              helperText="Typically 3–5% of subtotal"
            />
            <TextField
              {...settingsForm.register('profitPct', { valueAsNumber: true })}
              label="Developer Profit %"
              type="number"
              fullWidth
              inputProps={{ step: '0.5', min: '0', max: '50' }}
              helperText="Typically 15–25% for Gujarat residential"
            />
            <TextField
              {...settingsForm.register('gstPct', { valueAsNumber: true })}
              label="GST %"
              type="number"
              fullWidth
              inputProps={{ step: '0.5', min: '0', max: '28' }}
              helperText="5% affordable housing / 12% others"
            />
            <TextField
              {...settingsForm.register('notes')}
              label="Notes / Assumptions"
              fullWidth
              multiline
              rows={3}
              placeholder="General estimation assumptions for this project"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={settingsForm.handleSubmit(onSettingsSubmit)}
            disabled={settingsMutation.isPending}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Estimation Item"
        message={`Delete "${deleteTarget?.description}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
