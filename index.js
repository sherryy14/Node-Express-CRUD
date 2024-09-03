const express = require("express");
const { faker } = require("@faker-js/faker");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");

const port = 3000;

// Middleware for sessions and flash messages
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// to change method to patch, put, delete
app.use(methodOverride("_method"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set(express.static(path.join(__dirname, "public")));

//   to get random user
let createRandomUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.userName(),
    faker.internet.email(),
    faker.internet.password(),
  ];
};

// Create the connection to database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "nodedb",
  password: "",
});

let createUser = () => {
  let randomData = [];

  for (let i = 1; i <= 100; i++) {
    randomData.push(createRandomUser());
  }

  // to run query
  let query =
    "INSERT INTO `users` ( `id`, `name`, `email`, `password`) VALUES ?";

  try {
    connection.query(query, [randomData], (err, results) => {
      if (err) throw err;
      console.log(results);
    });
  } catch (err) {
    console.error(err);
  }

  // to end connection
  connection.end();
};

// Home Page To Get All Users
app.get("/", (req, res) => {
  // also send user count

  // to run query
  let query = "SELECT * FROM `users`";

  try {
    connection.query(query, (err, users) => {
      if (err) throw err;
      res.render("index", { users });
    });
  } catch (err) {
    console.error(err);
  }

  // to end connection
  // connection.end();
});

// Display Single User To Edit
app.get("/user/:id/edit", (req, res) => {
  let id = req.params.id;
  // to run query
  let query = "SELECT * FROM `users` WHERE `id` = ?";
  try {
    connection.query(query, [id], (err, user) => {
      if (err) throw err;
      res.render("edit_user", { user });
    });
  } catch (err) {
    console.error(err);
  }
});

// Update User Using Patch Method
app.patch("/users/:id", (req, res) => {
  let id = req.params.id;
  let { name, email } = req.body;
  // to run query
  let query = "UPDATE `users` SET `name` = ?, `email` = ? WHERE `id` = ?";
  try {
    connection.query(query, [name, email, id], (err, users) => {
      if (err) throw err;
      req.flash("success_msg", "User updated successfully!");
      res.redirect("/");
    });
  } catch (err) {
    req.flash("error_msg", "There was an error updating the user.");
    res.redirect("/");
  }
});

// delete single user
app.delete("/user/:id/delete", (req, res) => {
  let id = req.params.id;
  // to run query
  let query = "DELETE FROM `users` WHERE `id` = ?";
  try {
    connection.query(query, [id], (err, users) => {
      if (err) throw err;
      req.flash("success_msg", "User deleted successfully!");
      res.redirect("/");
    });
  } catch (err) {
    req.flash("error_msg", "There was an error deleting the user.");
    res.redirect("/");
  }
});

// Display Form
app.get("/user/create", (req, res) => {
  res.render("create_user");
});

// Save User Data
app.post("/user/create", (req, res) => {
  let { name, email, password } = req.body;
  // to run query
  let query =
    "INSERT INTO `users` (`id`, `name`, `email`,`password`) VALUES (?, ?, ?, ?)";
  let data = [uuidv4(), name, email, password];
  try {
    connection.query(query, data, (err, users) => {
      if (err) throw err;
      req.flash("success_msg", "User created successfully!");
      res.redirect("/");
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "There was an error creating the user.");
    res.redirect("/user/create");
  }
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
