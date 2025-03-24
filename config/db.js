const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

    const connection = mysql.createConnection(
        {
            host: 'localhost',
            user: 'kaopadpu',
            password: '321',
            database: 'game_shop'
        }
    );

    connection.connect((error) =>{
        if(error){
            console.error('Error connecting to the database',err);
            return;
        }
        console.log('Connection to game_shop database SUCCESS!!!');
    });

    connection.query('SELECT * FROM game',(error,result) =>{
        if(error){
            console.error('Error fetching game_information',err);
            return;
        }
    
    });

    const createAdminUser = async () => {
        try {
          const email = 'admin@gmail.com'; // อีเมล์ของผู้ใช้ใหม่
      
          // ตรวจสอบว่าอีเมลนี้มีในฐานข้อมูลหรือยัง (เช็คว่าเป็น admin)
          connection.query('SELECT * FROM user WHERE email = ?', [email], (error, results) => {
            if (error) {
              console.error('Error checking email:', error);
              return;
            }
      
            if (results.length > 0) {
              return;  // ถ้าอีเมลมีอยู่แล้ว ก็ไม่สร้างผู้ใช้ใหม่
            }
      
            const password = '123'; // รหัสผ่านของผู้ใช้ใหม่
            const hashedPassword = bcrypt.hashSync(password, 10); // แฮชรหัสผ่าน
            const firstName = 'Admin'; // ชื่อ
            const lastName = 'User'; // นามสกุล
            const phoneNumber = '1234567890'; // หมายเลขโทรศัพท์
      
            // เพิ่มผู้ใช้ใหม่ในฐานข้อมูลและตั้ง role เป็น admin
            connection.query(
              `INSERT INTO user (email, password, first_name, last_name, phone_number, role)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [email, hashedPassword, firstName, lastName, phoneNumber, 'Admin'],
              (error, result) => {
                if (error) {
                  console.error('Error creating admin user:', error);
                  return;
                }
      
                // ใช้ insertId ที่ได้มาใช้สร้าง cart สำหรับ admin
                const adminUserId = result.insertId;
      
                // สร้าง cart สำหรับ admin user
                connection.query(
                  `INSERT INTO cart (user_id) VALUES (?)`,
                  [adminUserId],
                  (cartError, cartResult) => {
                    if (cartError) {
                      console.error('Error creating cart for admin user:', cartError);
                      return;
                    }
                    console.log('Admin user created successfully with cart!');
                  }
                );
              }
            );
          });
      
        } catch (error) {
          console.error('Error creating admin user:', error);
        }
      };
      
      // เรียกใช้ฟังก์ชันการสร้างผู้ใช้ admin
      createAdminUser();
      
      module.exports = connection;