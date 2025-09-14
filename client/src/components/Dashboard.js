import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  CreditCard, 
  Phone,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalFees: 0,
    totalPayments: 0,
    pendingFees: 0,
    recentReminders: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [coursesRes, studentsRes, feesRes, paymentsRes, remindersRes] = await Promise.all([
        axios.get('/api/courses'),
        axios.get('/api/students'),
        axios.get('/api/fees'),
        axios.get('/api/payments'),
        axios.get('/api/reminders')
      ]);

      const courses = coursesRes.data;
      const students = studentsRes.data;
      const fees = feesRes.data;
      const payments = paymentsRes.data;
      const reminders = remindersRes.data;

      // Calculate stats
      const totalFees = fees.reduce((sum, fee) => sum + parseFloat(fee.total_amount || 0), 0);
      const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      const pendingFees = fees.reduce((sum, fee) => sum + parseFloat(fee.pending_amount || 0), 0);

      setStats({
        totalCourses: courses.length,
        totalStudents: students.length,
        totalFees: totalFees,
        totalPayments: totalPayments,
        pendingFees: pendingFees,
        recentReminders: reminders.filter(r => {
          const reminderDate = new Date(r.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return reminderDate > weekAgo;
        }).length
      });

      // Set recent activities (last 5 payments and reminders)
      const recentPayments = payments.slice(0, 3).map(payment => ({
        type: 'payment',
        message: `Payment of ₹${payment.amount} received from ${payment.student_name}`,
        date: payment.payment_date,
        icon: CreditCard
      }));

      const recentRemindersList = reminders.slice(0, 2).map(reminder => ({
        type: 'reminder',
        message: `Reminder sent to ${reminder.student_name}`,
        date: reminder.created_at,
        icon: Phone,
        status: reminder.call_status
      }));

      setRecentActivities([...recentPayments, ...recentRemindersList].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ).slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Total Fees',
      value: `₹${stats.totalFees.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      name: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString()}`,
      icon: AlertCircle,
      color: 'bg-red-500'
    },
    {
      name: 'Total Payments',
      value: `₹${stats.totalPayments.toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-purple-500'
    },
    {
      name: 'Recent Reminders',
      value: stats.recentReminders,
      icon: Phone,
      color: 'bg-indigo-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your AI Fee Reminder System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activities
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, activityIdx) => {
                const Icon = activity.icon;
                return (
                  <li key={activityIdx}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            activity.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            <Icon className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">{activity.message}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => window.location.href = '/courses'}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <BookOpen className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Add Course
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create a new course with fee structure
                </p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/students'}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <Users className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Add Student
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Enroll a new student to a course
                </p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/reminders'}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-red-50 text-red-700 ring-4 ring-white">
                  <Phone className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Send Reminders
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Call all students with pending fees
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
