const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { request } = require("http");
const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "my_database.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000, () => {
      console.log("Server Running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

const authenticateJWT = (request, response, next) => {
  const authHeader = request.headers["authorization"];

  if (!authHeader) {
    return response.status(401).send("Authorization header is missing.");
  }

  const jwtToken = authHeader.split(" ")[1];

  if (!jwtToken) {
    return response.status(401).send("JWT token is missing.");
  }

  jwt.verify(jwtToken, "Karthik1234", (error, payload) => {
    if (error) {
      return response.status(401).send("Invalid JWT Token");
    }

    // Set userId to the request object for further use
    request.userId = payload.userId;
    console.log(payload); // Log the payload (remove or comment out in production)

    next(); // Proceed to the next middleware/route handler
  });
};

app.put("/update-profile", authenticateJWT, async (request, response) => {
  const { userId } = request;
  const { name, email, password } = request.body;
  if (name) {
    const updateQuery = `UPDATE todos SET name='${title}' WHERE id = '${id}'`;
    await db.run(updateQuery);
  }
  if (email) {
    const updateQuery = `UPDATE todos SET email='${email}' WHERE id = '${id}'`;
    await db.run(updateQuery);
  }
});

app.put("/change-password", authenticateJWT, async (request, response) => {
  const { currentPassword, newPassword } = request.body;
  const { userId } = request;
  const userQuery = `SELECT * FROM users WHERE id='${userId}'`;
  const dbUser = await db.get(userQuery);
  console.log(dbUser);
  const isPasswordMatched = await bcrypt.compare(
    "$2b$10$Ut3saCOCEnz4scvb8pjal.IjpHL2mzQyphAvQFvPoWa7nUgsnu1EC",
    "1234"
  );
  if (isPasswordMatched){
    const updateQuery = `UPDATE users SET password='${newPassword}' WHERE id = '${userId}'`;
    await db.run(updateQuery);
    response.send("Successfully Updated");
  }else{
    response.send("Invalid Password");
  }
});

app.post("/sign", async (request, response) => {
  const { name, email, password } = request.body;
  console.log(email);
  const selectQuery = `SELECT * FROM users WHERE email='${email}'`;
  const dbResponse = await db.get(selectQuery);
  const id = uuidv4();
  if (dbResponse === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `INSERT INTO users(id,name,email,password) 
        VALUES(
        '${id}',
        '${name}',
        '${email}',
        '${hashedPassword}'
        )`;
    await db.run(insertQuery);
    response.send("Successfully Created");
  } else {
    response.send("User Already Exist");
  }
});

app.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const selectUserQuery = `SELECT * FROM users WHERE email = '${email}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        userId: dbUser.id,
      };
      const jwtToken = jwt.sign(payload, "Karthik1234");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

app.post("/todos", authenticateJWT, async (request, response) => {
  const { title, status } = request.body;
  const todoId = uuidv4();
  const { userId } = request;
  const insertQuery = `INSERT INTO todos(id,user_id,title,status) VALUES(
    '${todoId}',
    '${userId}',
    '${title}',
    '${status}'
  )`;
  const dbResponse = await db.run(insertQuery);
  response.send("Successfully Added");
});

app.get("/todos", authenticateJWT, async (request, response) => {
  const { userId } = request;
  const todosQuery = `SELECT * FROM todos WHERE user_id = '${userId}'`;
  const dbResponse = await db.all(todosQuery);
  console.log(dbResponse);
  response.status(200).json(dbResponse);
});

app.delete("/todos/:id", authenticateJWT, async (request, response) => {
  const { id } = request.params;
  console.log(id);
  const deleteQuery = `DELETE  FROM todos WHERE id = '${id}'`;
  await db.run(deleteQuery);
  response.send("Succesfully Removed");
});

app.put("/todos/:id", authenticateJWT, async (request, response) => {
  const { id } = request.params;
  const { title, status } = request.body;
  console.log(id, title, status);
  const updateQuery = `UPDATE todos SET title='${title}', status='${status}' WHERE id = '${id}'`;
  await db.run(updateQuery);
  response.send("Successfully Updated");
});

initializeDBAndServer();
