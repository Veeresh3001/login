const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const uuid = require("uuid");

const uuidv4 = uuid.v4;
// console.log(uuidv4())

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "users.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at Port localhost:3001");
      // console.log(uuidv4());
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = '${email}'`;
  const dbData = await db.get(sql);
  if (dbData === undefined) {
    const errMsg = {
      status: 400,
      err_msg: "invalid User or Email Not Registered",
    };
    res.send(errMsg);
  } else {
    if (dbData.password === password) {
      const load = { email: email };
      const jwtToken = jwt.sign(load, "My_Token");
      // res.status(200);
      res.send({ status: 200, jwt_token: jwtToken });
    } else {
      const errMsg = { status: 400, err_msg: "invalid Password!!" };
      // res.status(400);
      res.send(errMsg);
    }
  }
});

app.get("/users", async (req, res) => {
  // res.send("Welcome postman...!");
  const sql = `SELECT * FROM users`;
  const data = await db.all(sql);
  // const list = data.json();
  res.send(data);
});

// Post Users API
app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { name, email, password } = userDetails;
  const id = uuidv4();

  const sql = `SELECT * FROM users WHERE email = '${email}'`;
  const dbData = await db.get(sql);
  // response.send(dbData);
  if (dbData === undefined) {
    const postUserQuery = `
    INSERT INTO
      users (id, name, email, password)
    VALUES
      ('${id}', '${name}', '${email}', '${password}');`;
    const data = await db.run(postUserQuery);
    if (data) {
      response.send({ id });
    } else {
      response.send({
        err_msg: "Something went wrong, Please try again later",
      });
    }
  } else {
    response.send({
      err_msg: "This email already exists, please use another email",
    });
  }
});

// Delete User API
app.delete("/delete/:id", async (request, response) => {
  const { id } = request.params;
  const deleteuserQuery = `
  DELETE FROM
    users
  WHERE
    id='${id}';`;
  await db.all(deleteuserQuery);
  response.send("User Deleted");
});
