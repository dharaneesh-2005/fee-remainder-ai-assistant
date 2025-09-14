-- Basic schema for courses, students, fees, payments
create table if not exists courses (
  id serial primary key,
  name text not null,
  code text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists students (
  id serial primary key,
  name text not null,
  dept text,
  phone text,
  email text,
  course_id integer references courses(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists fees (
  id serial primary key,
  student_id integer references students(id) on delete cascade,
  total_amount numeric(12,2) not null,
  due_amount numeric(12,2) not null,
  due_date date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id serial primary key,
  student_id integer references students(id) on delete cascade,
  amount numeric(12,2) not null,
  paid_at timestamptz default now(),
  method text default 'simulation'
);

-- A view to compute outstanding dues quickly
create or replace view v_student_dues as
select s.id as student_id,
       s.name,
       s.dept,
       s.phone,
       coalesce(f.total_amount, 0) as total_amount,
       coalesce(f.due_amount, 0) as due_amount,
       f.due_date
from students s
left join (
  select student_id,
         max(id) as last_fee_id
  from fees
  group by student_id
) lf on lf.student_id = s.id
left join fees f on f.id = lf.last_fee_id;
