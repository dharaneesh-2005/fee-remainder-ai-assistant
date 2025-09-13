import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { courseService, studentService, feeService, paymentService } from '../services/authService';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    pendingFees: 0,
    totalPendingAmount: 0,
    totalPayments: 0,
    totalAmountCollected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const [coursesRes, studentsRes, feesRes, paymentsRes] = await Promise.all([
          courseService.getAll(),
          studentService.getAll(),
          feeService.getPendingSummary(),
          paymentService.getSummary()
        ]);

        const courses = coursesRes.data.length;
        const students = studentsRes.data.length;
        const pendingFees = feesRes.data.total_pending_fees || 0;
        const totalPendingAmount = feesRes.data.total_pending_amount || 0;
        
        const totalPayments = paymentsRes.data.reduce((sum, payment) => sum + payment.total_payments, 0);
        const totalAmountCollected = paymentsRes.data.reduce((sum, payment) => sum + payment.total_amount_collected, 0);

        setStats({
          courses,
          students,
          pendingFees,
          totalPendingAmount,
          totalPayments,
          totalAmountCollected
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome to the Fee Remainder AI Assistant. Here's an overview of your system.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Courses"
            value={stats.courses}
            icon={<SchoolIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.students}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Fees"
            value={stats.pendingFees}
            icon={<PaymentIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Amount"
            value={`₹${stats.totalPendingAmount.toLocaleString()}`}
            icon={<PhoneIcon sx={{ fontSize: 40 }} />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.totalPayments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total payments processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Amount Collected
              </Typography>
              <Typography variant="h4" color="success.main">
                ₹{stats.totalAmountCollected.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total amount collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Add new courses in the Courses section
            • Register students in the Students section
            • Assign fees to students in the Fees section
            • Process payments in the Payments section
            • Send AI-powered reminders in the Reminders section
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
