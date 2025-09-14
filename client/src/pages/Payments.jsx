import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Payments(){
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_id: '', amount: '' });
  const [message, setMessage] = useState('');

  useEffect(()=>{
    api.get('/students').then(r=> setStudents(r.data));
  },[]);

  const pay = async (e) => {
    e.preventDefault();
    setMessage('');
    const { data } = await api.post('/payments/simulate', { student_id: Number(form.student_id), amount: Number(form.amount)});
    setMessage(`Payment recorded: ${data.payment.amount}. New due: ${data.fee?.due_amount}`);
    setForm({ student_id: '', amount: '' });
  };

  return (
    <div>
      <h2>Payments (Simulation)</h2>
      <form onSubmit={pay} style={{ display:'grid', gap:8, maxWidth:420 }}>
        <select value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})}>
          <option value="">Select student</option>
          {students.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
        <button type="submit">Simulate Payment</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
