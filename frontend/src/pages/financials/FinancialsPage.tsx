import { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Tabs, Tab, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Alert, CircularProgress,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AccountBalance, Add, Edit, Delete,
  FileDownload, Receipt, Download,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { financialsApi } from '@/api/financials.api';
import { projectApi } from '@/api/project.api';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${n.toFixed(1)}%`;

const REVENUE_CATEGORIES = ['unit_sale', 'advance', 'installment', 'final_payment', 'rental', 'other'];
const PAYMENT_MODES = ['cash', 'cheque', 'neft', 'rtgs', 'upi', 'other'];
const REVENUE_STATUSES = ['expected', 'received', 'overdue', 'cancelled'];
const TALLY_EXPORT_TYPES = [
  { value: 'revenue_entries', label: 'Revenue Entries' },
  { value: 'cost_entries', label: 'Cost Entries' },
  { value: 'vendors', label: 'Vendor Master' },
  { value: 'full', label: 'Full Export' },
];

const STATUS_COLORS: Record<string, string> = {
  received: '#4caf50',
  expected: '#1565c0',
  overdue: '#f44336',
  cancelled: '#9e9e9e',
};

const revenueSchema = yup.object({
  projectId: yup.string().required('Project is required'),
  category: yup.string().required('Category is required'),
  status: yup.string().required(),
  description: yup.string().required('Description is required'),
  amount: yup.number().min(0).required('Amount is required'),
  gstAmount: yup.number().min(0).optional(),
  tdsAmount: yup.number().min(0).optional(),
  customerName: yup.string().optional(),
  unitNumber: yup.string().optional(),
  paymentMode: yup.string().optional(),
  expectedDate: yup.string().optional(),
  receivedDate: yup.string().optional(),
  referenceNumber: yup.string().optional(),
  notes: yup.string().optional(),
});

type RevenueFormData = yup.InferType<typeof revenueSchema>;

function StatCard({ title, value, subtitle, icon, color }: {
  title: string; value: string; subtitle?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20`, color }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function FinancialsPage() {
  const [tab, setTab] = useState(0);
  const [projectFilter, setProjectFilter] = useState('');
  const [revenueDialog, setRevenueDialog] = useState(false);
  const [editEntry, setEditEntry] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [exportType, setExportType] = useState('revenue_entries');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { hasRole } = useAuth();
  const isMgmt = hasRole(UserRole.ADMIN, UserRole.OWNER);
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['financials-dashboard', projectFilter],
    queryFn: () => financialsApi.getDashboard(projectFilter || undefined),
    retry: 1,
  });

  const { data: revenueEntries = [], isLoading: revLoading } = useQuery({
    queryKey: ['revenue-entries', projectFilter],
    queryFn: () => financialsApi.getRevenueEntries({ projectId: projectFilter || undefined }),
    enabled: tab === 1,
  });

  const { data: marginData, isLoading: marginLoading } = useQuery({
    queryKey: ['margin-analysis', projectFilter],
    queryFn: () => financialsApi.getMarginAnalysis(projectFilter || undefined),
    enabled: tab === 2,
  });

  const { data: exportLogs = [] } = useQuery({
    queryKey: ['export-logs'],
    queryFn: financialsApi.getExportLogs,
    enabled: tab === 3,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectApi.getAll().then((r) => r.data),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<RevenueFormData>({
    resolver: yupResolver(revenueSchema),
    defaultValues: { status: 'expected', gstAmount: 0, tdsAmount: 0 },
  });

  const createMutation = useMutation({
    mutationFn: financialsApi.createRevenueEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenue-entries'] });
      qc.invalidateQueries({ queryKey: ['financials-dashboard'] });
      enqueueSnackbar('Revenue entry created', { variant: 'success' });
      setRevenueDialog(false);
      reset();
    },
    onError: () => enqueueSnackbar('Failed to create entry', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RevenueFormData }) =>
      financialsApi.updateRevenueEntry(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenue-entries'] });
      qc.invalidateQueries({ queryKey: ['financials-dashboard'] });
      enqueueSnackbar('Revenue entry updated', { variant: 'success' });
      setRevenueDialog(false);
      setEditEntry(null);
      reset();
    },
    onError: () => enqueueSnackbar('Failed to update entry', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: financialsApi.deleteRevenueEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenue-entries'] });
      qc.invalidateQueries({ queryKey: ['financials-dashboard'] });
      enqueueSnackbar('Entry deleted', { variant: 'success' });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    reset({ status: 'expected', gstAmount: 0, tdsAmount: 0 });
    setEditEntry(null);
    setRevenueDialog(true);
  };

  const openEdit = (entry: Record<string, unknown>) => {
    setEditEntry(entry);
    reset({
      projectId: entry.projectId as string,
      category: entry.category as string,
      status: entry.status as string,
      description: entry.description as string,
      amount: parseFloat(entry.amount as string),
      gstAmount: parseFloat(entry.gstAmount as string),
      tdsAmount: parseFloat(entry.tdsAmount as string),
      customerName: (entry.customerName as string) || '',
      unitNumber: (entry.unitNumber as string) || '',
      paymentMode: (entry.paymentMode as string) || '',
      expectedDate: (entry.expectedDate as string) || '',
      receivedDate: (entry.receivedDate as string) || '',
      referenceNumber: (entry.referenceNumber as string) || '',
      notes: (entry.notes as string) || '',
    });
    setRevenueDialog(true);
  };

  const onSubmit = (data: RevenueFormData) => {
    if (editEntry) {
      updateMutation.mutate({ id: editEntry.id as string, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await financialsApi.exportTally({
        exportType,
        projectId: projectFilter || undefined,
        dateFrom: exportDateFrom || undefined,
        dateTo: exportDateTo || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const disp = response.headers['content-disposition'] || '';
      const match = disp.match(/filename="(.+?)"/);
      link.download = match ? match[1] : `tally_export_${exportType}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      qc.invalidateQueries({ queryKey: ['export-logs'] });
      enqueueSnackbar('Export downloaded', { variant: 'success' });
      setExportDialog(false);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const summary = dashboard?.summary;
  const monthlyRevenue = dashboard?.monthlyRevenue || [];
  const marginAggregate = dashboard?.margin;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Financials</Typography>
          <Typography variant="body2" color="text.secondary">Revenue tracking, margin analysis & Tally integration</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select size="small" label="Project" value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Projects</MenuItem>
            {(projects as Array<{ id: string; code: string; name: string }>).map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>
            ))}
          </TextField>
          {isMgmt && (
            <>
              <Button variant="outlined" startIcon={<FileDownload />} onClick={() => setExportDialog(true)}>
                Tally Export
              </Button>
              {tab === 1 && (
                <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                  Add Revenue
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      {dashLoading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue Received"
              value={fmt(summary.totalReceived)}
              icon={<AccountBalance />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Expected Revenue"
              value={fmt(summary.totalExpected)}
              icon={<TrendingUp />}
              color="#1565c0"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Overdue Payments"
              value={fmt(summary.totalOverdue)}
              icon={<TrendingDown />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Gross Margin"
              value={marginAggregate ? fmt(marginAggregate.grossMargin) : '—'}
              subtitle={marginAggregate && marginAggregate.totalRevenue > 0
                ? pct((marginAggregate.grossMargin / marginAggregate.totalRevenue) * 100)
                : undefined}
              icon={<Receipt />}
              color="#f57c00"
            />
          </Grid>
        </Grid>
      )}

      {dashError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load financial data. Please check that the backend is running and try again.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Dashboard" />
        <Tab label="Revenue Entries" />
        <Tab label="Margin Analysis" />
        <Tab label="Tally Logs" />
      </Tabs>

      {/* Tab 0: Dashboard */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Monthly Revenue Trend (Last 6 Months)
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `₹${(v / 10_000_000).toFixed(2)}Cr`} />
                    <RTooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="amount" stroke="#4caf50" fill="url(#revGrad)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Revenue by Category
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={summary?.byCategory || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₹${(v / 10_000_000).toFixed(2)}Cr`} />
                    <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 12 }} />
                    <RTooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="amount" fill="#1565c0" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          {/* Project margin overview */}
          {dashboard?.projects && dashboard.projects.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Project Financial Overview</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Project</TableCell>
                          <TableCell align="right">Budget</TableCell>
                          <TableCell align="right">Cost Incurred</TableCell>
                          <TableCell align="right">Revenue Received</TableCell>
                          <TableCell align="right">Gross Margin</TableCell>
                          <TableCell align="right">Margin %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(dashboard.projects as Array<Record<string, unknown>>).map((p) => (
                          <TableRow key={p.projectId as string}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{p.projectCode as string}</Typography>
                              <Typography variant="caption" color="text.secondary">{p.projectName as string}</Typography>
                            </TableCell>
                            <TableCell align="right">{fmt(p.totalBudget as number)}</TableCell>
                            <TableCell align="right">{fmt(p.totalCost as number)}</TableCell>
                            <TableCell align="right">{fmt(p.totalRevenue as number)}</TableCell>
                            <TableCell align="right" sx={{ color: (p.grossMargin as number) >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                              {fmt(p.grossMargin as number)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={pct(p.grossMarginPct as number)}
                                size="small"
                                color={(p.grossMarginPct as number) >= 20 ? 'success' : (p.grossMarginPct as number) >= 10 ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab 1: Revenue Entries */}
      {tab === 1 && (
        revLoading ? <LinearProgress /> : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Receipt No</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Customer / Unit</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  {isMgmt && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(revenueEntries as Array<Record<string, unknown>>).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMgmt ? 9 : 8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No revenue entries yet. Click "Add Revenue" to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (revenueEntries as Array<Record<string, unknown>>).map((e) => (
                    <TableRow key={e.id as string} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{e.receiptNumber as string}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{(e.project as Record<string, string>)?.code}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(e.category as string).replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{(e.customerName as string) || '—'}</Typography>
                        {(e.unitNumber as string) && <Typography variant="caption" color="text.secondary">Unit: {e.unitNumber as string}</Typography>}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>{e.description as string}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>{fmt(parseFloat(e.amount as string))}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.status as string}
                          size="small"
                          sx={{
                            bgcolor: STATUS_COLORS[e.status as string] + '20',
                            color: STATUS_COLORS[e.status as string],
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {(e.receivedDate as string) || (e.expectedDate as string) || '—'}
                        </Typography>
                      </TableCell>
                      {isMgmt && (
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(e)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(e.id as string)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Tab 2: Margin Analysis */}
      {tab === 2 && (
        marginLoading ? <LinearProgress /> : (
          <Grid container spacing={3}>
            {marginData?.aggregate && (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {[
                    { label: 'Total Budget', value: fmt(marginData.aggregate.totalBudget) },
                    { label: 'Total Cost', value: fmt(marginData.aggregate.totalCost) },
                    { label: 'Total Revenue', value: fmt(marginData.aggregate.totalRevenue) },
                    { label: 'Gross Margin', value: fmt(marginData.aggregate.grossMargin) },
                  ].map((s) => (
                    <Grid item xs={6} sm={3} key={s.label}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                          <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
            {marginData?.projects && (
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Margin by Project</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={marginData.projects}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="projectCode" />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <RTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                        <Bar dataKey="grossMarginPct" name="Gross Margin %" radius={[4, 4, 0, 0]}>
                          {(marginData.projects as Array<{ grossMarginPct: number }>).map((p, i) => (
                            <Cell key={i} fill={p.grossMarginPct >= 20 ? '#4caf50' : p.grossMarginPct >= 10 ? '#ff9800' : '#f44336'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {marginData?.projects && (
              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>ROI Analysis</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                      {(marginData.projects as Array<Record<string, unknown>>).map((p) => (
                        <Box key={p.projectId as string}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{p.projectCode as string}</Typography>
                            <Typography variant="body2" color={(p.roiPct as number) >= 0 ? 'success.main' : 'error.main'}>
                              ROI: {pct(p.roiPct as number)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, Math.max(0, p.costUtilizationPct as number))}
                            color={
                              (p.costUtilizationPct as number) > 90 ? 'error' :
                              (p.costUtilizationPct as number) > 75 ? 'warning' : 'success'
                            }
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Cost utilization: {pct(p.costUtilizationPct as number)}
                          </Typography>
                        </Box>
                      ))}
                      {(marginData.projects as unknown[]).length === 0 && (
                        <Typography color="text.secondary" variant="body2">No project data available.</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )
      )}

      {/* Tab 3: Tally Logs */}
      {tab === 3 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Export Type</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell align="right">Rows</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(exportLogs as Array<Record<string, unknown>>).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No export history yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (exportLogs as Array<Record<string, unknown>>).map((log) => (
                  <TableRow key={log.id as string} hover>
                    <TableCell>{new Date(log.createdAt as string).toLocaleString('en-IN')}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{(log.exportType as string).replace('_', ' ')}</TableCell>
                    <TableCell><Typography variant="caption">{(log.fileName as string) || '—'}</Typography></TableCell>
                    <TableCell align="right">{log.rowCount as number}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status as string}
                        size="small"
                        color={log.status === 'success' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="error.main">{(log.errorMessage as string) || ''}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Revenue Entry Dialog */}
      <Dialog open={revenueDialog} onClose={() => { setRevenueDialog(false); setEditEntry(null); }} maxWidth="md" fullWidth>
        <DialogTitle>{editEntry ? 'Edit Revenue Entry' : 'Add Revenue Entry'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <Controller name="projectId" control={control} render={({ field }) => (
              <TextField {...field} select label="Project" error={!!errors.projectId} helperText={errors.projectId?.message} fullWidth>
                {(projects as Array<{ id: string; code: string; name: string }>).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>
                ))}
              </TextField>
            )} />
            <Controller name="category" control={control} render={({ field }) => (
              <TextField {...field} select label="Category" error={!!errors.category} helperText={errors.category?.message} fullWidth>
                {REVENUE_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c.replace('_', ' ')}</MenuItem>
                ))}
              </TextField>
            )} />
            <Controller name="description" control={control} render={({ field }) => (
              <TextField {...field} label="Description" error={!!errors.description} helperText={errors.description?.message} fullWidth sx={{ gridColumn: '1 / -1' }} />
            )} />
            <Controller name="customerName" control={control} render={({ field }) => (
              <TextField {...field} label="Customer Name" fullWidth />
            )} />
            <Controller name="unitNumber" control={control} render={({ field }) => (
              <TextField {...field} label="Unit Number" fullWidth />
            )} />
            <Controller name="amount" control={control} render={({ field }) => (
              <TextField {...field} type="number" label="Amount (₹)" error={!!errors.amount} helperText={errors.amount?.message} fullWidth />
            )} />
            <Controller name="status" control={control} render={({ field }) => (
              <TextField {...field} select label="Status" fullWidth>
                {REVENUE_STATUSES.map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                ))}
              </TextField>
            )} />
            <Controller name="gstAmount" control={control} render={({ field }) => (
              <TextField {...field} type="number" label="GST Amount (₹)" fullWidth />
            )} />
            <Controller name="tdsAmount" control={control} render={({ field }) => (
              <TextField {...field} type="number" label="TDS Amount (₹)" fullWidth />
            )} />
            <Controller name="paymentMode" control={control} render={({ field }) => (
              <TextField {...field} select label="Payment Mode" fullWidth>
                <MenuItem value="">None</MenuItem>
                {PAYMENT_MODES.map((m) => (
                  <MenuItem key={m} value={m} sx={{ textTransform: 'uppercase' }}>{m.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            )} />
            <Controller name="expectedDate" control={control} render={({ field }) => (
              <TextField {...field} type="date" label="Expected Date" InputLabelProps={{ shrink: true }} fullWidth />
            )} />
            <Controller name="receivedDate" control={control} render={({ field }) => (
              <TextField {...field} type="date" label="Received Date" InputLabelProps={{ shrink: true }} fullWidth />
            )} />
            <Controller name="referenceNumber" control={control} render={({ field }) => (
              <TextField {...field} label="Reference / Cheque No" fullWidth />
            )} />
            <Controller name="notes" control={control} render={({ field }) => (
              <TextField {...field} label="Notes" multiline rows={2} fullWidth sx={{ gridColumn: '1 / -1' }} />
            )} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRevenueDialog(false); setEditEntry(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}>
            {editEntry ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Revenue Entry</DialogTitle>
        <DialogContent>
          <Alert severity="warning">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(deleteTarget!)}
            disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tally Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tally Export</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select label="Export Type" value={exportType}
              onChange={(e) => setExportType(e.target.value)} fullWidth
            >
              {TALLY_EXPORT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              type="date" label="Date From" value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }} fullWidth
            />
            <TextField
              type="date" label="Date To" value={exportDateTo}
              onChange={(e) => setExportDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }} fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              Leave project filter empty to export all projects. CSV file will be downloaded immediately.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={exporting ? <CircularProgress size={18} /> : <Download />}
            onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Download CSV'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
