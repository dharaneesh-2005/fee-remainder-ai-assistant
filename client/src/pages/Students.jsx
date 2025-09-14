import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Students(){
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', dept: '', phone: '', email: '', course_id: '' });

  const load = async () => {
    const [s, c] = await Promise.all([
      api.get('/students'),
      api.get('/courses')
    ]);
    setStudents(s.data);
    setCourses(c.data);
  };

  useEffect(()=>{ load(); },[]);

  const add = async (e) => {
    e.preventDefault();
    await api.post('/students', { ...form, course_id: form.course_id ? Number(form.course_id) : null });
    setForm({ name: '', dept: '', phone: '', email: '', course_id: '' });
    load();
  };

  return (
    <div>
      <h2>Students</h2>
      <form onSubmit={add} style={{ display:'grid', gap:8, maxWidth:520 }}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <input placeholder="Department" value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} />
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <select value={form.course_id} onChange={e=>setForm({...form,course_id:e.target.value})}>
          <option value="">Select course</option>
          {courses.map(c=> <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
        </select>
        <button type="submit">Add Student</button>
      </form>

      <ul>
        {students.map(s=> (
          <li key={s.id}><Link to={`/students/${s.id}`}>{s.name}</Link> - {s.dept}</li>
        ))}
      </ul>
    </div>
  );
}
