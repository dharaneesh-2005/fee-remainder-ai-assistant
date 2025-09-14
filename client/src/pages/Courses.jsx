import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Courses(){
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const load = async () => {
    const { data } = await api.get('/courses');
    setCourses(data);
  };

  useEffect(()=>{ load(); },[]);

  const add = async (e) => {
    e.preventDefault();
    await api.post('/courses', form);
    setForm({ name: '', code: '', description: '' });
    load();
  };

  return (
    <div>
      <h2>Courses</h2>
      <form onSubmit={add} style={{ display:'grid', gap:8, maxWidth:480 }}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <input placeholder="Code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} />
        <input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button type="submit">Add Course</button>
      </form>
      <ul>
        {courses.map(c=> (<li key={c.id}>{c.code} - {c.name}</li>))}
      </ul>
    </div>
  );
}
