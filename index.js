const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://library-management-syste-f5bfb.web.app'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  // Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden" });
    }
    req.user = decoded;
  });

  next();

}


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
    // await client.connect();
    console.log("Connected to MongoDB");

    // Declare collections
    const booksCollection = client.db('book-category').collection('books');
    const borrowCollection = client.db('book-category').collection('borrowedBooks')


    // auth related APIs

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ success: true, token });
    });


    //Token Delete

    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ success: true });
    })



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


    app.get('/bookBorrowed', verifyToken, async (req, res) => {
      const email = req.query.email;

      // console.log(req.cookies);

      if (req.user?.email !== email) {
        return res.status(403).send({ message: "Forbidden" });
      }


      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      try {
        const query = { userEmail: email };
        const result = await borrowCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching borrowed books:', error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });


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

    app.delete('/bookBorrowed/:id', async (req, res) => {
      const id = req.params.id;

      try {
        // Optional: Update book quantity +1 when returned
        await booksCollection.updateOne(
          { _id: new ObjectId(req.body.bookId) },
          { $inc: { quantity: 1 } }
        );

        const query = { _id: new ObjectId(id) };
        const result = await borrowCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({ message: "Book returned successfully" });
        } else {
          res.status(404).send({ message: "Borrow record not found" });
        }

      } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).send({ message: "Server Error" });
      }
    });




  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);

// Start the server inside the run function
app.listen(port, () => {
  console.log(`Library Server running on Port: ${port}`);
});



// Test route
app.get('/', (req, res) => {
  res.send('Library is open for all!');
});
