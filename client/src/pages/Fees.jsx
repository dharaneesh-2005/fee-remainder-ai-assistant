import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Fees(){
  const [dues, setDues] = useState([]);
  const [form, setForm] = useState({ student_id: '', total_amount: '', due_amount: '', due_date: '', notes: '' });
  const [students, setStudents] = useState([]);

  const load = async () => {
    const [d, s] = await Promise.all([
      api.get('/fees/dues'),
      api.get('/students')
    ]);
    setDues(d.data);
    setStudents(s.data);
  };

  useEffect(()=>{ load(); },[]);

  const add = async (e) => {
    e.preventDefault();
    await api.post('/fees', { ...form, student_id: Number(form.student_id), total_amount: Number(form.total_amount), due_amount: Number(form.due_amount) });
    setForm({ student_id: '', total_amount: '', due_amount: '', due_date: '', notes: '' });
    load();
  };

  return (
    <div>
      <h2>Fees</h2>
      <form onSubmit={add} style={{ display:'grid', gap:8, maxWidth:520 }}>
        <select value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})}>
          <option value="">Select student</option>
          {students.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input placeholder="Total Amount" value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})} />
        <input placeholder="Due Amount" value={form.due_amount} onChange={e=>setForm({...form,due_amount:e.target.value})} />
        <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} />
        <input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
        <button type="submit">Add / Update Fee</button>
      </form>

      <h3>Current Dues</h3>
      <ul>
        {dues.map(d=> (
          <li key={d.student_id}>{d.name} - Due: {d.due_amount} (Total: {d.total_amount})</li>
        ))}
      </ul>
    </div>
  );
}
