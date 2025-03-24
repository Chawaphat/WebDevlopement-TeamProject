// app.js
const express = require('express');
const session = require('express-session');
const mysqlStore = require("express-mysql-session")(session);
const path = require('path');
const app = express();
const port = 3002;

const db = require('./config/db');


const sessionStore = new mysqlStore(db.config);

app.use(session({
  secret: 'ice1234',  // กำหนด key ที่จะใช้ในการเข้ารหัส session
  resave: false,              // ไม่ต้องบันทึก session ทุกครั้ง
  saveUninitialized: true,    // ตั้งค่า session เมื่อมีการใช้งาน
  cookie: { 
    secure: false,     // ตั้งค่า secure เป็น false ถ้าไม่ได้ใช้ https
    maxAge: 24 * 60 * 60 * 1000 // ตั้งเวลา expiration ของ session (1 วัน)
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const checkSession = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login'); // ถ้าไม่มี session ให้ไปที่หน้า login
  }
  next(); // ถ้ามี session ก็ให้ไปที่เส้นทางถัดไป
};

const checkAdmin = (req, res, next) => {
  // ตรวจสอบว่า session มี role เป็น Admin และอีเมลเป็น 'admin@gmail.com'
  if (req.session.role !== 'Admin' || req.session.email !== 'admin@gmail.com') {
    return res.status(403).send("Access denied!"); // ถ้าไม่ใช่ main Admin ให้ปฏิเสธการเข้าถึง
  }
  next(); // ถ้าเป็น main Admin ให้ไปที่เส้นทางถัดไป
};

const checkRoleAdmin = (req, res, next) => {
  if (req.session.role !== 'Admin') {
    return res.status(403).send("Access denied!"); // ถ้าไม่ใช่ Admin ให้ปฏิเสธการเข้าถึง
  }
  next(); // ถ้าเป็น Admin ให้ไปที่เส้นทางถัดไป
};


app.use((req, res, next) => {
  // ทำการส่ง session ไปให้กับทุกๆหน้า
  res.locals.session = req.session;
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(express.static(path.join(__dirname, 'src','public')));

const backofficeRoutes = require('./src/routes/backoffice');
app.use('/backoffice', checkSession, checkRoleAdmin, backofficeRoutes);

const webstoreRoutes = require('./src/routes/webstore');
app.use('/', webstoreRoutes); 


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
