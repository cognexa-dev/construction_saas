import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, MenuItem, Select,
  TextField, Tooltip, Typography, FormControl, InputLabel, LinearProgress, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BusinessIcon from '@mui/icons-material/Business';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CalculateIcon from '@mui/icons-material/Calculate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '@/api/project.api';
import { aiApi, BudgetEstimateResult } from '@/api/ai.api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Project, ProjectStatus, ProjectType } from '@/types';
import { useSnackbar } from 'notistack';

const CR = 10_000_000;
const fmtCr = (n: number) => `₹${(n / CR).toFixed(2)} Cr`;
const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const GUJARAT_CITIES = [
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar',
  'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad', 'Other Gujarat',
];

type AiFormData = {
  builtUpArea: number;
  floors: number;
  unitsPerFloor: number;
  areaPerUnit: number;
  quality: 'economy' | 'standard' | 'premium';
  location: string;
  notes: string;
};

function AiBudgetDialog({ open, onClose, projectName, projectType, onAccept }: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectType: string;
  onAccept: (totalCrores: string) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [estimate, setEstimate] = useState<BudgetEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, watch, setValue: setAiValue, formState: { errors } } = useForm<AiFormData>({
    defaultValues: { floors: 4, unitsPerFloor: 0, areaPerUnit: 0, quality: 'standard', location: 'Ahmedabad', notes: '' },
  });

  const watchUnits = watch('unitsPerFloor');
  const watchArea = watch('areaPerUnit');
  const watchFloors = watch('floors');
  const calcTotal = Number(watchUnits) > 0 && Number(watchArea) > 0
    ? Number(watchUnits) * Number(watchArea) * Number(watchFloors)
    : 0;

  const onEstimate = async (d: AiFormData) => {
    setLoading(true);
    setError('');
    setEstimate(null);
    try {
      const result = await aiApi.estimateBudget({
        projectName: projectName || 'New Project',
        projectType: projectType || 'residential',
        builtUpArea: Number(d.builtUpArea),
        floors: Number(d.floors),
        quality: d.quality,
        location: d.location,
        notes: d.notes || undefined,
      });
      setEstimate(result);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'AI estimation failed. Try again.';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!estimate) return;
    const crores = (estimate.totalBudget / CR).toFixed(2);
    onAccept(crores);
    onClose();
    setEstimate(null);
    reset();
  };

  const handleClose = () => {
    onClose();
    setEstimate(null);
    setError('');
    reset();
  };

  const rows = estimate ? [
    { label: 'Construction (Civil)', value: estimate.constructionCost },
    { label: 'MEP (Plumbing/Electrical)', value: estimate.mepCost },
    { label: 'Finishing', value: estimate.finishingCost },
    { label: 'Professional Fees', value: estimate.professionalFees },
    { label: 'Approvals & Statutory', value: estimate.approvalCost },
    { label: 'Contingency', value: estimate.contingency },
  ] : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon color="secondary" fontSize="small" />
        AI Budget Estimator
      </DialogTitle>
      <DialogContent dividers>
        {!estimate ? (
          <Box component="form" id="ai-form" onSubmit={handleSubmit(onEstimate)} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fill in a few project details and AI will estimate your budget using current Gujarat market rates.
            </Typography>
            <Grid container spacing={2}>
              {/* Quick calculator: units × area × floors → auto-fill total */}
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Option A — Calculate from units (leave blank to skip)
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  {...register('unitsPerFloor', { min: 0 })}
                  label="Units per Floor"
                  type="number"
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                  helperText="e.g. 4 flats/floor"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  {...register('areaPerUnit', { min: 0 })}
                  label="Area per Unit (sqft)"
                  type="number"
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: 50 }}
                  helperText="e.g. 1200 sqft/flat"
                />
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ pt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Calculated total</Typography>
                  <Typography variant="body2" fontWeight={700} color={calcTotal > 0 ? 'primary.main' : 'text.disabled'}>
                    {calcTotal > 0 ? `${calcTotal.toLocaleString('en-IN')} sqft` : '—'}
                  </Typography>
                  {calcTotal > 0 && (
                    <Button size="small" sx={{ p: 0, minWidth: 0, fontSize: 11 }}
                      onClick={() => setAiValue('builtUpArea', calcTotal)}>
                      Use this ↓
                    </Button>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Option B — Enter total project area directly
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('builtUpArea', { required: true, min: 100 })}
                  label="Total Built-up Area (sqft) *"
                  type="number"
                  fullWidth
                  inputProps={{ min: 100, step: 100 }}
                  error={!!errors.builtUpArea}
                  helperText={errors.builtUpArea ? 'Required, min 100 sqft' : 'Entire project — all units × all floors'}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('floors', { required: true, min: 1 })}
                  label="Number of Floors *"
                  type="number"
                  fullWidth
                  inputProps={{ min: 1, max: 50, step: 1 }}
                  error={!!errors.floors}
                  helperText="G+4 = 5, stilt+G+3 = 5, etc."
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('quality', { required: true })}
                  select
                  label="Quality Grade *"
                  fullWidth
                  defaultValue="standard"
                >
                  <MenuItem value="economy">Economy (₹1,200–1,500/sqft)</MenuItem>
                  <MenuItem value="standard">Standard (₹1,500–2,000/sqft)</MenuItem>
                  <MenuItem value="premium">Premium (₹2,000–3,000/sqft)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('location', { required: true })}
                  select
                  label="Location *"
                  fullWidth
                  defaultValue="Ahmedabad"
                >
                  {GUJARAT_CITIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('notes')}
                  label="Additional Notes (optional)"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g. Basement parking, swimming pool, solar panels..."
                />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        ) : (
          <Box>
            {/* Breakdown Table */}
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Cost Breakdown</Typography>
            {rows.map((r) => (
              <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                <Typography variant="body2" fontWeight={500}>{fmtINR(r.value)} ({fmtCr(r.value)})</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>Total Budget</Typography>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                {fmtCr(estimate.totalBudget)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              ₹{estimate.ratePerSqft.toLocaleString('en-IN')}/sqft effective rate
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }} icon={<AutoAwesomeIcon />}>
              <Typography variant="body2">{estimate.explanation}</Typography>
            </Alert>

            {estimate.assumptions?.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Assumptions:</Typography>
                {estimate.assumptions.map((a, i) => (
                  <Typography key={i} variant="caption" color="text.secondary" display="block">• {a}</Typography>
                ))}
              </Box>
            )}

            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
              Model: {estimate.model}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => { setEstimate(null); setError(''); }}
            >
              Re-estimate with different parameters
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        {!estimate ? (
          <Button
            type="submit"
            form="ai-form"
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            disabled={loading}
          >
            {loading ? 'Estimating… (may take 30–60s)' : 'Estimate with AI'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleAccept}
          >
            Use ₹{(estimate.totalBudget / CR).toFixed(2)} Cr
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

const STATUS_COLORS: Record<ProjectStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  [ProjectStatus.PLANNING]: 'info',
  [ProjectStatus.ACTIVE]: 'success',
  [ProjectStatus.ON_HOLD]: 'warning',
  [ProjectStatus.COMPLETED]: 'default',
  [ProjectStatus.CANCELLED]: 'error',
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => projectApi.getAll({ status: statusFilter || undefined, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setOpen(false); enqueueSnackbar('Project created', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to create project', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => projectApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setEditProject(null); enqueueSnackbar('Project updated', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Update failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: projectApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setDeleteProject(null); enqueueSnackbar('Project deleted', { variant: 'success' }); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const form = useForm();

  const onSubmit = (d: Record<string, unknown>) => {
    const cleaned = Object.fromEntries(
      Object.entries(d).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    if (cleaned.totalBudget) {
      cleaned.totalBudget = String(parseFloat(String(cleaned.totalBudget)) * 10_000_000);
    }
    if (cleaned.landArea) {
      cleaned.landArea = String(cleaned.landArea);
    }
    if (editProject) {
      updateMutation.mutate({ id: editProject.id, data: cleaned });
    } else {
      createMutation.mutate(cleaned);
    }
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    form.reset({
      name: p.name, location: p.location ?? '', type: p.type,
      status: p.status, startDate: p.startDate ?? '', expectedEndDate: p.expectedEndDate ?? '',
      totalBudget: p.totalBudget ? (parseFloat(p.totalBudget) / 10_000_000).toFixed(2) : '',
      reraNumber: p.reraNumber ?? '',
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditProject(null);
    form.reset({
      name: '', location: '', reraNumber: '', description: '',
      totalBudget: '', landArea: '', startDate: '', expectedEndDate: '',
      type: ProjectType.RESIDENTIAL, status: ProjectStatus.PLANNING,
    });
    setOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Projects</Typography>
          <Typography color="text.secondary" variant="body2">Manage construction projects across Gujarat</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Project</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select value={statusFilter} label="Filter by Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.values(ProjectStatus).map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load projects.</Alert>}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {(data?.data ?? []).map((project) => (
          <Grid item xs={12} sm={6} lg={4} key={project.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="primary.main" fontWeight={600}>{project.code}</Typography>
                  </Box>
                  <Chip
                    label={project.status.replace('_', ' ')}
                    size="small"
                    color={STATUS_COLORS[project.status]}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom noWrap>{project.name}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>{project.location || '—'}</Typography>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Total Budget</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      ₹{(parseFloat(project.totalBudget) / 10_000_000).toFixed(2)} Cr
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <Chip label={project.type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    {project.reraNumber && <Chip label={`RERA: ${project.reraNumber}`} size="small" color="success" variant="outlined" />}
                  </Box>
                </Box>
              </CardContent>

              <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title="View Budget">
                  <IconButton size="small" onClick={() => navigate(`/budget/${project.id}`)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cost Estimation">
                  <IconButton size="small" onClick={() => navigate(`/estimation/${project.id}`)}>
                    <CalculateIcon fontSize="small" color="secondary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Bill of Quantities">
                  <IconButton size="small" onClick={() => navigate(`/boq/${project.id}`)}>
                    <FormatListNumberedIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => openEdit(project)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => setDeleteProject(project)}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}

        {!isLoading && data?.data.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No projects yet</Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={openCreate}>Create First Project</Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="proj-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField {...form.register('name')} label="Project Name *" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...form.register('location')} label="Location" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...form.register('reraNumber')} label="RERA Number" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Controller
                    name="type"
                    control={form.control}
                    defaultValue={ProjectType.RESIDENTIAL}
                    render={({ field }) => (
                      <Select {...field} label="Type">
                        {Object.values(ProjectType).map((t) => (
                          <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Controller
                    name="status"
                    control={form.control}
                    defaultValue={ProjectStatus.PLANNING}
                    render={({ field }) => (
                      <Select {...field} label="Status">
                        {Object.values(ProjectStatus).map((s) => (
                          <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...form.register('startDate')} label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...form.register('expectedEndDate')} label="Expected End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField {...form.register('totalBudget')} label="Total Budget (₹ Crores)" type="number" inputProps={{ step: '0.01', min: '0' }} fullWidth />
                  {!editProject && (
                    <Tooltip title="Estimate budget with AI">
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setAiDialogOpen(true)}
                        sx={{ minWidth: 44, px: 1, height: 56, flexShrink: 0 }}
                      >
                        <AutoAwesomeIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...form.register('landArea')} label="Land Area (sqmt)" type="number" fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField {...form.register('description')} label="Description" fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="proj-form" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {editProject ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteProject}
        title="Delete Project"
        message={`Delete "${deleteProject?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteProject && deleteMutation.mutate(deleteProject.id)}
        onCancel={() => setDeleteProject(null)}
      />

      <AiBudgetDialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        projectName={form.watch('name') as string}
        projectType={form.watch('type') as string}
        onAccept={(crores) => {
          form.setValue('totalBudget', crores);
          setAiDialogOpen(false);
        }}
      />
    </Box>
  );
}
