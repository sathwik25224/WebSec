const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const dbFile = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/cyberlearn.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
if (process.argv.includes('--reset') && fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
const db = require('../src/db/database');

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password_hash TEXT, password_scheme TEXT, phone TEXT, address TEXT, role TEXT DEFAULT 'student', isAdmin INTEGER DEFAULT 0, bio TEXT DEFAULT '', discountPercent INTEGER DEFAULT 0, courseAccess TEXT DEFAULT '', email_preferences INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT, description TEXT);
CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY, title TEXT, description TEXT, instructor TEXT, category_id INTEGER, price INTEGER, discount INTEGER, duration TEXT, difficulty TEXT, rating REAL, students INTEGER, thumbnail TEXT, content TEXT, FOREIGN KEY(category_id) REFERENCES categories(id));
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER, status TEXT, payment_reference TEXT, shipping_address TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY, order_id INTEGER, course_id INTEGER, title TEXT, price INTEGER, quantity INTEGER DEFAULT 1, FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE IF NOT EXISTS cart_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, course_id INTEGER, quantity INTEGER DEFAULT 1, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id));
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, course_id INTEGER, rating INTEGER, comment TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id));
CREATE TABLE IF NOT EXISTS support_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, subject TEXT, message TEXT, status TEXT DEFAULT 'Open', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS uploaded_files (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, filename TEXT, stored_name TEXT, mime_type TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT, metadata TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n) { console.log('Database already initialized.'); process.exit(0); }

