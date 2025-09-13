import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { reminderService, studentService } from '../services/authService';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [studentsWithPendingFees, setStudentsWithPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remindersRes, studentsRes] = await Promise.all([
        reminderService.getAll(),
        studentService.getPendingFees()
      ]);
      setReminders(remindersRes.data);
      setStudentsWithPendingFees(studentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setSending(true);
      setError('');
      setSuccess('');
      
      const response = await reminderService.sendAll();
      
      setSuccess(`Reminder calls initiated for ${response.data.results.length} students`);
      setConfirmDialog(false);
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchData();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      setError('Failed to send reminders');
      setConfirmDialog(false);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'calling': return 'info';
      case 'initiated': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'calling': return <PhoneIcon />;
      case 'initiated': return <ScheduleIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <ScheduleIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">AI-Powered Reminders</Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PhoneIcon />}
          onClick={() => setConfirmDialog(true)}
          disabled={sending || studentsWithPendingFees.length === 0}
        >
          {sending ? 'Sending...' : 'Send All Reminders'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {sending && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Sending reminders with AI integration...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PhoneIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Students with Pending Fees
                  </Typography>
                  <Typography variant="h4">
                    {studentsWithPendingFees.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Calls
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {reminders.filter(r => r.status === 'completed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ErrorIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Failed Calls
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {reminders.filter(r => r.status === 'failed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Features Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI-Powered Features
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>Live Transcription:</strong> Uses Groq's Whisper Large V3 Turbo for real-time speech-to-text
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>Ultra-Fast AI Responses:</strong> Groq's fastest model provides responses in under 2 seconds
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>Context-Aware:</strong> AI has full context of student details, course info, and fee amounts
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>Smart Escalation:</strong> Automatically connects to mentors when AI cannot answer questions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Rate Limited:</strong> Respects Twilio's 1.1s rate limit between calls
          </Typography>
        </CardContent>
      </Card>

      {/* Students with Pending Fees */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Students with Pending Fees ({studentsWithPendingFees.length})
          </Typography>
          {studentsWithPendingFees.length === 0 ? (
            <Typography color="text.secondary">
              No students with pending fees found.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Pending Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsWithPendingFees.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>
                        {student.department ? (
                          <Chip label={student.department} size="small" />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {student.course_name ? (
                          <Chip label={student.course_name} size="small" color="primary" />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          ₹{student.total_pending_amount}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Reminder History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reminder History
          </Typography>
          {reminders.length === 0 ? (
            <Typography color="text.secondary">
              No reminders sent yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Call Duration</TableCell>
                    <TableCell>AI Response</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>{reminder.student_name}</TableCell>
                      <TableCell>{reminder.student_phone}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(reminder.status)}
                          label={reminder.status}
                          size="small"
                          color={getStatusColor(reminder.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {reminder.call_duration ? `${reminder.call_duration}s` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {reminder.ai_response ? (
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {reminder.ai_response}
                          </Typography>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(reminder.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Send AI-Powered Reminders</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to send reminder calls to all {studentsWithPendingFees.length} students with pending fees?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will:
          </Typography>
          <ul>
            <li>Call each student with AI-powered voice interaction</li>
            <li>Use live transcription and ultra-fast AI responses</li>
            <li>Respect Twilio's rate limit (1.1s between calls)</li>
            <li>Connect to mentors if AI cannot answer questions</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendReminders} 
            variant="contained" 
            color="primary"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Reminders'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reminders;
