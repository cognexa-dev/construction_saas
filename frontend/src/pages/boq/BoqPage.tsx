import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress,
  MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography, FormControl, InputLabel, Select, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import LinkIcon from '@mui/icons-material/Link';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { boqApi } from '@/api/boq.api';
import { projectApi } from '@/api/project.api';
import { inventoryApi } from '@/api/inventory.api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const CR = 10_000_000;
const fmtCr = (n: number) => `₹${(n / CR).toFixed(2)} Cr`;
const fmtN  = (n: number, d = 2) => n.toLocaleString('en-IN', { maximumFractionDigits: d });
const fmtQty = (n: string | number, unit: string) => `${parseFloat(String(n)).toFixed(2)} ${unit.toUpperCase()}`;

const CATEGORIES = [
  'earthwork','concrete','steel','masonry','plastering',
  'flooring','waterproofing','formwork','painting','doors_windows',
  'plumbing','electrical','other',
];
const UNITS = ['m3','m2','mt','kg','nos','rmt','bags','sqft','ls'];
const UNIT_LABELS: Record<string, string> = {
  m3:'m³', m2:'m²', mt:'MT', kg:'KG', nos:'Nos', rmt:'RMT', bags:'Bags', sqft:'Sqft', ls:'LS',
};
const CAT_COLORS: Record<string, string> = {
  concrete:'#1565c0', steel:'#6a1b9a', earthwork:'#4e342e', masonry:'#e65100',
  plastering:'#f57c00', flooring:'#2e7d32', waterproofing:'#00695c', formwork:'#558b2f',
  painting:'#c62828', doors_windows:'#283593', plumbing:'#0277bd', electrical:'#f9a825', other:'#546e7a',
};

type BoqItemMaterial = {
  id: string; boqItemId: string; inventoryItemId: string; consumptionRate: string;
  inventoryItem: { id: string; name: string; sku: string; unit: string; unitPrice: string; currentStock: string; isLowStock: boolean };
  totalNeeded: number; totalConsumed: number; remaining: number; estimatedMaterialCost: number;
};

type BoqItem = {
  id: string; workItem: string; category: string; unit: string;
  estimatedQty: string; executedQty: string; ratePerUnit: string;
  plannedMonth: string | null; progressPct: number;
  estimatedCost: number; actualCost: number; remarks: string | null;
  materials: BoqItemMaterial[];
};

type BoqFormData = {
  workItem: string; category: string; unit: string;
  estimatedQty: number; executedQty: number; ratePerUnit: number;
  plannedMonth: string; remarks: string;
};

// ─── Chart tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
      <Typography variant="caption" fontWeight={700}>{label}</Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="caption" display="block" color={p.name === 'Estimated' ? 'primary.main' : 'warning.main'}>
          {p.name}: {fmtCr(p.value)}
        </Typography>
      ))}
    </Box>
  );
};