const cats = [['Web Security','Secure web applications and offensive testing'],['Network Defense','Networks, monitoring and incident response'],['Cloud Security','Cloud identity and platform protection'],['Digital Investigation','Forensics and evidence handling'],['Security Foundations','Core practical security skills']];
const addCat=db.prepare('INSERT INTO categories (id,name,description) VALUES (?,?,?)'); cats.forEach((x,i)=>addCat.run(i+1,...x));
const courses=[
['Ethical Hacking Fundamentals','Build a practical foundation in ethical testing methodology.','Maya Rao',5,3499,10,'10 hours','Beginner',4.7,1842,'/images/course-ethical.svg','Reconnaissance, scanning, reporting'],
['Web Application Security','Find and prevent common web application weaknesses.','Arjun Mehta',1,4999,15,'12 hours','Intermediate',4.9,2350,'/images/course-web.svg','OWASP, authentication, secure coding'],
['Network Security','Design resilient networks and understand defensive controls.','Priya Nair',2,4299,0,'9 hours','Intermediate',4.6,1290,'/images/course-network.svg','Firewalls, segmentation, monitoring'],
['SOC Analyst Fundamentals','Investigate alerts and build repeatable triage workflows.','Dev Kapoor',2,3899,5,'11 hours','Beginner',4.5,1604,'/images/course-soc.svg','SIEM, logs, incident triage'],
['Digital Forensics','Collect and interpret digital evidence responsibly.','Leena Shah',4,5599,20,'14 hours','Advanced',4.8,980,'/images/course-forensics.svg','Evidence, timelines, reporting'],
['Linux for Cybersecurity','Use Linux confidently in security operations.','Rohan Iyer',5,2799,0,'8 hours','Beginner',4.7,3110,'/images/course-linux.svg','Shell, permissions, services'],
['Cloud Security Fundamentals','Secure cloud workloads, identities and configurations.','Nisha Bose',3,4699,10,'10 hours','Intermediate',4.6,1444,'/images/course-cloud.svg','IAM, logging, posture management'],
['Python for Security','Automate security tasks with readable Python.','Kabir Singh',5,3199,5,'9 hours','Intermediate',4.8,2760,'/images/course-python.svg','Automation, APIs, parsing'],
['Bug Bounty Fundamentals','Understand responsible disclosure and web testing basics.','Ananya Das',1,3799,0,'7 hours','Beginner',4.4,2102,'/images/course-bounty.svg','Scope, validation, reporting'],
['Penetration Testing Basics','Plan, conduct and document a controlled assessment.','Vikram Sen',1,6199,15,'16 hours','Advanced',4.9,1128,'/images/course-pentest.svg','Scoping, testing, reporting']];
const addCourse=db.prepare('INSERT INTO courses VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'); courses.forEach((c,i)=>addCourse.run(i+1,...c));
// INTENTIONALLY INSECURE DEMO DATA: plaintext and unsalted SHA-256 records simulate bad legacy migrations. All identities are fictional.
const people=['Alice Parker','Ben Carter','Clara Singh','Daniel Kim','Eva Martin','Farah Ali','Gavin Cole','Hana Ito','Ishan Patel','Julia Moore','Kiran Rao','Liam Brooks','Meera Jain','Noah Evans','Olivia Reed'];
const addUser=db.prepare('INSERT INTO users (name,email,password_hash,password_scheme,phone,address,role,isAdmin,bio,discountPercent,courseAccess) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
people.forEach((name,i)=>{ const email=i===0?'alice@cyberlearn.local':i===1?'ben@cyberlearn.local':`${name.toLowerCase().replace(' ','')}@cyberlearn.local`; const pw=i===0?'alice123':i===1?'ben123':`demo${i+1}pass`; const scheme=i<5?'plaintext':'sha256-unsalted'; const stored=scheme==='plaintext'?pw:crypto.createHash('sha256').update(pw).digest('hex'); addUser.run(name,email,stored,scheme,`+91-555-010${String(i).padStart(2,'0')}`,`${i+12} Fictional Learning Lane, Demo City`,'student',0,'Security learner and CyberLearn member.',i%3===0?10:0,''); });
addUser.run('CyberLearn Administrator','admin@cyberlearn.local','DemoAdmin123!','plaintext','+91-555-01999','1 Demo Campus, Localhost','admin',1,'Platform operations administrator.',0,'all');
const addOrder=db.prepare('INSERT INTO orders (id,user_id,total,status,payment_reference,shipping_address,created_at) VALUES (?,?,?,?,?,?,?)'); const addItem=db.prepare('INSERT INTO order_items (order_id,course_id,title,price,quantity) VALUES (?,?,?,?,?)');
for(let i=1;i<=20;i++){const uid=(i%15)+1,cid=(i%10)+1, c=courses[cid-1], price=Math.round(c[5]*(1-c[6]/100)); addOrder.run(1000+i,uid,price,i%5===0?'Refunded':'Paid',`DEMO-PAY-${String(i).padStart(5,'0')}`,`${uid+12} Fictional Learning Lane, Demo City`,`2026-0${(i%8)+1}-${String((i%27)+1).padStart(2,'0')} 10:00:00`); addItem.run(1000+i,cid,c[0],price,1); if(i<=10) addItem.run(1000+i,(cid%10)+1,courses[cid%10][0],Math.round(courses[cid%10][5]*(1-courses[cid%10][6]/100)),1); }
const addReview=db.prepare('INSERT INTO reviews (user_id,course_id,rating,comment,created_at) VALUES (?,?,?,?,?)'); for(let i=1;i<=20;i++) addReview.run((i%15)+1,(i%10)+1,(i%2)+4,['Clear explanations and useful practical examples.','A well-paced course with strong instructor support.','Exactly the foundation I needed for my role.'][i%3],`2026-0${(i%8)+1}-15 09:00:00`);
const addSupport=db.prepare('INSERT INTO support_messages (user_id,subject,message,status) VALUES (?,?,?,?)'); for(let i=1;i<=10;i++) addSupport.run((i%15)+1,['Invoice question','Course access','Certificate request','Account update'][i%4],'Hello team, this is a fictional support request for the local demonstration.',i%3?'Open':'Resolved');
const addFile=db.prepare('INSERT INTO uploaded_files (user_id,filename,stored_name,mime_type) VALUES (?,?,?,?)'); ['course-manual.pdf','demo-secret.txt','backup-demo.sql','internal-notes.txt','soc-checklist.txt'].forEach((f,i)=>addFile.run(1,f,f,'text/plain'));
console.log('Seeded CyberLearn with fake local data.');
