const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ee44r.mongodb.net/?appName=Cluster0`;

// Create MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Declare collections
    const booksCollection = client.db('book-category').collection('books');

    // GET all books
    app.get("/books", async (req, res) => {
      try {
        const books = await booksCollection.find().toArray();
        res.send(books);
      } catch (err) {
        console.error("Error fetching books:", err);
        res.status(500).send({ error: "Failed to fetch books" });
      }
    });

    // Test route
    app.get('/', (req, res) => {
      res.send('Library is open for all!');
    });

    // Start the server inside the run function
    app.listen(port, () => {
      console.log(`Library Server running on Port: ${port}`);
    });

  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);
