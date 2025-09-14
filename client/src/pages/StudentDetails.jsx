import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function StudentDetails(){
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(()=>{
    api.get(`/students/${id}`).then(r=> setStudent(r.data));
  },[id]);

  if (!student) return <p>Loading...</p>;
  return (
    <div>
      <h2>{student.name}</h2>
      <p>Dept: {student.dept}</p>
      <p>Phone: {student.phone}</p>
      <p>Email: {student.email}</p>
    </div>
  );
}
