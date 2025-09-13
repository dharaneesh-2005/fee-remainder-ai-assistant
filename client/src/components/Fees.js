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
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { feeService, studentService, courseService } from '../services/authService';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    amount: '',
    due_date: '',
    status: 'pending'
  });
  const [summary, setSummary] = useState({
    total_pending_fees: 0,
    total_pending_amount: 0,
    students_with_pending_fees: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feesRes, studentsRes, coursesRes, summaryRes] = await Promise.all([
        feeService.getAll(),
        studentService.getAll(),
        courseService.getAll(),
        feeService.getPendingSummary()
      ]);
      setFees(feesRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (fee = null) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        student_id: fee.student_id,
        course_id: fee.course_id || '',
        amount: fee.amount,
        due_date: fee.due_date,
        status: fee.status
      });
    } else {
      setEditingFee(null);
      setFormData({
        student_id: '',
        course_id: '',
        amount: '',
        due_date: '',
        status: 'pending'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingFee(null);
    setFormData({
      student_id: '',
      course_id: '',
      amount: '',
      due_date: '',
      status: 'pending'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFee) {
        await feeService.update(editingFee.id, formData);
      } else {
        await feeService.create(formData);
      }
      handleClose();
      fetchData();
    } catch (error) {
      console.error('Error saving fee:', error);
      setError('Failed to save fee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      try {
        await feeService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting fee:', error);
        setError('Failed to delete fee');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
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
        <Typography variant="h4">Fees Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Assign Fee
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Fees
              </Typography>
              <Typography variant="h4">
                {summary.total_pending_fees}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Pending Amount
              </Typography>
              <Typography variant="h4" color="warning.main">
                ₹{summary.total_pending_amount?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Students with Pending Fees
              </Typography>
              <Typography variant="h4" color="error.main">
                {summary.students_with_pending_fees}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell>{fee.student_name}</TableCell>
                <TableCell>{fee.student_phone}</TableCell>
                <TableCell>
                  {fee.course_name ? (
                    <Chip label={fee.course_name} size="small" color="primary" />
                  ) : (
                    <Chip label="No course" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>₹{fee.amount}</TableCell>
                <TableCell>
                  {new Date(fee.due_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={fee.status} 
                    size="small" 
                    color={getStatusColor(fee.status)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(fee)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(fee.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFee ? 'Edit Fee' : 'Assign New Fee'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Student</InputLabel>
              <Select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                label="Student"
                required
              >
                <MenuItem value="">
                  <em>Select a student</em>
                </MenuItem>
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Course</InputLabel>
              <Select
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                label="Course"
              >
                <MenuItem value="">
                  <em>Select a course</em>
                </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              name="amount"
              label="Fee Amount (₹)"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="due_date"
              label="Due Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.due_date}
              onChange={handleChange}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingFee ? 'Update' : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Fees;
