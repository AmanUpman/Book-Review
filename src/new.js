import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
dotenv.config({ path: "./.env" });

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

// Dummy Data to see data format
let readbooks = [
  { id: 1, name: "Harry Potter" },
  { id: 2, name: "Lord of the Rings" },
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
    bookname: "Lord of the Rings",
    notes: "Good Book",
    rating: 4,
    timeofreading: "4 Hours",
  },
];

// Getting the data of books and fetching the covers from the API
async function getBooks() {
  try {
    const result = await db.query("SELECT * FROM readbooks ORDER BY id ASC");
    readbooks = result.rows;

    for (let book of readbooks) {
      if (book.name) {
        const response = await axios.get(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(book.name)}`
        );

        if (response.data.docs && response.data.docs.length > 0) {
          let coverId = response.data.docs[0].cover_i || null;

          if (response.data.docs.length > 1 && response.data.docs[1].cover_i) {
            coverId = response.data.docs[1].cover_i;
          }

          book.coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : "https://via.placeholder.com/150";

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

    console.log(readbooks);
    return readbooks;
  } catch (err) {
    console.error("Error fetching books:", err);
    return [];
  }
}

// Default landing page
app.get("/", async (req, res) => {
  let books = await getBooks();
  res.render("index.ejs", { books: books });
});

// Adding a new book
app.post("/addbook", async (req, res) => {
  try {
    let bookname = req.body.bookname?.trim();
    if (!bookname) {
      console.log("Error: Book name cannot be empty.");
      return res.redirect("/");
    }

    await db.query("INSERT INTO readbooks (name) VALUES ($1)", [bookname]);
    res.redirect("/");
  } catch (err) {
    console.error("Error while adding a new book:", err);
    res.redirect("/");
  }
});

// Editing a book name
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
    console.error("Error updating book:", err);
    res.redirect("/");
  }
});

// Deleting a book
app.post("/deleteBook", async (req, res) => {
  try {
    const bookId = req.body.bookId;

    if (!bookId) {
      console.log("Error: No book ID provided for deletion.");
      return res.redirect("/");
    }

    await db.query("DELETE FROM readbooks WHERE id = $1", [bookId]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.redirect("/");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port: ${process.env.PORT || 3000}`);
});
