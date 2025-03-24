CREATE TABLE cart_item (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- กำหนดคีย์หลักสำหรับแถว
    cart_id INT NOT NULL,               -- หมายเลขตะกร้า
    game_id INT NOT NULL,               -- หมายเลขเกม
    price_at_purchase DECIMAL(10,2) NOT NULL,  -- ราคาขณะที่ซื้อลงในตะกร้า
    platform VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1,    -- จำนวนของสินค้าที่เลือก (ค่าเริ่มต้นเป็น 1)
    UNIQUE(cart_id, game_id),
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);