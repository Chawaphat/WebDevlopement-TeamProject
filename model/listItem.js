const BaseSQLModel = require("./baseSQLModel");

// Create a new class for a specific table
class TodoItemsModel extends BaseSQLModel {
  constructor() {
    super("todoitems"); //table 'products'
  }

  speak() {
    console.log("Hello!");
  }

  //check if there is a record of todoItems in the database?
  // if there is no todoItems record, call setinitialItems() to define intial
  async defineInitialItems() {
    const results = await this.findAll()
      .then((results) => {
        if (results[0] == undefined) {
          this.setinitialItems();
        } else {
          console.log("All todoItems:", results);
        }
      })
      .catch((error) => {
        console.error("Error retrieving users:", error);
      });

    return results;
  }

  async setinitialItems() {
    const item1 = {
      name: "Welcome to your todolist!",
    };
    const item2 = {
      name: "Hit the + button to add a new item",
    };
    const item3 = {
      name: "<--- Hit this to delete an item",
    };

    const defaultItems = [item1, item2, item3];

    defaultItems.forEach((item) =>
      this.create(item)
        .then((insertId) => {
          console.log("New user created with ID:", insertId);
        })
        .catch((error) => {
          console.error("Error creating user:", error);
        })
    );
  }

  async getTodoItemsName(){
    const results =  await this.findAll(); //change from findcolumn => find all
    return results;

  }

}

const TodoItemsDB = new TodoItemsModel();

module.exports = TodoItemsDB;
