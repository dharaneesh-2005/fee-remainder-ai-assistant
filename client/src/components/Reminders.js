import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Phone, PhoneCall, Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [callProgress, setCallProgress] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [remindersRes, feesRes] = await Promise.all([
        axios.get('/api/reminders'),
        axios.get('/api/fees/pending/list')
      ]);
      setReminders(remindersRes.data);
      setPendingFees(feesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const sendReminderToStudent = async (studentId) => {
    try {
      setCalling(true);
      setCallProgress(prev => ({ ...prev, [studentId]: 'calling' }));
      
      const response = await axios.post(`/api/reminders/send/${studentId}`);
      
      setCallProgress(prev => ({ ...prev, [studentId]: 'completed' }));
      toast.success(`Reminder call initiated for ${response.data.student.name}`);
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchData();
        setCallProgress(prev => ({ ...prev, [studentId]: null }));
      }, 2000);
      
    } catch (error) {
      console.error('Error sending reminder:', error);
      setCallProgress(prev => ({ ...prev, [studentId]: 'failed' }));
      
      if (error.response?.status === 429) {
        const waitTime = Math.ceil(error.response.data.waitTime / 1000);
        toast.error(`Please wait ${waitTime} seconds before making another call`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to send reminder');
      }
      
      setTimeout(() => {
        setCallProgress(prev => ({ ...prev, [studentId]: null }));
      }, 3000);
    } finally {
      setCalling(false);
    }
  };

  const sendRemindersToAll = async () => {
    if (pendingFees.length === 0) {
      toast.info('No students with pending fees found');
      return;
    }

    if (window.confirm(`Are you sure you want to call all ${pendingFees.length} students with pending fees? This will take approximately ${Math.ceil(pendingFees.length * 1.1)} seconds.`)) {
      try {
        setCalling(true);
        toast.info('Initiating calls to all students...');
        
        const response = await axios.post('/api/reminders/send-all');
        
        toast.success(`Initiated calls to ${response.data.results.length} students`);
        
        // Refresh data after a delay
        setTimeout(() => {
          fetchData();
        }, 5000);
        
      } catch (error) {
        console.error('Error sending bulk reminders:', error);
        toast.error('Failed to send bulk reminders');
      } finally {
        setCalling(false);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'calling':
        return <PhoneCall className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'initiated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'calling':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Payment Reminders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Send AI-powered voice reminders to students with pending fees
          </p>
        </div>
        <button
          onClick={sendRemindersToAll}
          disabled={calling || pendingFees.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calling ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          Call All Students ({pendingFees.length})
        </button>
      </div>

      {/* AI Features Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              AI-Powered Reminder System
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Uses Groq's fastest AI model for ultra-fast responses (&lt;2 seconds)</li>
                <li>Live transcription with Whisper Large V3 Turbo</li>
                <li>Intelligent conversation flow with student context</li>
                <li>Automatic mentor escalation for complex queries</li>
                <li>Rate limited to 1.1 seconds between calls to respect Twilio limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Fees List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Students with Pending Fees
          </h3>
          {pendingFees.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All fees paid!</h3>
              <p className="mt-1 text-sm text-gray-500">No students have pending fees at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingFees.map((fee) => (
                <div key={fee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{fee.student_name}</p>
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Pending
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Course: {fee.course_name || 'Not specified'}
                          <span className="ml-2">• Phone: {fee.student_phone}</span>
                        </div>
                        {fee.due_date && (
                          <div className="mt-1 text-sm text-gray-500">
                            Due Date: {new Date(fee.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Total: ₹{parseFloat(fee.total_amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: ₹{parseFloat(fee.paid_amount).toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-red-600">
                          Pending: ₹{parseFloat(fee.pending_amount).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => sendReminderToStudent(fee.student_id)}
                        disabled={calling || callProgress[fee.student_id]}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {callProgress[fee.student_id] ? (
                          <>
                            {getStatusIcon(callProgress[fee.student_id])}
                            <span className="ml-1">
                              {callProgress[fee.student_id] === 'calling' ? 'Calling...' : 
                               callProgress[fee.student_id] === 'completed' ? 'Called' :
                               callProgress[fee.student_id] === 'failed' ? 'Failed' : 'Processing...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Call Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reminders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Reminder Calls
          </h3>
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders sent</h3>
              <p className="mt-1 text-sm text-gray-500">Reminder calls will appear here once sent.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.slice(0, 10).map((reminder) => (
                <div key={reminder.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(reminder.call_status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{reminder.student_name}</p>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reminder.call_status)}`}>
                            {reminder.call_status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Course: {reminder.course_name || 'Not specified'}
                          <span className="ml-2">• Phone: {reminder.student_phone}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Pending Amount: ₹{parseFloat(reminder.pending_amount).toLocaleString()}
                          <span className="ml-2">
                            • Sent: {new Date(reminder.created_at).toLocaleString()}
                          </span>
                        </div>
                        {reminder.ai_response && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>AI Response:</strong> {reminder.ai_response}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reminders;
