import React, { useState } from 'react';
import api from '../api';

export default function Remind(){
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerAll = async () => {
    setLoading(true);
    setStatus('');
    try {
      const { data } = await api.post('/remind/all');
      setStatus(`Queued ${data.queued} calls. They will be paced at ~1.1s per call.`);
    } catch (e) {
      setStatus('Failed to queue reminders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Remind</h2>
      <p>Call all students with pending dues, paced to respect Twilio rate limits.</p>
      <button onClick={triggerAll} disabled={loading}>{loading ? 'Queuing...' : 'Remind All'}</button>
      {status && <p>{status}</p>}
    </div>
  );
}