// ─── Materials Dialog ─────────────────────────────────────────────────────────
function MaterialsDialog({ item, open, onClose }: { item: BoqItem; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [selInvId, setSelInvId] = useState('');
  const [rate, setRate] = useState('');

  const { data: allInv = [] } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: async () => {
      const d = await inventoryApi.getAll({ limit: 200 });
      return d.data ?? [];
    },
    enabled: open,
  });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['boq-materials', item.id],
    queryFn: () => boqApi.getMaterials(item.id),
    enabled: open,
  });

  const addMut = useMutation({
    mutationFn: () => boqApi.addMaterial(item.id, selInvId, Number(rate)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boq-materials', item.id] });
      qc.invalidateQueries({ queryKey: ['boq'] });
      setSelInvId(''); setRate('');
      enqueueSnackbar('Material linked', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to link material', { variant: 'error' }),
  });

  const removeMut = useMutation({
    mutationFn: boqApi.removeMaterial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boq-materials', item.id] });
      qc.invalidateQueries({ queryKey: ['boq'] });
      enqueueSnackbar('Material removed', { variant: 'success' });
    },
  });

  const mats: BoqItemMaterial[] = materials;
  const totalMatCost = mats.reduce((s, m) => s + m.estimatedMaterialCost, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon fontSize="small" color="primary" />
          Material Links — {item.workItem}
        </Box>
        <Typography variant="caption" color="text.secondary">
          Unit: {UNIT_LABELS[item.unit] ?? item.unit} · Est: {fmtQty(item.estimatedQty, item.unit)} · Executed: {fmtQty(item.executedQty, item.unit)}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

        {mats.length === 0 && !isLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No materials linked yet. Add materials below to enable automatic inventory deduction when BOQ execution is updated.
          </Alert>
        )}

        {mats.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Rate / {UNIT_LABELS[item.unit] ?? item.unit}</TableCell>
                  <TableCell align="right">Total Needed</TableCell>
                  <TableCell align="right">Consumed</TableCell>
                  <TableCell align="right">In Stock</TableCell>
                  <TableCell align="right">Est. Cost</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {mats.map((mat) => {
                  const stockOk = parseFloat(mat.inventoryItem.currentStock) >= mat.remaining;
                  return (
                    <TableRow key={mat.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{mat.inventoryItem.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{mat.inventoryItem.sku}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {fmtN(parseFloat(mat.consumptionRate), 4)} {mat.inventoryItem.unit}
                      </TableCell>
                      <TableCell align="right">{fmtN(mat.totalNeeded)} {mat.inventoryItem.unit}</TableCell>
                      <TableCell align="right">{fmtN(mat.totalConsumed)} {mat.inventoryItem.unit}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {!stockOk && <WarningAmberIcon fontSize="inherit" color="warning" />}
                          <Typography variant="body2" color={stockOk ? 'success.main' : 'error.main'} fontWeight={600}>
                            {fmtN(parseFloat(mat.inventoryItem.currentStock))} {mat.inventoryItem.unit}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">₹{fmtN(mat.estimatedMaterialCost)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => removeMut.mutate(mat.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={5} align="right">
                    <Typography variant="caption" fontWeight={700}>Total Material Cost</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      ₹{fmtN(totalMatCost)}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Link New Material</Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Inventory Item</InputLabel>
              <Select value={selInvId} label="Inventory Item" onChange={(e) => setSelInvId(e.target.value)}>
                {(allInv as { id: string; name: string; sku: string; unit: string }[]).map((inv) => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {inv.name} <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({inv.sku} · {inv.unit})</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              size="small" fullWidth type="number"
              label={`Consumption rate (per ${UNIT_LABELS[item.unit] ?? item.unit})`}
              value={rate} onChange={(e) => setRate(e.target.value)}
              inputProps={{ min: 0, step: '0.0001' }}
              helperText="e.g. 6 bags per m³ of RCC"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained" fullWidth startIcon={<AddIcon />}
              disabled={!selInvId || !rate || addMut.isPending}
              onClick={() => addMut.mutate()}
            >
              Link
            </Button>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BoqPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isMgmt = hasRole(UserRole.ADMIN, UserRole.OWNER);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<BoqItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoqItem | null>(null);
  const [matItem, setMatItem] = useState<BoqItem | null>(null);

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getById(projectId!),
    enabled: !!projectId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['boq', projectId],
    queryFn: () => boqApi.getByProject(projectId!),
    enabled: !!projectId,
  });

  const { control, register, handleSubmit, reset, watch } = useForm<BoqFormData>({
    defaultValues: { category: 'concrete', unit: 'm3', executedQty: 0, ratePerUnit: 0, plannedMonth: '', remarks: '' },
  });

  const watchExecutedQty = watch('executedQty');

  const createMutation = useMutation({
    mutationFn: (payload: object) => boqApi.create(projectId!, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boq'] }); setOpen(false); enqueueSnackbar('BOQ item added', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to add item', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) => boqApi.update(id, payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['boq'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setOpen(false); setEditItem(null);
      const warnings: string[] = result?.warnings ?? [];
      if (warnings.length > 0) {
        warnings.forEach((w: string) => enqueueSnackbar(w, { variant: 'warning', autoHideDuration: 6000 }));
      } else {
        enqueueSnackbar('Updated', { variant: 'success' });
      }
    },
    onError: () => enqueueSnackbar('Update failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: boqApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boq'] }); setDeleteTarget(null); enqueueSnackbar('Deleted', { variant: 'success' }); },
  });

  const openCreate = () => {
    setEditItem(null);
    reset({ category: 'concrete', unit: 'm3', executedQty: 0, ratePerUnit: 0, plannedMonth: '', remarks: '' });
    setOpen(true);
  };

  const openEdit = (item: BoqItem) => {
    setEditItem(item);
    reset({
      workItem: item.workItem, category: item.category, unit: item.unit,
      estimatedQty: parseFloat(item.estimatedQty),
      executedQty: parseFloat(item.executedQty),
      ratePerUnit: parseFloat(item.ratePerUnit),
      plannedMonth: item.plannedMonth ? item.plannedMonth.slice(0, 7) : '',
      remarks: item.remarks ?? '',
    });
    setOpen(true);
  };

  const onSubmit = (d: BoqFormData) => {
    const payload = {
      ...d,
      estimatedQty: Number(d.estimatedQty),
      executedQty: Number(d.executedQty),
      ratePerUnit: Number(d.ratePerUnit),
      plannedMonth: d.plannedMonth || undefined,
      remarks: d.remarks || undefined,
    };
    if (editItem) updateMutation.mutate({ id: editItem.id, payload });
    else createMutation.mutate(payload);
  };

  const items: BoqItem[] = data?.items ?? [];
  const summary = data?.summary;
  const monthlyData = data?.monthlyData ?? [];

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, BoqItem[]>);

  const chartData = monthlyData.map((m: { month: string; estimatedCost: number; actualCost: number }) => ({
    month: m.month,
    Estimated: parseFloat((m.estimatedCost / CR).toFixed(4)),
    Actual: parseFloat((m.actualCost / CR).toFixed(4)),
  }));

  // Consumption preview for edit dialog
  const consumptionPreview = editItem?.materials?.length
    ? (() => {
        const oldQty = parseFloat(editItem.executedQty);
        const newQty = Number(watchExecutedQty);
        const delta = newQty - oldQty;
        if (delta === 0) return null;
        return editItem.materials.map((mat) => ({
          name: mat.inventoryItem.name,
          unit: mat.inventoryItem.unit,
          qty: Math.abs(delta * parseFloat(mat.consumptionRate)),
          isReturn: delta < 0,
        }));
      })()
    : null;

  const unscheduledCount = items.filter((i) => !i.plannedMonth).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{projectData?.name ?? 'Project'} — Bill of Quantities</Typography>
          <Typography variant="body2" color="text.secondary">Track estimated vs executed quantities · automatic inventory deduction</Typography>
        </Box>
        {isMgmt && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Item</Button>}
      </Box>

      {/* Summary cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Items', value: summary.itemCount },
            { label: 'Overall Progress', value: `${summary.overallProgress}%`, color: summary.overallProgress >= 75 ? 'success.main' : summary.overallProgress >= 40 ? 'warning.main' : 'text.primary' },
            { label: 'Estimated Cost', value: fmtCr(summary.totalEstimatedCost), color: 'primary.main' },
            { label: 'Actual Cost', value: fmtCr(summary.totalActualCost), color: 'warning.main' },
          ].map((c) => (
            <Grid item xs={6} sm={3} key={c.label}>
              <Card><CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h5" fontWeight={700} color={c.color ?? 'text.primary'}>{c.value}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Monthly bar chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BarChartIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>Monthly Cost Breakdown</Typography>
            {unscheduledCount > 0 && (
              <Chip label={`${unscheduledCount} unscheduled`} size="small" variant="outlined" sx={{ ml: 'auto', fontSize: 11 }} />
            )}
          </Box>
          {chartData.length === 0
            ? <Alert severity="info">Assign a <strong>Planned Month</strong> to BOQ items to see the chart.</Alert>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}Cr`} width={68} />
                  <RTooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Estimated" fill="#1976d2" radius={[4,4,0,0]} maxBarSize={48} />
                  <Bar dataKey="Actual" fill="#ed6c02" radius={[4,4,0,0]} maxBarSize={48}>
                    {chartData.map((entry: { Estimated: number; Actual: number }, i: number) => (
                      <Cell key={i} fill={entry.Actual > entry.Estimated ? '#d32f2f' : '#ed6c02'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </CardContent>
      </Card>

      {/* Category-grouped items */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <Box key={cat} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: CAT_COLORS[cat] ?? '#546e7a' }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</Typography>
            <Chip label={catItems.length} size="small" sx={{ height: 18, fontSize: 11 }} />
          </Box>

          <Stack spacing={1}>
            {catItems.map((item) => (
              <Card key={item.id} variant="outlined" sx={{ borderLeft: 3, borderColor: CAT_COLORS[item.category] ?? '#546e7a' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" fontWeight={600}>{item.workItem}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rate: ₹{parseFloat(item.ratePerUnit).toLocaleString('en-IN')}/{UNIT_LABELS[item.unit] ?? item.unit}
                      </Typography>
                      {item.plannedMonth && (
                        <Chip
                          label={new Date(item.plannedMonth).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          size="small" variant="outlined" color="primary"
                          sx={{ display: 'block', width: 'fit-content', mt: 0.5, fontSize: 10, height: 18 }}
                        />
                      )}
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Box sx={{ mb: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            {fmtQty(item.executedQty, item.unit)} / {fmtQty(item.estimatedQty, item.unit)}
                          </Typography>
                          <Typography variant="caption" fontWeight={700}
                            color={item.progressPct >= 100 ? 'success.main' : item.progressPct >= 50 ? 'warning.main' : 'text.secondary'}>
                            {item.progressPct}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={Math.min(100, item.progressPct)}
                          color={item.progressPct >= 100 ? 'success' : item.progressPct >= 50 ? 'warning' : 'primary'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      {item.remarks && <Typography variant="caption" color="text.secondary" noWrap>{item.remarks}</Typography>}
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary" display="block">Est: {fmtCr(item.estimatedCost)}</Typography>
                      <Typography variant="caption" color="warning.main" fontWeight={600}>Act: {fmtCr(item.actualCost)}</Typography>
                    </Grid>

                    {/* Material chips */}
                    <Grid item xs={12} sm={2}>
                      {item.materials?.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.materials.slice(0, 3).map((m) => {
                            const insufficient = parseFloat(m.inventoryItem.currentStock) < m.remaining;
                            return (
                              <Chip
                                key={m.id}
                                label={`${m.inventoryItem.name}`}
                                size="small"
                                color={insufficient ? 'warning' : 'default'}
                                icon={insufficient ? <WarningAmberIcon /> : undefined}
                                sx={{ fontSize: 10, height: 20 }}
                              />
                            );
                          })}
                          {item.materials.length > 3 && (
                            <Chip label={`+${item.materials.length - 3}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">No materials</Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Manage Materials">
                        <IconButton size="small" color="primary" onClick={() => setMatItem(item)}>
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isMgmt && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      ))}

      {!isLoading && items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No BOQ items yet.</Typography>
          {isMgmt && <Button variant="contained" sx={{ mt: 2 }} onClick={openCreate}>Add First Item</Button>}
        </Box>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit BOQ Item' : 'Add BOQ Item'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="boq-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField {...register('workItem')} label="Work Item *" fullWidth placeholder="e.g. RCC Slab — Ground Floor" />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Controller name="category" control={control} render={({ field }) => (
                    <Select {...field} label="Category">
                      {CATEGORIES.map((c) => <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c.replace('_', ' ')}</MenuItem>)}
                    </Select>
                  )} />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Controller name="unit" control={control} render={({ field }) => (
                    <Select {...field} label="Unit">
                      {UNITS.map((u) => <MenuItem key={u} value={u}>{UNIT_LABELS[u]}</MenuItem>)}
                    </Select>
                  )} />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField {...register('estimatedQty')} label="Estimated Qty *" type="number" inputProps={{ step: '0.001', min: '0' }} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...register('executedQty')} label="Executed Qty" type="number" inputProps={{ step: '0.001', min: '0' }} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...register('ratePerUnit')} label="Rate per Unit (₹)" type="number" inputProps={{ step: '0.01', min: '0' }} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...register('plannedMonth')} label="Planned Month" type="month" fullWidth InputLabelProps={{ shrink: true }} helperText="Month this work is scheduled" />
              </Grid>
              <Grid item xs={12}>
                <TextField {...register('remarks')} label="Remarks" fullWidth multiline rows={2} placeholder="Optional site notes" />
              </Grid>
            </Grid>

            {/* Consumption preview */}
            {editItem && consumptionPreview && consumptionPreview.length > 0 && (
              <Alert severity={consumptionPreview[0].isReturn ? 'info' : 'warning'} sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight={700}>
                  {consumptionPreview[0].isReturn ? 'Return to inventory:' : 'Will deduct from inventory:'}
                </Typography>
                {consumptionPreview.map((p) => (
                  <Typography key={p.name} variant="caption" display="block">
                    • {fmtN(p.qty, 3)} {p.unit} of {p.name}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setOpen(false); setEditItem(null); }}>Cancel</Button>
          <Button type="submit" form="boq-form" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {editItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Materials dialog */}
      {matItem && (
        <MaterialsDialog item={matItem} open={!!matItem} onClose={() => setMatItem(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete BOQ Item"
        message={`Delete "${deleteTarget?.workItem}"?`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
