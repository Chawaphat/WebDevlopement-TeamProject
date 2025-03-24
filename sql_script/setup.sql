CREATE DATABASE IF NOT EXISTS game_shop;
USE game_shop;

-- 2. สร้าง User สำหรับ MySQL (ไม่เกี่ยวกับตาราง)
CREATE USER 'kaopadpu'@'%' IDENTIFIED BY '321';
GRANT ALL PRIVILEGES ON game_shop.* TO 'kaopadpu'@'%';
FLUSH PRIVILEGES;

-- 3. สร้างตาราง User (Admin & Customer)
CREATE TABLE IF NOT EXISTS user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE CHECK (email LIKE '%_@__%.__%'),
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    profile_image VARCHAR(255),
    role ENUM('Customer', 'Admin') DEFAULT 'Customer'
);

-- 4. สร้างตาราง Category (ประเภทของเกม)
CREATE TABLE IF NOT EXISTS category (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    category_image VARCHAR(255)
);

-- 5. สร้างตาราง Game
CREATE TABLE IF NOT EXISTS game (
    game_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    promotion_price DECIMAL(10,2) CHECK (promotion_price >= 0),
    description TEXT,
    main_image_url VARCHAR(255) NOT NULL,
    icongame_url VARCHAR(255),
    trailer_url VARCHAR(255)
);

-- 6. สร้างตาราง Cart (เก็บตะกร้าของแต่ละ User)
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 7. สร้างตาราง Cart Item (สินค้าในตะกร้า)
CREATE TABLE IF NOT EXISTS cart_item (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- กำหนดคีย์หลักสำหรับแถว
    cart_id INT NOT NULL,               -- หมายเลขตะกร้า
    game_id INT NOT NULL,               -- หมายเลขเกม
    price_at_purchase DECIMAL(10,2) NOT NULL,  -- ราคาขณะที่ซื้อลงในตะกร้า
    platform VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1,    -- จำนวนของสินค้าที่เลือก (ค่าเริ่มต้นเป็น 1)
    UNIQUE(cart_id, game_id, platform),
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

-- 8. สร้างตารางเชื่อม Game กับ Category (รองรับหลายหมวดหมู่ต่อเกม)
CREATE TABLE IF NOT EXISTS game_category (
    game_id INT,
    category_id INT,
    PRIMARY KEY (game_id, category_id),
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

-- 9. สร้างตาราง Game Images (รองรับหลายภาพต่อเกม)
CREATE TABLE IF NOT EXISTS game_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

-- 10. สร้าง View สำหรับดูรายการเกมพร้อมหมวดหมู่
CREATE VIEW game_category_view AS
SELECT 
    g.game_id,
    g.title,
    g.icongame_url,
    gc.category_id,
    c.name AS category_name
    FROM 
    game g
    JOIN 
    game_category gc ON g.game_id = gc.game_id
    JOIN 
    category c ON gc.category_id = c.category_id;



CREATE TABLE user_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,   
    user_id INT,                               
    cart_id INT,                              
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed', 
    total_amount DECIMAL(10, 2),                
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE, 
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE 
);

CREATE TABLE order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    game_id INT,
    price_at_purchase DECIMAL(10, 2),
    quantity INT,
    platform VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES user_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);


