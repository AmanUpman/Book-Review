import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
dotenv.config({
  path: "./.env",
});

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Books",
  password: "aman1234",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let readbooks = [
  { id: 1, name: "Harry Potter" },
  { id: 2, name: "Lord of the rings" },
];

let booksdetails = [
  {
    id: 1,
    bookname: "Harry Potter",
    notes: "Good Book",
    rating: 5,
    timeofreading: "5 Hours",
  },
  {
    id: 2,
    bookname: "Lord of the rings",
    notes: "Good Book",
    rating: 4,
    timeofreading: "4 Hours",
  },
];

//Getting the data of books and also joing all the tables in the database
async function getBooks() {
  try {
    const result = await db.query("SELECT * FROM readbooks order by readbooks.id asc");
    readbooks = result.rows;
    return readbooks;
  } catch (err) {
    console.log("Not able to fetch the books", err);
  }
}

//Default landing page
app.get("/", async(req, res) => {
  let books = await getBooks();
  res.render("index.ejs", { books: books });
});

//Adding a new book
app.post("/addbook", async(req,res)=>{
    let bookname = req.body.bookname;
    await db.query("INSERT INTO readbooks (name) VALUES ($1)",[bookname]);

    res.redirect("/");
})






app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on the port : ${process.env.PORT}`);
});

