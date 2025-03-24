//webstore

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/db'); 
const session = require("express-session");
const mysqlStore = require("express-mysql-session")(session);
const Authen = require("../../controller/authen");
const { forEach } = require('lodash');




// ROOT MANAGEMENT
router.get('/', async (req, res) => {
  const activePage = 'home';  

  try {

      async function createHomepageGameTable() {
          try {
            await db.promise().query(`
              CREATE TABLE IF NOT EXISTS homepage_game (
                game_id INT PRIMARY KEY,
                position INT DEFAULT 0,
                FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
              );
            `);
          } catch (error) {
            console.error('Error creating homepage_game table:', error);
          }
      }

      async function createNewReleasegameTable() {
        try {
          await db.promise().query(`
            CREATE TABLE IF NOT EXISTS new_release_game (
            game_id INT PRIMARY KEY,
            position INT DEFAULT 0,
            FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
            );
          `);
        } catch (error) {
          console.error('Error creating homepage_game table:', error);
        }
    }

        
        await createHomepageGameTable();

        await createNewReleasegameTable();

      const [featuredGames] = await db.promise().query(`
          SELECT g.game_id, g.title, g.price, g.promotion_price, g.main_image_url, g.icongame_url, g.description
          FROM game g
          JOIN homepage_game hg ON g.game_id = hg.game_id
          ORDER BY hg.position ASC
      `);


      const [newReleaseGames] = await db.promise().query(`
          SELECT g.game_id, g.title, g.price, g.promotion_price, g.main_image_url, g.icongame_url, g.description
          FROM game g
          JOIN new_release_game nr ON g.game_id = nr.game_id
          ORDER BY nr.position ASC
      `);
      const userId = req.session.userId;
      let itemCount = 0; // กำหนดค่าเริ่มต้นเป็น 0
    
      if (userId) {
        try {
          // 2) SUM(quantity) เพื่อดึง “จำนวนชิ้น” รวม
          const [cartItemCount] = await db.promise().query(`
            SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
            FROM cart_item
            JOIN cart ON cart_item.cart_id = cart.cart_id
            WHERE cart.user_id = ?
          `, [userId]);
    
          itemCount = cartItemCount[0].itemCount; // เก็บจำนวนชิ้นทั้งหมดในตะกร้า
        } catch (error) {
          console.error(error);
        }
      }

      res.render('webstore/index', { 
          itemCount: itemCount,
          activePage,
          featuredGames: featuredGames || [], 
          newReleaseGames: newReleaseGames || [] 

      });
  } 
  catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//COLLECTION MANAGEMENT
router.get('/collection', async (req, res) => {
  try {
    const activePage = 'collection';  // กำหนดว่าเป็นหน้า Collection
    const [rows] = await db.promise().query('SELECT * FROM category ORDER BY name ASC');

    const userId = req.session.userId;
    let itemCount = 0; // กำหนดค่าเริ่มต้นเป็น 0
  
    if (userId) {
      try {
        // 2) SUM(quantity) เพื่อดึง “จำนวนชิ้น” รวม
        const [cartItemCount] = await db.promise().query(`
          SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
          FROM cart_item
          JOIN cart ON cart_item.cart_id = cart.cart_id
          WHERE cart.user_id = ?
        `, [userId]);
  
        itemCount = cartItemCount[0].itemCount; // เก็บจำนวนชิ้นทั้งหมดในตะกร้า
      } catch (error) {
        console.error(error);
      }
    }
    res.render('webstore/collection', {
      itemCount: itemCount,
      collection: rows,
      activePage: activePage  // ส่ง activePage ไปยัง nav.ejs
    });

      

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//BROWSE MANAGEMENT
router.get('/browse', async (req, res) => {
  const activePage = 'browse';  
  const { search: searchQuery, price: priceFilter } = req.query;
  const userId = req.session.userId;
  let itemCount = 0;

  try {
    // Base query construction
    let query = `
      SELECT title, price, promotion_price, icongame_url, game_id 
      FROM game
    `;
    const whereClauses = [];
    const params = [];

    // Search condition
    if (searchQuery) {
      whereClauses.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Price filter condition
    if (priceFilter) {
      switch(priceFilter) {
        case 'under-500':
          whereClauses.push('COALESCE(promotion_price, price) <= 500');
          break;
        case '500-1000':
          whereClauses.push('COALESCE(promotion_price, price) BETWEEN 500 AND 1000');
          break;
        case '1000-2000':
          whereClauses.push('COALESCE(promotion_price, price) BETWEEN 1000 AND 2000');
          break;
        case 'over-2000':
          whereClauses.push('COALESCE(promotion_price, price) > 2000');
          break;
      }
    }

    // Combine conditions
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    query += ' ORDER BY title ASC';

    const [rows] = await db.promise().query(query, params);
    const [category] = await db.promise().query('SELECT category_id, name FROM category');

    // Cart item count
    if (userId) {
      try {
        const [cartItemCount] = await db.promise().query(`
          SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
          FROM cart_item
          JOIN cart ON cart_item.cart_id = cart.cart_id
          WHERE cart.user_id = ?
        `, [userId]);
        itemCount = cartItemCount[0].itemCount;
      } catch (error) {
        console.error(error);
      }
    }

    res.render('webstore/browse', {
      itemCount,
      activePage,
      game: rows,
      category: category,
      categoryName: searchQuery ? `Search results for "${searchQuery}"` : "ALL GAMES",
      selectedCategory: null,
      searchQuery,
      priceFilter
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/browse/:category_id', async (req, res) => {
  const activePage = 'browse';
  const { category_id } = req.params;
  const { search: searchQuery, price: priceFilter } = req.query;
  const userId = req.session.userId;
  let itemCount = 0;

  try {
    // Base query
    let query = `
      SELECT game.game_id, game.title, game.price, 
             game.promotion_price, game.icongame_url, 
             category.name AS category_name 
      FROM game
      LEFT JOIN game_category ON game.game_id = game_category.game_id
      LEFT JOIN category ON game_category.category_id = category.category_id
      WHERE game_category.category_id = ?
    `;
    const params = [category_id];

    // Search condition
    if (searchQuery) {
      query += ' AND (game.title LIKE ? OR game.description LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Price filter condition
    if (priceFilter) {
      switch(priceFilter) {
        case 'under-500':
          query += ' AND COALESCE(game.promotion_price, game.price) <= 500';
          break;
        case '500-1000':
          query += ' AND COALESCE(game.promotion_price, game.price) BETWEEN 500 AND 1000';
          break;
        case '1000-2000':
          query += ' AND COALESCE(game.promotion_price, game.price) BETWEEN 1000 AND 2000';
          break;
        case 'over-2000':
          query += ' AND COALESCE(game.promotion_price, game.price) > 2000';
          break;
      }
    }

    query += ' ORDER BY game.title ASC';

    // Execute query
    const [rows] = await db.promise().query(query, params);
    const [category] = await db.promise().query(`
      SELECT * FROM category WHERE category_id = ?;
    `, [category_id]);
    
    const [allCategory] = await db.promise().query(`
      SELECT category_id, name FROM category ORDER BY name ASC
    `);

    // Cart item count
    if (userId) {
      try {
        const [cartItemCount] = await db.promise().query(`
          SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
          FROM cart_item
          JOIN cart ON cart_item.cart_id = cart.cart_id
          WHERE cart.user_id = ?
        `, [userId]);
        itemCount = cartItemCount[0].itemCount;
      } catch (error) {
        console.error(error);
      }
    }

    res.render('webstore/browse', {
      itemCount,
      activePage,
      game: rows,
      category: allCategory,
      categoryName: category[0]?.name || "Category",
      selectedCategory: category_id,
      searchQuery,
      priceFilter
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//CART MANAGEMENT //
// CART MANAGEMENT
router.get('/cart', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect('/login');
  }

  try {
    // ดึงจำนวนสินค้าทั้งหมดในตะกร้า
    const [cartItemCount] = await db.promise().query(`
      SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
      FROM cart_item
      JOIN cart ON cart_item.cart_id = cart.cart_id
      WHERE cart.user_id = ?
    `, [userId]);

    const itemCount = cartItemCount[0].itemCount || 0;

    // ดึงข้อมูลสินค้าในตะกร้า
    const [rows] = await db.promise().query(`
      SELECT title, price, promotion_price, icongame_url, quantity, price_at_purchase, 
             cart.cart_id, cart_item.game_id, platform 
      FROM cart_item
      JOIN game ON game.game_id = cart_item.game_id 
      JOIN cart ON cart_item.cart_id = cart.cart_id
      JOIN user ON cart.user_id = user.user_id
      WHERE user.user_id = ?
      ORDER BY title ASC
    `, [userId]);

    res.render('webstore/cart', { 
      cart: rows, 
      activePage: 'cart',
      itemCount: itemCount  // ส่งตัวแปร itemCount ไป nav.ejs
    });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/cart/delete/:cart_id/:game_id/:platform',async (req,res)=>{
    const {cart_id,game_id,platform} = req.params;
    

    try{
        await db.promise().query(
          `DELETE FROM cart_item WHERE game_id = ? AND cart_id = ? AND platform = ? `,[game_id,cart_id,platform]
        );
        res.redirect('/cart');
    }
    catch(error){
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
});

//PRODUCT MANAGEMENT
// PRODUCT MANAGEMENT
router.post('/product/add/:game_id/:platform', async (req, res) => {
  const { game_id, platform } = req.params;
  const userId = req.session.userId; // ใช้ userId จาก session เป็น cart_id

  try {
    // 1) เพิ่ม/อัปเดตสินค้าใน cart_item
    await db.promise().query(`
      INSERT INTO cart_item (cart_id, game_id, price_at_purchase, platform)
      SELECT ?, ?, IFNULL(promotion_price, price) AS price_at_purchase, ?
      FROM game
      WHERE game_id = ?
      ON DUPLICATE KEY UPDATE quantity = quantity + 1;
    `, [userId, game_id, platform, game_id]);

    // 2) ดึงจำนวนสินค้ารวม (sum(quantity)) ในตะกร้าของผู้ใช้
    const [rows] = await db.promise().query(`
      SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
      FROM cart_item
      JOIN cart ON cart_item.cart_id = cart.cart_id
      WHERE cart.user_id = ?
    `, [userId]);

    const itemCount = rows[0].itemCount || 0;

    // 3) ส่งผลกลับไปให้ Frontend
    res.json({
      message: 'Product added to cart successfully!',
      itemCount: itemCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/product/:id', async (req, res) => {
  const { id } = req.params;
  const activePage = 'product';  // กำหนดว่าเป็นหน้า Product
  try {
    // ดึงข้อมูลเกมพร้อมกับหมวดหมู่จากฐานข้อมูล (แสดงหมวดหมู่ด้วยการเว้นวรรค)
    const [game] = await db.promise().query(`
      SELECT g.*, GROUP_CONCAT(c.name ORDER BY c.name ASC SEPARATOR ' ') AS category_name 
      FROM game g 
      LEFT JOIN game_category gc ON g.game_id = gc.game_id
      LEFT JOIN category c ON gc.category_id = c.category_id
      WHERE g.game_id = ? 
      GROUP BY g.game_id`, 
      [id]
    );

    if (game.length === 0) {
      return res.status(404).send("Game not found");
    }
    const userId = req.session.userId;
    let itemCount = 0; // กำหนดค่าเริ่มต้นเป็น 0
  
    if (userId) {
      try {
        // 2) SUM(quantity) เพื่อดึง “จำนวนชิ้น” รวม
        const [cartItemCount] = await db.promise().query(`
          SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
          FROM cart_item
          JOIN cart ON cart_item.cart_id = cart.cart_id
          WHERE cart.user_id = ?
        `, [userId]);
  
        itemCount = cartItemCount[0].itemCount; // เก็บจำนวนชิ้นทั้งหมดในตะกร้า
      } catch (error) {
        console.error(error);
      }
    }

    // ส่งข้อมูลเกมและหมวดหมู่ไปยังหน้า EJS
    res.render('webstore/product_detail', { 
      itemCount: itemCount,

      game: game[0],
      activePage: activePage
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// //ACCOUNT MANAGEMENT
router.get('/login', (req, res) => {
  const msg = req.query.msg;
  res.render('webstore/login', { msg });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    await Authen.userLogin(req, res, email, password);
  } catch (error) {
    console.error('Login route error:', error);
    res.redirect("/login?msg=server_error");
  }
});

// Protected Route Example
router.get('/dashboard', Authen.authentication, (req, res) => {
  res.render('dashboard');
});



  router.get('/register', async (req,res) =>{
    try{
        
        res.render('webstore/register');

    }catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
  });

  router.post('/register', async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber,role } = req.body;
    if( !email || !password || !firstName || !lastName || !phoneNumber ){
      res.status(400).send('You need to enter all of info')
    }
    try {
      // ตรวจสอบว่า email มีอยู่ในระบบหรือยัง
      const [existingUser] = await db.promise().query(
        'SELECT * FROM user WHERE email = ?',
        [email]
      );
      
      if (existingUser.length > 0) {
        // มี email นี้อยู่แล้ว
        return res.status(400).send('Email already registered. Please use another email or sign in.');
        
      }

      else{


      // แฮชรหัสผ่านด้วย bcrypt
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      // Insert ผู้ใช้ใหม่ลงในตาราง user
      const [result] = await db.promise().query(
        `INSERT INTO user (email, password, first_name, last_name, phone_number, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, firstName, lastName, phoneNumber, role || 'Customer']  // ใช้ 'Customer' เป็น default
      );
      
      // สร้าง session ให้กับผู้ใช้ใหม่
      req.session.authenticated = true;
      req.session.userId = result.insertId;
      req.session.email = email;
      req.session.role = role || 'Customer';

  
      // (Optionally) สร้างตะกร้าสำหรับผู้ใช้ใหม่ หากระบบของคุณต้องการ
      await db.promise().query(
        `INSERT INTO cart (user_id) VALUES (?)`,
        [result.insertId]
      );

      res.redirect('/login');

      }

    } catch (error) {
      res.status(400).send('Email already registered. Please use another email or sign in.');
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during session destroy:', err);
            return res.status(500).send('Error during logout.');
        }
        // Redirect to homepage or login page after logout
        res.redirect('/');
    });
  });
    

  
//THANK YOU 
//THANK YOU 
router.get('/thankyou', async (req, res) => {
  const user_id = req.session.userId;
  
  if (!user_id) return res.redirect('/login');

  try {
    const [cartItems] = await db.promise().query(
      `SELECT * FROM cart_item WHERE cart_id = ?`,
      [user_id]
    );

    if (cartItems.length === 0) {
      return res.status(404).send('Cart is empty or invalid cart_id.');
    }

    // คำนวณยอดรวม
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.price_at_purchase * item.quantity;
    });

    // สร้างออเดอร์
    const [orderResult] = await db.promise().query(
      `INSERT INTO user_order (user_id, cart_id, order_date, total_amount)
       VALUES (?, ?, NOW(), ?)`,
      [user_id, user_id, totalAmount]
    );
    
    const orderId = orderResult.insertId;

    // เพิ่มรายการออเดอร์
    const insertOrderItemsPromises = cartItems.map(item => {
      return db.promise().query(
        `INSERT INTO order_item (order_id, game_id, price_at_purchase, quantity, platform)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.game_id, item.price_at_purchase, item.quantity, item.platform]
      );
    });

    await Promise.all(insertOrderItemsPromises);

    // ลบรายการในตะกร้า
    await db.promise().query(
      `DELETE FROM cart_item WHERE cart_id = ?`,
      [user_id]
    );

    // ดึงอีเมลผู้ใช้
    const [user] = await db.promise().query(
      `SELECT email FROM user WHERE user_id = ?`,
      [user_id]
    );

    // เรนเดอร์หน้า thank-you พร้อมข้อมูล
    res.render('webstore/thankyou', {
      email: user[0].email,
      orderId: orderId,
      itemCount: 0, // หลังชำระเงิน ตะกร้าว่าง
      activePage: 'thankyou'
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing order.');
  }
});

//PROFILE MANAGEMENT
router.get('/profile', async (req, res) => {
  const activePage = 'Profile';
  const userId = req.session.userId;  // ประกาศ userId ที่นี่

  if (!userId) {
    return res.redirect('/login');  // ถ้าผู้ใช้ยังไม่ได้ล็อกอิน ให้ไปที่หน้า login
  }

  try {
    const [user] = await db.promise().query(
      'SELECT * FROM user WHERE user_id = ?', 
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).send('User not found');
    }
    
    let itemCount = 0; // กำหนดค่าเริ่มต้นเป็น 0
  
    if (userId) {
      try {
        // SUM(quantity) เพื่อดึง “จำนวนชิ้น” รวม
        const [cartItemCount] = await db.promise().query(`
          SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
          FROM cart_item
          JOIN cart ON cart_item.cart_id = cart.cart_id
          WHERE cart.user_id = ?
        `, [userId]);
  
        itemCount = cartItemCount[0].itemCount; // เก็บจำนวนชิ้นทั้งหมดในตะกร้า
      } catch (error) {
        console.error(error);
      }
    }

    res.render('webstore/profile', { 
      user: user[0],
      activePage: activePage,
      itemCount: itemCount
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

router.post('/profile',async(req,res)=>{
    const {firstName,lastName,phoneNumber,address,email,newPassword,img} = req.body;
    
    try{

      if(newPassword){

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [result] = await db.promise().query(`
      UPDATE user SET first_name = ? , last_name = ? , phone_number = ? , address = ? , email = ? , password = ? , profile_image = ? WHERE user_id = ?
        `,[firstName,lastName,phoneNumber,address,email,hashedPassword,img,req.session.userId]);

        if (result.affectedRows > 0) {

          res.redirect('/profile');
        } 
      }
      else{
        const [result] = await db.promise().query(`
          UPDATE user SET first_name = ? , last_name = ? , phone_number = ? , address = ? , email = ? , profile_image = ? WHERE user_id = ?
            `,[firstName,lastName,phoneNumber,address,email,img,req.session.userId]);
    
            if (result.affectedRows > 0) {
              // Redirect พร้อม query parameter เมื่อสำเร็จ
              res.redirect('/profile');
            } 
      }

    }catch (error) {
      console.error(error);
      
      res.status(500).json({ success: false, message: 'Server error' });
    }
});

//History management

router.get('/history',async(req,res)=>{

      const activePage = 'Profile'
      const user_id = req.session.userId;
      let itemCount = 0;

      if (user_id) {
        try {
          // 2) SUM(quantity) เพื่อดึง “จำนวนชิ้น” รวม
          const [cartItemCount] = await db.promise().query(`
            SELECT IFNULL(SUM(cart_item.quantity), 0) AS itemCount
            FROM cart_item
            JOIN cart ON cart_item.cart_id = cart.cart_id
            WHERE cart.user_id = ?
          `, [user_id]);
    
          itemCount = cartItemCount[0].itemCount; // เก็บจำนวนชิ้นทั้งหมดในตะกร้า
        } catch (error) {
          console.error(error);
        }
      }
      
      const [user_order] = await db.promise().query(
        `
        SELECT uo.order_id, uo.user_id, order_date, total_amount, first_name, last_name, address, phone_number 
        FROM game_shop.user_order uo
        JOIN user u ON uo.user_id = u.user_id
        WHERE uo.user_id = ?
        ORDER BY uo.order_date DESC;
        `, [user_id]
      );

          const insertOrderItemsPromises = user_order.map(async (order) =>{

          const [order_items] = await db.promise().query(`
            SELECT * FROM game_shop.order_item ot
            JOIN user_order uo ON uo.order_id = ot.order_id
            JOIN game g ON ot.game_id = g.game_id
            WHERE ot.order_id = ?;
             ;
            `,[order.order_id]);
            
            
            order.items = order_items;

            return order;
        });

      const ordersWithItems = await Promise.all(insertOrderItemsPromises);
      res.render('webstore/receipt.ejs',{receipt: ordersWithItems,activePage,itemCount: itemCount});
});

module.exports = router;