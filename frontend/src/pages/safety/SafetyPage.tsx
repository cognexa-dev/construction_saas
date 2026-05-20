import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, Grid, InputLabel,
  MenuItem, Select, Stack, Tab, Tabs, TextField,
  Typography, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { safetyApi } from '@/api/safety.api';
import { projectApi } from '@/api/project.api';
import { useSnackbar } from 'notistack';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const SEVERITY_COLOR: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  minor: 'info', moderate: 'warning', major: 'error', critical: 'error', fatality: 'error',
};


export default function SafetyPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const { data: dashboard } = useQuery({ queryKey: ['safety-dashboard'], queryFn: () => safetyApi.getDashboard() });
  const { data: checklists = [] } = useQuery({ queryKey: ['checklists'], queryFn: safetyApi.getChecklists });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => safetyApi.getIncidents() });
  const { data: insurances = [] } = useQuery({ queryKey: ['insurances'], queryFn: () => safetyApi.getInsurances() });
  const { data: expiring = [] } = useQuery({ queryKey: ['expiring-insurance'], queryFn: () => safetyApi.getExpiringInsurances(30) });
  const { data: projectsData } = useQuery({ queryKey: ['projects-list'], queryFn: () => projectApi.getAll({ limit: 100 }) });
  const projects = projectsData?.data ?? [];

  const incidentMutation = useMutation({
    mutationFn: safetyApi.createIncident,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); qc.invalidateQueries({ queryKey: ['safety-dashboard'] }); setIncidentOpen(false); enqueueSnackbar('Incident reported', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to report incident', { variant: 'error' }),
  });

  const insuranceMutation = useMutation({
    mutationFn: safetyApi.addInsurance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insurances'] }); setInsuranceOpen(false); enqueueSnackbar('Insurance record added', { variant: 'success' }); },
  });

  const submitMutation = useMutation({
    mutationFn: safetyApi.submitChecklist,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions'] }); setSubmitOpen(false); enqueueSnackbar('Checklist submitted', { variant: 'success' }); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const incidentForm = useForm<Record<string, string>>({ defaultValues: { type: 'other', severity: 'minor', incidentDate: new Date().toISOString().split('T')[0] } });
  const insuranceForm = useForm<Record<string, string>>({ defaultValues: { insuranceType: 'workmen_compensation' } });
  const submitForm = useForm<Record<string, string>>({ defaultValues: { submissionDate: new Date().toISOString().split('T')[0] } });

  const incidentColumns: GridColDef[] = [
    { field: 'reportNumber', headerName: 'Report No.', width: 140 },
    { field: 'type', headerName: 'Type', width: 110, renderCell: ({ value }) => <Chip label={value} size="small" sx={{ textTransform: 'capitalize' }} /> },
    { field: 'severity', headerName: 'Severity', width: 110, renderCell: ({ value }) => <Chip label={value} size="small" color={SEVERITY_COLOR[value]} sx={{ textTransform: 'capitalize' }} /> },
    { field: 'incidentDate', headerName: 'Date', width: 110 },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: ({ value }) => <Chip label={value?.replace('_', ' ')} size="small" color={value === 'resolved' || value === 'closed' ? 'success' : 'warning'} sx={{ textTransform: 'capitalize' }} /> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Safety Module</Typography>
          <Typography color="text.secondary" variant="body2">Daily checklists, incident reports, and worker insurance tracking</Typography>
        </Box>
      </Box>

      {(expiring as unknown[]).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{(expiring as unknown[]).length} worker insurance policies</strong> expiring in 30 days. Review and renew immediately.
        </Alert>
      )}

      {dashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Incidents', value: dashboard.totalIncidents, icon: <WarningAmberIcon />, color: 'warning' },
            { label: 'Open Incidents', value: dashboard.openIncidents, icon: <ErrorIcon />, color: 'error' },
            { label: 'Critical', value: dashboard.criticalIncidents, icon: <ShieldIcon />, color: 'error' },
            { label: 'Expiring Insurance', value: dashboard.expiringInsurances, icon: <PersonIcon />, color: 'warning' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                      <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${s.color}.light`, color: `${s.color}.main` }}>{s.icon}</Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Daily Checklists" />
          <Tab label="Incident Reports" />
          <Tab label="Worker Insurance" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Safety Checklists</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setSubmitOpen(true)}>Submit Daily</Button>
          </Box>
          <Grid container spacing={2}>
            {(checklists as Array<{ id: string; title: string; description: string | null; items: unknown[] }>).map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircleIcon color="success" />
                      <Typography variant="subtitle1" fontWeight={600}>{c.title}</Typography>
                    </Box>
                    {c.description && <Typography variant="body2" color="text.secondary">{c.description}</Typography>}
                    <Chip label={`${(c.items ?? []).length} items`} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {(checklists as unknown[]).length === 0 && (
              <Grid item xs={12}><Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No checklists yet. Create one from admin panel.</Typography></Grid>
            )}
          </Grid>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Incident Reports</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />} color="error" onClick={() => setIncidentOpen(true)}>Report Incident</Button>
          </Box>
          <Card>
            <DataGrid
              rows={incidents as { id: string }[]}
              columns={incidentColumns}
              autoHeight
              disableRowSelectionOnClick
              getRowHeight={() => 52}
              sx={{ border: 0 }}
              pageSizeOptions={[20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
            />
          </Card>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Worker Insurance</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setInsuranceOpen(true)}>Add Record</Button>
          </Box>
          <Stack spacing={1.5}>
            {(insurances as Array<{ id: string; workerName: string; role: string | null; policyNumber: string; insurerName: string; insuranceType: string; expiryDate: string; status: string }>).map((ins) => (
              <Card key={ins.id} sx={{
                borderLeft: 4,
                borderColor: ins.status === 'active' ? 'success.main' : ins.status === 'expiring_soon' ? 'warning.main' : 'error.main',
              }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>{ins.workerName[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{ins.workerName}</Typography>
                          <Typography variant="caption" color="text.secondary">{ins.role}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Policy: {ins.policyNumber}</Typography>
                      <Typography variant="body2">{ins.insurerName}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="caption" color="text.secondary">Expiry</Typography>
                      <Typography variant="body2" fontWeight={600}>{ins.expiryDate}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Chip label={ins.status?.replace('_', ' ')} size="small"
                        color={ins.status === 'active' ? 'success' : ins.status === 'expiring_soon' ? 'warning' : 'error'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            {(insurances as unknown[]).length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}><Typography color="text.secondary">No insurance records yet.</Typography></Box>
            )}
          </Stack>
        </Box>
      )}

      {/* Report Incident Dialog */}
      <Dialog open={incidentOpen} onClose={() => setIncidentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Report Safety Incident</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="incident-form" onSubmit={incidentForm.handleSubmit((d) => incidentMutation.mutate(d))} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Project *</InputLabel>
                  <Select {...incidentForm.register('projectId')} label="Project *" defaultValue="">
                    {projects.map((p: { id: string; name: string }) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField {...incidentForm.register('incidentDate')} label="Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type *</InputLabel>
                  <Select {...incidentForm.register('type')} label="Type *" defaultValue="other">
                    {['fall', 'electrical', 'fire', 'equipment', 'chemical', 'structural', 'other'].map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity *</InputLabel>
                  <Select {...incidentForm.register('severity')} label="Severity *" defaultValue="minor">
                    {['minor', 'moderate', 'major', 'critical', 'fatality'].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField {...incidentForm.register('locationDetail')} label="Location Details" fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField {...incidentForm.register('description')} label="Description *" fullWidth multiline rows={3} />
              </Grid>
              <Grid item xs={12}>
                <TextField {...incidentForm.register('immediateAction')} label="Immediate Action Taken" fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIncidentOpen(false)}>Cancel</Button>
          <Button type="submit" form="incident-form" variant="contained" color="error" disabled={incidentMutation.isPending}>
            {incidentMutation.isPending ? 'Submitting...' : 'Report Incident'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Insurance Dialog */}
      <Dialog open={insuranceOpen} onClose={() => setInsuranceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Worker Insurance Record</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="ins-form" onSubmit={insuranceForm.handleSubmit((d) => insuranceMutation.mutate(d))} noValidate>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={8}>
                <TextField {...insuranceForm.register('workerName')} label="Worker Name *" fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField {...insuranceForm.register('role')} label="Role" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...insuranceForm.register('policyNumber')} label="Policy Number *" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField {...insuranceForm.register('insurerName')} label="Insurer Name *" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Insurance Type *</InputLabel>
                  <Select {...insuranceForm.register('insuranceType')} label="Insurance Type *" defaultValue="workmen_compensation">
                    {['esic', 'workmen_compensation', 'group_accident', 'other'].map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t.replace('_', ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Project (optional)</InputLabel>
                  <Select {...insuranceForm.register('projectId')} label="Project (optional)" defaultValue="">
                    <MenuItem value="">All Projects</MenuItem>
                    {projects.map((p: { id: string; name: string }) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField {...insuranceForm.register('startDate')} label="Start Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField {...insuranceForm.register('expiryDate')} label="Expiry Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField {...insuranceForm.register('coverageAmount')} label="Coverage Amount (₹)" type="number" fullWidth />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setInsuranceOpen(false)}>Cancel</Button>
          <Button type="submit" form="ins-form" variant="contained" disabled={insuranceMutation.isPending}>Save Record</Button>
        </DialogActions>
      </Dialog>

      {/* Submit Checklist Dialog */}
      <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Submit Daily Safety Checklist</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="submit-form" onSubmit={submitForm.handleSubmit((d) => submitMutation.mutate({ ...d, responses: [] }))} noValidate>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Checklist *</InputLabel>
                <Select {...submitForm.register('checklistId')} label="Checklist *" defaultValue="">
                  {(checklists as Array<{ id: string; title: string }>).map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Project *</InputLabel>
                <Select {...submitForm.register('projectId')} label="Project *" defaultValue="">
                  {projects.map((p: { id: string; name: string }) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField {...submitForm.register('submissionDate')} label="Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField {...submitForm.register('remarks')} label="Remarks" fullWidth multiline rows={2} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSubmitOpen(false)}>Cancel</Button>
          <Button type="submit" form="submit-form" variant="contained" disabled={submitMutation.isPending}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
