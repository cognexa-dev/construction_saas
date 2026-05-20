import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, Grid, InputLabel, LinearProgress, MenuItem,
  Select, Stack, Tab, Tabs, TextField, Typography, Alert, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import GavelIcon from '@mui/icons-material/Gavel';
import LandscapeIcon from '@mui/icons-material/Landscape';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { complianceApi } from '@/api/compliance.api';
import { projectApi } from '@/api/project.api';
import { useSnackbar } from 'notistack';

const APPROVAL_TYPES = [
  'na_order', 'noc_fire', 'noc_airport', 'noc_environment',
  'building_permission', 'commencement_certificate', 'occupancy_certificate',
  'completion_certificate', 'water_connection', 'electricity_connection', 'other',
];

const MILESTONE_STATUS_COLOR: Record<string, string> = {
  pending: '#9e9e9e', in_progress: '#1565c0', completed: '#2e7d32', overdue: '#c62828',
};

export default function CompliancePage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [reraOpen, setReraOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [landOpen, setLandOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: ['projects-list'], queryFn: () => projectApi.getAll({ limit: 100 }).then((r) => r.data) });
  const { data: rera } = useQuery({ queryKey: ['rera', selectedProject], queryFn: () => complianceApi.getRera(selectedProject), enabled: !!selectedProject });
  const { data: land } = useQuery({ queryKey: ['land', selectedProject], queryFn: () => complianceApi.getLand(selectedProject), enabled: !!selectedProject });
  const { data: summary } = useQuery({ queryKey: ['compliance-summary'], queryFn: complianceApi.getSummary });

  const reraMutation = useMutation({
    mutationFn: (d: object) => complianceApi.upsertRera(selectedProject, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rera'] }); setReraOpen(false); enqueueSnackbar('RERA updated', { variant: 'success' }); },
  });

  const milestoneMutation = useMutation({
    mutationFn: (d: object) => complianceApi.addMilestone(selectedProject, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rera'] }); setMilestoneOpen(false); enqueueSnackbar('Milestone added', { variant: 'success' }); },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => complianceApi.updateMilestone(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rera'] }); enqueueSnackbar('Progress updated', { variant: 'success' }); },
  });

  const landMutation = useMutation({
    mutationFn: (d: object) => complianceApi.upsertLand(selectedProject, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['land'] }); setLandOpen(false); enqueueSnackbar('Land record updated', { variant: 'success' }); },
  });

  const approvalMutation = useMutation({
    mutationFn: (d: object) => complianceApi.upsertApproval(selectedProject, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['land'] }); setApprovalOpen(false); enqueueSnackbar('Approval updated', { variant: 'success' }); },
  });

  const reraForm = useForm();
  const milestoneForm = useForm();
  const landForm = useForm();
  const approvalForm = useForm<Record<string, string>>({ defaultValues: { status: 'not_applied' } });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">RERA & Compliance</Typography>
          <Typography color="text.secondary" variant="body2">Track RERA registration, land records, and government approvals</Typography>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'RERA Registered', value: summary.reraRegistered, color: 'success.main', icon: <VerifiedIcon /> },
            { label: 'RERA Pending', value: summary.reraPending, color: 'warning.main', icon: <GavelIcon /> },
            { label: 'Overdue Tasks', value: summary.overdueApprovals, color: 'error.main' },
            { label: 'Pending Tasks', value: summary.pendingApprovals, color: 'text.secondary' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h4" fontWeight={700} color={s.color}>{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Select Project</InputLabel>
            <Select value={selectedProject} label="Select Project" onChange={(e) => setSelectedProject(e.target.value)}>
              <MenuItem value="">— Select a Project —</MenuItem>
              {(projects as Array<{ id: string; name: string; code: string }>).map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {!selectedProject && (
        <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">Select a project to view compliance details.</Typography></Box>
      )}

      {selectedProject && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="RERA Registration" icon={<VerifiedIcon />} iconPosition="start" />
              <Tab label="Land Record" icon={<LandscapeIcon />} iconPosition="start" />
              <Tab label="Approvals" icon={<GavelIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">RERA Details</Typography>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => { reraForm.reset(rera || {}); setReraOpen(true); }}>
                        {rera ? 'Edit' : 'Setup'}
                      </Button>
                    </Box>
                    {rera ? (
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">RERA Number</Typography>
                          <Typography variant="body2" fontWeight={600}>{rera.reraNumber || '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip label={rera.status} size="small" color={rera.status === 'registered' ? 'success' : 'warning'} sx={{ textTransform: 'capitalize' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Registration Date</Typography>
                          <Typography variant="body2">{rera.registrationDate || '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                          <Typography variant="body2">{rera.expiryDate || '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Total Units</Typography>
                          <Typography variant="body2">{rera.totalUnits || '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Sold Units</Typography>
                          <Typography variant="body2">{rera.soldUnits || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Next Quarterly Report</Typography>
                          <Typography variant="body2" color={rera.nextQuarterlyReport && new Date(rera.nextQuarterlyReport) < new Date() ? 'error.main' : 'text.primary'}>
                            {rera.nextQuarterlyReport || '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No RERA record. Click Setup to begin.</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Compliance Milestones</Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={() => setMilestoneOpen(true)} disabled={!rera}>Add</Button>
                    </Box>
                    {rera?.milestones?.length > 0 ? (
                      <Stack spacing={1.5}>
                        {rera.milestones.map((m: { id: string; title: string; status: string; progress: number; dueDate: string | null }) => (
                          <Box key={m.id} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, borderLeft: 3, borderColor: MILESTONE_STATUS_COLOR[m.status] }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={m.status.replace('_', ' ')} size="small" sx={{ textTransform: 'capitalize', fontSize: 11, color: MILESTONE_STATUS_COLOR[m.status] }} variant="outlined" />
                                {m.status !== 'completed' && (
                                  <Tooltip title="Mark Complete">
                                    <IconButton size="small" onClick={() => updateMilestoneMutation.mutate({ id: m.id, data: { status: 'completed', progress: 100 } })}>
                                      <CheckCircleIcon fontSize="small" color="success" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={m.progress}
                                sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: MILESTONE_STATUS_COLOR[m.status] } }}
                              />
                              <Typography variant="caption">{m.progress}%</Typography>
                            </Box>
                            {m.dueDate && (
                              <Typography variant="caption" color="text.secondary">Due: {m.dueDate}</Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No milestones yet.</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Land Details</Typography>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => { landForm.reset(land || {}); setLandOpen(true); }}>
                        {land ? 'Edit' : 'Setup'}
                      </Button>
                    </Box>
                    {land ? (
                      <Stack spacing={1.5}>
                        {[
                          { label: 'Survey Number', value: land.surveyNumber },
                          { label: 'Village / Taluka', value: [land.village, land.taluka].filter(Boolean).join(', ') },
                          { label: 'District', value: land.district },
                          { label: 'Total Area', value: land.totalArea ? `${land.totalArea} ${land.areaUnit}` : null },
                          { label: 'Purchase Date', value: land.purchaseDate },
                          { label: 'Purchase Price', value: land.purchasePrice ? `₹${parseFloat(land.purchasePrice).toLocaleString('en-IN')}` : null },
                          { label: 'Jantri Value', value: land.jantriValue ? `₹${parseFloat(land.jantriValue).toLocaleString('en-IN')}` : null },
                          { label: 'Seller', value: land.sellerName },
                          { label: 'NA Order No.', value: land.naOrderNumber },
                        ].map((r) => r.value ? (
                          <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{r.value}</Typography>
                          </Box>
                        ) : null)}
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No land record. Click Setup.</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Government Approvals</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => { approvalForm.reset({ status: 'not_applied' }); setApprovalOpen(true); }} disabled={!land}>
                  Add / Update Approval
                </Button>
              </Box>
              {!land && <Alert severity="info">Create a land record first to manage approvals.</Alert>}
              {land && (
                <Grid container spacing={2}>
                  {(land.approvals ?? []).map((ap: { id: string; approvalType: string; status: string; applicationNumber: string | null; approvalDate: string | null; expiryDate: string | null }) => (
                    <Grid item xs={12} sm={6} md={4} key={ap.id}>
                      <Card sx={{ borderTop: 3, borderColor: ap.status === 'approved' ? 'success.main' : ap.status === 'not_applied' ? 'grey.300' : 'warning.main' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize', mb: 1 }}>
                            {ap.approvalType.replace(/_/g, ' ')}
                          </Typography>
                          <Chip label={ap.status.replace(/_/g, ' ')} size="small"
                            color={ap.status === 'approved' ? 'success' : ap.status === 'rejected' ? 'error' : ap.status === 'not_applied' ? 'default' : 'warning'}
                            sx={{ textTransform: 'capitalize', mb: 1 }}
                          />
                          {ap.applicationNumber && <Typography variant="caption" display="block" color="text.secondary">App#: {ap.applicationNumber}</Typography>}
                          {ap.approvalDate && <Typography variant="caption" display="block" color="text.secondary">Approved: {ap.approvalDate}</Typography>}
                          {ap.expiryDate && <Typography variant="caption" display="block" color={new Date(ap.expiryDate) < new Date() ? 'error.main' : 'text.secondary'}>Expires: {ap.expiryDate}</Typography>}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </>
      )}

      {/* RERA Dialog */}
      <Dialog open={reraOpen} onClose={() => setReraOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>RERA Registration Details</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="rera-form" onSubmit={reraForm.handleSubmit((d) => reraMutation.mutate(d))} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={8}><TextField {...reraForm.register('reraNumber')} label="RERA Number" fullWidth /></Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select {...reraForm.register('status')} label="Status" defaultValue="pending">
                    {['pending','registered','renewal_due','expired','exempt'].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_',' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField {...reraForm.register('registrationDate')} label="Registration Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField {...reraForm.register('expiryDate')} label="Expiry Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField {...reraForm.register('totalUnits')} label="Total Units" type="number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...reraForm.register('soldUnits')} label="Sold Units" type="number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...reraForm.register('lastQuarterlyReport')} label="Last Quarterly Report" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField {...reraForm.register('nextQuarterlyReport')} label="Next Quarterly Report" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}><TextField {...reraForm.register('promoterName')} label="Promoter Name" fullWidth /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReraOpen(false)}>Cancel</Button>
          <Button type="submit" form="rera-form" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={milestoneOpen} onClose={() => setMilestoneOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Compliance Milestone</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="milestone-form" onSubmit={milestoneForm.handleSubmit((d) => milestoneMutation.mutate(d))} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField {...milestoneForm.register('title')} label="Title *" fullWidth />
              <TextField {...milestoneForm.register('description')} label="Description" fullWidth multiline rows={2} />
              <TextField {...milestoneForm.register('dueDate')} label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMilestoneOpen(false)}>Cancel</Button>
          <Button type="submit" form="milestone-form" variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Land Dialog */}
      <Dialog open={landOpen} onClose={() => setLandOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Land Record</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="land-form" onSubmit={landForm.handleSubmit((d) => landMutation.mutate(d))} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={6}><TextField {...landForm.register('surveyNumber')} label="Survey Number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('village')} label="Village" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('taluka')} label="Taluka" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('district')} label="District" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('totalArea')} label="Total Area" type="number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('areaUnit')} label="Area Unit" fullWidth defaultValue="sqmt" /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('purchaseDate')} label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('purchasePrice')} label="Purchase Price (₹)" type="number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('jantriValue')} label="Jantri Value (₹)" type="number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('sellerName')} label="Seller Name" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('naOrderNumber')} label="NA Order Number" fullWidth /></Grid>
              <Grid item xs={6}><TextField {...landForm.register('naOrderDate')} label="NA Order Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setLandOpen(false)}>Cancel</Button>
          <Button type="submit" form="land-form" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalOpen} onClose={() => setApprovalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add / Update Approval</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="approval-form" onSubmit={approvalForm.handleSubmit((d) => approvalMutation.mutate(d))} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Approval Type *</InputLabel>
                <Select {...approvalForm.register('approvalType')} label="Approval Type *" defaultValue="">
                  {APPROVAL_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select {...approvalForm.register('status')} label="Status" defaultValue="not_applied">
                  {['not_applied','applied','under_review','approved','rejected','expired'].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField {...approvalForm.register('applicationNumber')} label="Application Number" fullWidth />
              <TextField {...approvalForm.register('authorityName')} label="Authority Name" fullWidth />
              <TextField {...approvalForm.register('applicationDate')} label="Application Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField {...approvalForm.register('approvalDate')} label="Approval Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField {...approvalForm.register('expiryDate')} label="Expiry Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField {...approvalForm.register('remarks')} label="Remarks" fullWidth multiline rows={2} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setApprovalOpen(false)}>Cancel</Button>
          <Button type="submit" form="approval-form" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
