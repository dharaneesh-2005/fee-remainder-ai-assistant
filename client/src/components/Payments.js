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
  CardContent,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { paymentService, studentService, feeService } from '../services/authService';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    fee_id: '',
    amount: '',
    payment_method: 'simulation'
  });
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, studentsRes, feesRes, summaryRes] = await Promise.all([
        paymentService.getAll(),
        studentService.getAll(),
        feeService.getAll(),
        paymentService.getSummary()
      ]);
      setPayments(paymentsRes.data);
      setStudents(studentsRes.data);
      setPendingFees(feesRes.data.filter(fee => fee.status === 'pending'));
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      student_id: '',
      fee_id: '',
      amount: '',
      payment_method: 'simulation'
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      student_id: '',
      fee_id: '',
      amount: '',
      payment_method: 'simulation'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await paymentService.process(formData);
      handleClose();
      fetchData();
      setError('');
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStudentChange = (studentId) => {
    const studentFees = pendingFees.filter(fee => fee.student_id === parseInt(studentId));
    setFormData({
      ...formData,
      student_id: studentId,
      fee_id: studentFees.length > 0 ? studentFees[0].id : '',
      amount: studentFees.length > 0 ? studentFees[0].amount : ''
    });
  };

  const handleFeeChange = (feeId) => {
    const selectedFee = pendingFees.find(fee => fee.id === parseInt(feeId));
    setFormData({
      ...formData,
      fee_id: feeId,
      amount: selectedFee ? selectedFee.amount : ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
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

  const totalAmountCollected = summary.reduce((sum, item) => sum + (item.total_amount_collected || 0), 0);
  const totalPayments = summary.reduce((sum, item) => sum + (item.total_payments || 0), 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payments</Typography>
        <Button
          variant="contained"
          startIcon={<PaymentIcon />}
          onClick={handleOpen}
        >
          Process Payment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Payments
                  </Typography>
                  <Typography variant="h4">
                    {totalPayments}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PaymentIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Amount Collected
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    ₹{totalAmountCollected.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
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
              <TableCell>Amount</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Transaction ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.student_name}</TableCell>
                <TableCell>{payment.student_phone}</TableCell>
                <TableCell>₹{payment.amount}</TableCell>
                <TableCell>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={payment.payment_method} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={payment.status} 
                    size="small" 
                    color={getStatusColor(payment.status)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {payment.transaction_id}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Student</InputLabel>
              <Select
                name="student_id"
                value={formData.student_id}
                onChange={(e) => handleStudentChange(e.target.value)}
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
            
            {formData.student_id && (
              <FormControl fullWidth margin="dense">
                <InputLabel>Pending Fee</InputLabel>
                <Select
                  name="fee_id"
                  value={formData.fee_id}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  label="Pending Fee"
                >
                  <MenuItem value="">
                    <em>Select a fee</em>
                  </MenuItem>
                  {pendingFees
                    .filter(fee => fee.student_id === parseInt(formData.student_id))
                    .map((fee) => (
                      <MenuItem key={fee.id} value={fee.id}>
                        ₹{fee.amount} - Due: {new Date(fee.due_date).toLocaleDateString()}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <TextField
              margin="dense"
              name="amount"
              label="Payment Amount (₹)"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.amount}
              onChange={handleChange}
              required
            />

            <FormControl fullWidth margin="dense">
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                label="Payment Method"
              >
                <MenuItem value="simulation">Simulation</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mt: 2 }}>
              This is a payment simulation. No actual money will be processed.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Process Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Payments;
