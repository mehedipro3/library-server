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
   

    // GET books with optional category filter
    app.get('/books',  async(req, res)=> {
      const category = req.query.category;
      let query = {};
      if(category){
        query = { category : category}
      }
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
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
