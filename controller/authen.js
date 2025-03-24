const bcrypt = require("bcryptjs");
const UserDB = require("../model/userModel");

const userLogin = async (req, res, email, password) => {
    try {
      const oldUser = await UserDB.findByKey('email', email);
  
      if (!oldUser) {
        return res.redirect("/login?msg=email_not_found");
      }
  
      const isPasswordCorrect = bcrypt.compareSync(password, oldUser.password);
      if (!isPasswordCorrect) {
        return res.redirect("/login?msg=incorrect_password");
      }
  
      req.session.authenticated = true;
      req.session.userId = oldUser.user_id;
      req.session.role = oldUser.role;
      req.session.email = oldUser.email;
      req.session.username = oldUser.first_name;
  
      return res.redirect('/');
  
    } catch (error) {
      console.error('Login error:', error);
      return res.redirect("/login?msg=server_error");
    }
  };
  
  const authentication = async (req, res, next) => {
    try {
      if (!req.session.authenticated) {
        return res.redirect("/login?msg=session_expired");
      }
  
      const user = await UserDB.findById(req.session.userId);
      if (!user) {
        req.session.destroy();
        return res.redirect("/login?msg=user_not_found");
      }
  
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.redirect("/login?msg=server_error");
    }
  };
  

exports.userLogin = userLogin;


module.exports.authentication = async (req, res, next) => {
    console.log("Session in authentication: ", req.sessionID);

    // Check if the user is authenticated
    if (!req.session.authenticated) {
        console.log("Unauthenticated access attempt.");
        return res.redirect("/?q=session-expired");
    }
    
    try {
        // Check if user exists in the database
        let user = await UserDB.findById(req.session.userId);
        console.log("Authenticated user: " + user);

        if (!user) {
            console.log("User not found. Session expired.");
            req.session.destroy();
            return res.redirect("/?q=session-expired");
        }

        // User exists, proceed to the next route
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server error. Please reload the page later." });
    }
};

