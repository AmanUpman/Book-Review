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

//Dummy Data to see data format
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

//Getting the data of books and also fetchin the covers from the API
async function getBooks() {
  try {
    const result = await db.query(
      "SELECT * FROM readbooks order by readbooks.id asc"
    );
    readbooks = result.rows;

    for (let book of readbooks) {
      const response = await axios.get(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(
          book.name
        )}`
      );

      if (response.data.docs && response.data.docs.length > 0) {
        let coverId = response.data.docs[0].cover_i;
        if(response.data.docs[1].cover_i){
          coverId = response.data.docs[1].cover_i;
        } 
        
        if (coverId) {
          book.coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
        } else {
          book.coverUrl = "https://via.placeholder.com/150";
        }
      }
    }
    return readbooks;
  } catch (err) {
    console.log("Not able to fetch the books", err);
    return [];
  }
}

//Default landing page
app.get("/", async (req, res) => {
  let books = await getBooks();
  res.render("index.ejs", { books: books });
});

//Adding a new book
app.post("/addbook", async (req, res) => {
  let bookname = req.body.bookname;
  await db.query("INSERT INTO readbooks (name) VALUES ($1)", [bookname]);

  res.redirect("/");
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on the port : ${process.env.PORT}`);
});

//Problems encountered
//1. It took me a bit of time to understand how we are feching the covers of all the novels from the API. As we are not able to directy fetch covers from the covers api but we have to first search for the book using its title and only after that we are able to obtain the book if that helped us to get the covers.

//2. Another thing I learned from the above problem is that whenevr we try to  fetch a name to use for another link and we didnt encode it then it would cause some issues.

//3. I also has a silly  dought of why are we are able to just assign book.coverUrl without first defining coverUrl itself, but after revising javascript a bit I got the following ans : [In JavaScript, particularly when working with objects, you can dynamically add properties to an object at any time. This means that you don't need to explicitly define a property like coverUrl in the object before you assign a value to it]
