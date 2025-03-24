const BaseSQLModel = require("./baseSQLModel");

// สร้างคลาสสำหรับจัดการตาราง users
class UserModel extends BaseSQLModel {
  constructor() {
    // ใช้ table "users" และ primary key เป็น "user_id"
    super("user", "user_id");
  }

  speak() {
    console.log("Hello!");
  }

  async getUserByEmail(email) {
    // ค้นหาผู้ใช้ด้วย email
    const result = await this.findByKey('email', email);
    return result;
  }
}

const UserDB = new UserModel();

module.exports = UserDB;
