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
    const result = await db.query("SELECT * FROM readbooks ORDER BY id ASC");
    readbooks = result.rows;

    for (let book of readbooks) {
      if (book.name) {
        const response = await axios.get(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(
            book.name
          )}`
        );

        if (response.data.docs && response.data.docs.length > 0) {
          let coverId = response.data.docs[0].cover_i || null;

          if (response.data.docs.length > 1 && response.data.docs[1].cover_i) {
            coverId = response.data.docs[1].cover_i;
          }

          if (coverId) {
            book.coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
          } else {
            book.coverUrl = "https://via.placeholder.com/150";
          }
          await db.query("UPDATE readbooks SET cover_url = $1 WHERE id = $2", [
            book.coverUrl,
            book.id,
          ]);
        } else {
          book.coverUrl = "https://via.placeholder.com/150";
        }
      } else {
        book.coverUrl = "https://via.placeholder.com/150";
      }
    }
    return readbooks;
  } catch (err) {
    console.error("Not able to fetch the books :", err);
    return [];
  }
}

//Default landing page
app.get("/", async (req, res) => {
  let books = await getBooks();
  res.render("index.ejs", { books: books, message: "Enter the book name" });
});

//Adding a new book
app.post("/addbook", async (req, res) => {
  let bookname = req.body.bookname?.trim();
  let books = await getBooks();

  try {
    const result = await db.query("SELECT * FROM readbooks WHERE name = $1", [
      bookname,
    ]);

    if (!bookname) {
      console.log("Error: Book name cannot be empty.");
      return res.render("index.ejs", {
        books: books,
        message: "Book name cannot be empty",
      });
    }

    if (result.rows.length > 0) {
      console.log("Error: Book name is already present.");
      return res.render("index.ejs", {
        books: books,
        message: "Book Already Present",
      });
    }

    await db.query("INSERT INTO readbooks (name) VALUES ($1)", [bookname]);
    res.redirect("/");
  } catch (err) {
    console.error("There was an error while adding a new book", err);
    res.redirect("/");
  }
});

//Editing an book name
app.post("/editBook", async (req, res) => {
  try {
    const newName = req.body.updatedTitle?.trim();
    const userId = req.body.updatedBookId;
    if (!newName || !userId) {
      console.log("Error: Book name or ID is missing.");
      return res.redirect("/");
    }
    await db.query("UPDATE readbooks SET name = $1 WHERE id = $2", [
      newName,
      userId,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error("There was an error while editing a book", err);
    res.redirect("/");
  }
});

// //Deleting a book
// app.post("/deleteBook", async (req, res) => {
//   let response = await db.query("DELETE FROM TA");
// });

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on the port : ${process.env.PORT}`);
});

//Problems encountered
//1. It took me a bit of time to understand how we are feching the covers of all the novels from the API. As we are not able to directy fetch covers from the covers api but we have to first search for the book using its title and only after that we are able to obtain the book if that helped us to get the covers.

//2. Another thing I learned from the above problem is that whenevr we try to  fetch a name to use for another link and we didnt encode it then it would cause some issues.

//3. I also has a silly  dought of why are we are able to just assign book.coverUrl without first defining coverUrl itself, but after revising javascript a bit I got the following ans : [In JavaScript, particularly when working with objects, you can dynamically add properties to an object at any time. This means that you don't need to explicitly define a property like coverUrl in the object before you assign a value to it]

//4. I got stuck on the edge where there was a error and we created a entry in the table readbooks where there was no name, causing issues for us. Same goes for the case where there is another book with the same name.
