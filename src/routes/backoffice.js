//backoffice
const express = require('express');
const router = express.Router();
const db = require('../../config/db'); 
const Authen = require("../../controller/authen");

const checkRoleAdmin = (req, res, next) => {
    if (req.session.role !== 'Admin') {
      return res.status(403).send("Access denied!"); // If not Admin, deny access
    }
    next(); // If Admin, continue to the next middleware or route
  };
  
const checkAdmin = (req, res, next) => {
    if (req.session.role !== 'Admin' || req.session.email !== 'admin@gmail.com') {
      return res.status(403).send("Access denied!"); // If not main Admin, deny access
    }
    next(); // If main Admin, continue to the next middleware or route
  };


router.use('/categories', checkRoleAdmin);
router.use('/products', checkRoleAdmin);
router.use('/managehomepage', checkRoleAdmin);
router.use('/managenewrelease', checkRoleAdmin);

router.use('/manageusers', checkAdmin);

router.get('/', (req, res) => {
    res.redirect('/backoffice/categories');
});

// Fetch categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM category ORDER BY name ASC');
        res.render('backoffice/main_category', { categories: rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Add category form
router.get('/categories/add', (req, res) => {
    res.render('backoffice/add_category');
});

// Add category
router.post('/categories/add', async (req, res) => {
    const { name, category_image } = req.body;
    try {
        await db.promise().query(
            'INSERT INTO category (name, category_image) VALUES (?, ?)',
            [name, category_image || null]
        );
        res.redirect('/backoffice/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Edit(GET) category form
router.get('/categories/edit/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT * FROM category WHERE category_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).send('Category not found');
        }
        res.render('backoffice/edit_category', { category: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Edit(POST) category
router.post('/categories/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category_image } = req.body;
    try {
        await db.promise().query(
            'UPDATE category SET name = ?, category_image = ? WHERE category_id = ?',
            [name, category_image || null, id]
        );
        res.redirect('/backoffice/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//MANAGEMENT GAMES IN CATEGORY
router.get('/categories/update/:id',async (req,res) =>{
    const {id} = req.params;
    try{
        const [rows] = await db.promise().query(`
            SELECT * FROM game_shop.game_category_view WHERE category_id = ? ORDER BY title ASC
            `,[id]);

        const [category] = await db.promise().query(`
            SELECT * FROM category WHERE category_id = ?
            `,[id]);
        
        console.log('hi');
        
        const [browse] = await db.promise().query(`
            SELECT DISTINCT g.game_id , g.title , g.icongame_url 
            FROM game g JOIN category c ON 1=1
            WHERE NOT EXISTS (
                SELECT 1
                FROM game_category gc
                WHERE gc.game_id = g.game_id AND gc.category_id = ?
            ) ORDER BY title ASC ;
            `,[id]);

            res.render('backoffice/update_game_category', {category:rows,browse:browse,name:category[0].name,category_id:category[0].category_id});
        
        
        
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});

router.post('/categories/update/:id',async (req,res) =>{
    const {id} = req.params;
    const {selectedGames } = req.body;
    
    try{
        if(selectedGames && selectedGames.length > 0){

            if (Array.isArray(selectedGames)) {
                const insertCategoryPromises = selectedGames.map(gameId => {
                    return db.promise().query(
                        "INSERT INTO game_category (game_id, category_id) VALUES (?, ?)",
                        [gameId, id]
                    );
                });
                await Promise.all(insertCategoryPromises);
            }

            res.send('Update successful');
        }
        
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});

router.post('/categories/gamedelete/:gameId/:categoryId',async(req,res) =>{

    const {gameId,categoryId} = req.params;

    try{
        await db.promise().query(`
            DELETE FROM game_category WHERE game_id  = ? AND category_id = ?;
            `,[gameId, categoryId]);
            res.json({ message: 'Game deleted successfully' });
    }catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Delete category
router.get('/categories/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query('DELETE FROM category WHERE category_id = ?', [id]);
        res.redirect('/backoffice/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch products
router.get('/products', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM game ORDER BY game_id DESC');
        res.render('backoffice/main_product', { products: rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Add product form
router.get('/products/add', async (req, res) => {
    try {
        const [categories] = await db.promise().query('SELECT * FROM category ORDER BY name ASC');
        res.render('backoffice/add_product', { categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Add product
router.post('/products/add', async (req, res) => {
    const { title, price, promotion_price, description, main_image_url, icongame_url, trailer_url, category_id } = req.body;
    try {
        const [result] = await db.promise().query(
            `INSERT INTO game 
             (title, price, promotion_price, description, main_image_url, icongame_url, trailer_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             `,
            [title, price || 0, promotion_price || null, description || null, main_image_url || null, icongame_url || null, trailer_url || null]
        );

        const newGameId = result.insertId;

        if (Array.isArray(category_id)) {
            const insertCategoryPromises = category_id.map(catId => {
                return db.promise().query(
                    'INSERT INTO game_category (game_id, category_id) VALUES (?, ?)',
                    [newGameId, catId]
                );
            });

            await Promise.all(insertCategoryPromises); // รันทุก `INSERT` พร้อมกัน
        }
        res.redirect('/backoffice/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Edit product form
router.get('/products/edit/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [games] = await db.promise().query('SELECT * FROM game WHERE game_id = ?', [id]);
        
        if (games.length === 0) {
            return res.status(404).send('Product not found');
        }
        const game = games[0];
        const [categories] = await db.promise().query('SELECT * FROM category ORDER BY name ASC');
        const [gameCategory] = await db.promise().query('SELECT category_id FROM game_category WHERE game_id = ? ', [id]);
        let currentCategoryId = null;

        const selectedCategoryIds = gameCategory.map(cat => cat.category_id);

        if (gameCategory.length > 0) {
            currentCategoryId = gameCategory[0].category_id;
        }
        res.render('backoffice/edit_product', { product: game, categories, selectedCategoryIds });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Update product
router.post('/products/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { title, price, promotion_price, description, main_image_url, icongame_url, trailer_url, category_id } = req.body;
    try {
        await db.promise().query(
            `UPDATE game 
             SET title = ?, price = ?, promotion_price = ?, description = ?, main_image_url = ?, icongame_url = ?, trailer_url = ?
             WHERE game_id = ?`,
            [title, price || 0, promotion_price || null, description, main_image_url, icongame_url, trailer_url, id]
        );
        await db.promise().query('DELETE FROM game_category WHERE game_id = ?', [id]);
        if (Array.isArray(category_id)) {
            const insertCategoryPromises = category_id.map(catId => {
                return db.promise().query(
                    "INSERT INTO game_category (game_id, category_id) VALUES (?, ?)",
                    [id, catId]
                );
            });
            await Promise.all(insertCategoryPromises);
        }
        res.redirect('/backoffice/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Delete product
router.get('/products/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query('DELETE FROM game WHERE game_id = ?', [id]);
        res.redirect('/backoffice/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/managehomepage', async (req, res) => {
    try {

        const [rows] = await db.promise().query(`
            SELECT g.game_id, g.title, g.price, g.promotion_price, g.main_image_url, g.icongame_url, hg.position
            FROM game g
            LEFT JOIN homepage_game hg ON g.game_id = hg.game_id
            ORDER BY hg.position ASC, g.game_id DESC

          `);
        res.render('backoffice/managehomepage', { products: rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Update homepage selection
router.post('/homepage/update', async (req, res) => {
    try {
      // รับข้อมูลจาก form (จะได้เป็น array ของ game_id)
      let homepageGames = req.body.homepageGames;
  
      // หากมีเพียง game เดียว อาจไม่อยู่ในรูปแบบ Array ให้แปลงเป็น Array เสมอ
      if (!Array.isArray(homepageGames)) {
        homepageGames = [homepageGames];
      }
  
      // ตรวจสอบว่าเลือกไม่เกิน 5 เกม (สามารถตรวจสอบอีกครั้งได้)
      if (homepageGames.length > 5) {
        return res.status(400).send('เลือกได้สูงสุด 5 เกมเท่านั้น');
      }
  
      // เริ่ม Transaction (ถ้าคุณใช้ transaction)
      // ลบข้อมูลเก่าในตาราง homepage_game ทั้งหมด
      await db.promise().query('DELETE FROM homepage_game');
  
      // Insert ข้อมูลใหม่ตามลำดับที่เลือกไว้
      for (let i = 0; i < homepageGames.length; i++) {
        const gameId = homepageGames[i];
        const position = i + 1; // ลำดับเริ่มต้นจาก 1
        await db.promise().query(
          'INSERT INTO homepage_game (game_id, position) VALUES (?, ?)',
          [gameId, position]
        );
      }
  
      res.redirect('/backoffice/managehomepage');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  // รับข้อมูล reorderData [{ gameId: 'xx', position: 1 }, ...]
router.post('/homepage/reorder', async (req, res) => {
    try {
      const { reorderData } = req.body;
      if (!reorderData || !Array.isArray(reorderData)) {
        return res.status(400).send('Invalid reorder data');
      }
  
      // อัปเดต position ใน homepage_game ทีละรายการ
      const updatePromises = reorderData.map(item => {
        return db.promise().query(
          'UPDATE homepage_game SET position = ? WHERE game_id = ?',
          [item.position, item.gameId]
        );
      });
      await Promise.all(updatePromises);
  
      res.sendStatus(200); // OK
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


  router.get('/managenewrelease', async (req, res) => {
    
    try {
        // ดึงข้อมูลเกมทั้งหมด
        const [allGames] = await db.promise().query(`
            SELECT g.game_id, g.title, g.price, g.promotion_price, g.main_image_url, g.icongame_url,
                   nr.position IS NOT NULL AS in_newrelease, nr.position
            FROM game g
            LEFT JOIN new_release_game nr ON g.game_id = nr.game_id
            ORDER BY nr.position ASC, g.game_id DESC
        `);

        // ดึงเฉพาะเกมที่อยู่ใน `new_release_game`
        const selectedNewRelease = allGames.filter(game => game.in_newrelease);

        // ส่งข้อมูลไปที่หน้า EJS
        res.render('backoffice/managenewrelease', { products: allGames, selectedNewRelease });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});





// Update new release selection
router.post('/newrelease', async (req, res) => {
    
    try {
        let newReleaseGames = req.body.newReleaseGames;
        
        // แปลงให้เป็น array เสมอ
        if (!Array.isArray(newReleaseGames)) {
            newReleaseGames = newReleaseGames ? [newReleaseGames] : [];
        }

        // ลบเกมทั้งหมดออกจากตาราง new_release_game ก่อน แล้วค่อยใส่เกมที่ถูกเลือกกลับไป
        await db.promise().query('DELETE FROM new_release_game');

        // ใส่เกมที่ถูกเลือกกลับเข้าไป
        if (newReleaseGames.length > 0) {
            const values = newReleaseGames.map((gameId, index) => [gameId, index + 1]);
            await db.promise().query('INSERT INTO new_release_game (game_id, position) VALUES ?', [values]);
        }

        res.redirect('/backoffice/managenewrelease');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Update new release selection
router.post('/newrelease/reorder', async (req, res) => {
    try {
        const { reorderData } = req.body;
        if (!reorderData || !Array.isArray(reorderData)) {
            return res.status(400).send('Invalid reorder data');
        }

        // อัปเดตตำแหน่งในฐานข้อมูล
        const updatePromises = reorderData.map(item => {
            return db.promise().query(
                'UPDATE new_release_game SET position = ? WHERE game_id = ?',
                [item.position, item.gameId]
            );
        });

        await Promise.all(updatePromises);

        res.sendStatus(200); // ส่ง OK กลับไป
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/manageusers', async (req, res) => {
    try {
      // ดึงข้อมูลผู้ใช้ทั้งหมดจากฐานข้อมูล
      const [users] = await db.promise().query('SELECT user_id, email, role FROM user');
      res.render('backoffice/manageusers', { users });  // ส่งข้อมูลผู้ใช้ไปยัง view
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.post('/set-role/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { role } = req.body;  // รับข้อมูล role ที่จะเปลี่ยน

    try {
        const [user] = await db.promise().query('SELECT * FROM user WHERE user_id = ?', [user_id]);

        if (user.length === 0) {
            return res.status(404).send('User not found');
        }

        const userEmail = user[0].email;

        if (userEmail === 'admin@gmail.com' && role === 'Customer') {
            return res.status(400).send('Cannot change role of admin@gmail.com to Customer');
        }

        if (role !== 'Admin' && role !== 'Customer') {
            return res.status(400).send('Invalid role');
        }

        // เปลี่ยน role ของผู้ใช้เป็นที่กำหนด (Admin หรือ Customer)
        await db.promise().query(
            'UPDATE user SET role = ? WHERE user_id = ?',
            [role, user_id]
        );

        if (req.session.userId === user_id) {
            req.session.role = role;  // รีเฟรช session ให้ตรงกับข้อมูลในฐานข้อมูล
          }

        // รีเฟรชหน้า manageusers
        res.redirect('/backoffice/manageusers');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//ORDER MANAGEMENT
router.get('/order_history',async (req,res)=>{

    try{
        const [rows] = await db.promise().query(`
        SELECT first_name,last_name, uo.*,date_format(order_date,'%a %b %d %Y %H:%i:%s') AS order_date_format FROM game_shop.user_order uo
        JOIN user ON uo.user_id = user.user_id ;
        `);

        res.render('backoffice/order_history',{order:rows,});
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
    
});

router.get('/order_detail/:order_id/:name', async (req, res) => {

    const { order_id, name } = req.params;
    const decodedName = decodeURIComponent(name);

    try {

        const [rows] = await db.promise().query(`
            SELECT oi.*, g.title
            FROM order_item oi
            JOIN game g ON g.game_id = oi.game_id
            WHERE oi.order_id = ?;
            `, [order_id]);

        const [orderInfo] = await db.promise().query(`
            SELECT total_amount, DATE_FORMAT(order_date, '%a %b %d %Y %H:%i:%s') AS formatted_order_date
            FROM user_order
            WHERE order_id = ?;
            `, [order_id]);

        if (orderInfo.length > 0) {
            res.render('backoffice/order_detail', { orderItems: rows, name: decodedName, totalAmount: orderInfo[0].total_amount, orderDate: orderInfo[0].formatted_order_date });
        } else {
            res.status(404).send('Order not found');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




module.exports = router;
