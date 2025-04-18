const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const borrowCollection = client.db('book-category').collection('borrowedBooks')

    // GET books
    app.get('/books', async (req, res) => {
      const category = req.query.category;
      let query = {};
      if (category) {
        query = { category: category }
      }
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    //Post books

    app.post('/books', async (req, res) => {
      const newBooks = req.body;
      const result = await booksCollection.insertOne(newBooks);
      res.send(result);
    })

    app.get('/books/:id', async (req, res) => {
      const id = req.params;
      const result = await booksCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    })

    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedBook = req.body;
      const book = {
        $set: {
          name: updatedBook.name,
          image: updatedBook.image,
          category: updatedBook.category,
          quantity: updatedBook.quantity,
          rating: updatedBook.rating,
          author: updatedBook.author,
          description: updatedBook.description,
        }
      }
      const result = await booksCollection.updateOne(filter, book)
      res.send(result)
    })


    app.get('/bookBorrowed', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { userEmail: email }
      }

      // if (req.user.email !== req.query.email  ) {
      //   return req.status(403).send({ massage: "Forbidden Access" });
      // }

      const cursor = borrowCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/borrow/:id', async (req, res) => {
      const id = req.params.id;
      const borrowBookDetails = req.body;

      await booksCollection.updateMany(
        { quantity: { $type: "string" } },
        [
          { $set: { quantity: { $toInt: "$quantity" } } }
        ]
      );

      await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { quantity: -1 } }
      );
      const result = await borrowCollection.insertOne(borrowBookDetails);
      res.send(result)
    })

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
