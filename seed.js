require('dotenv').config();
const mongoose = require('mongoose');
const M = require('./src/models');
const weekdays = n => { const o = [], d = new Date(); while (o.length < n) { d.setDate(d.getDate() - 1); if (d.getDay() % 6) o.push(new Date(d)); } return o; };
async function run() {
  if (await M.User.countDocuments()) return false;
  const dep = await M.Department.insertMany([['Computer Science', 'CSE'], ['Electronics', 'ECE'], ['Mechanical', 'MECH'], ['Civil', 'CIVIL']].map(([name, code]) => ({ name, code })));
  const u = (name, email, role, password, x = {}) => ({ name, email, role, password, ...x });
  await M.User.create(u('Administrator', 'admin@smartcampus.edu', 'admin', process.env.ADMIN_PASSWORD || 'Admin@12345'));
  const fac = await M.User.create(['Ananya Raman', 'Vikram Iyer', 'Meera Nair', 'Rohan Menon'].map((n, i) => u('Dr. ' + n, i ? `faculty${i + 1}@smartcampus.edu` : 'faculty@smartcampus.edu', 'faculty', 'Faculty@123', { department: dep[i]._id })));
  const names = ['Aarav Raman', 'Diya Iyer', 'Karthik Kumar', 'Meera Nair', 'Rohan Menon', 'Ananya Pillai', 'Vikram Reddy', 'Sneha Das', 'Arjun Raman', 'Priya Iyer', 'Harish Kumar', 'Nila Nair'];
  const stu = await M.User.create(names.map((n, i) => u(n, i ? `student${i + 1}@smartcampus.edu` : 'student@smartcampus.edu', 'student', 'Student@123', { department: dep[i % 4]._id, rollNo: '23CS' + (101 + i), semester: 5 })));
  const co = await M.Course.insertMany([['CS301', 'Data Structures', 0, 4], ['CS302', 'Operating Systems', 0, 4], ['CS303', 'Web Technologies', 0, 3], ['EC301', 'Digital Signals', 1, 3], ['ME301', 'Thermodynamics', 2, 3]].map(([code, name, d, credits], i) => ({ code, name, credits, semester: 5, department: dep[d]._id, faculty: fac[i % 4]._id })));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], tt = [];
  days.forEach((day, d) => [0, 1, 2].forEach(s => tt.push({ course: co[(d + s) % 5]._id, day, startTime: `${9 + s}:00`.padStart(5, '0'), endTime: `${10 + s}:00`.padStart(5, '0'), room: 'R' + (101 + d * 3 + s) })));
  await M.Timetable.insertMany(tt);
  const marks = [], att = [];
  stu.forEach((s, i) => co.forEach((c, j) => {
    marks.push({ student: s._id, course: c._id, exam: 'Internal', score: 50 + ((i * 7 + j * 13) % 48), max: 100 });
    weekdays(6).forEach((date, k) => { const x = (i + j * 3 + k * 5) % 11; att.push({ student: s._id, course: c._id, date, status: x === 0 ? 'absent' : x === 5 ? 'late' : 'present', markedBy: fac[0]._id }); });
  }));
  await M.Mark.insertMany(marks); await M.Attendance.insertMany(att);
  await M.Notification.insertMany([{ title: 'Semester exams schedule released', message: 'End-semester exams begin on 8 December.', audience: 'all' }, { title: 'Faculty meeting', message: 'Department heads meet on Monday at 10:00.', audience: 'faculty' }, { title: 'Fee payment reminder', message: 'Last date for fee payment is 30 November.', audience: 'student' }]);
  await M.Leave.insertMany([{ user: stu[2]._id, role: 'student', from: '2026-11-20', to: '2026-11-21', reason: 'Family function' }, { user: stu[0]._id, role: 'student', from: '2026-11-05', to: '2026-11-05', reason: 'Medical checkup', status: 'approved' }, { user: fac[1]._id, role: 'faculty', from: '2026-11-25', to: '2026-11-26', reason: 'Conference' }]);
  console.log('Demo data created');
  return true;
}
module.exports = { run };
if (require.main === module) mongoose.connect(process.env.MONGO_URI).then(run).then(() => mongoose.disconnect()).catch(e => { console.error(e); process.exit(1); });
