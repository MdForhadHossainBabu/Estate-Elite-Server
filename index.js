const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tekyyoa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {


    // collections
    const advertisementCollection = client
      .db('advertisement')
      .collection('advertise');
    const userCollection = client.db('advertisement').collection('users');
    const propertiesCollection = client
      .db('advertisement')
      .collection('properties');
    const wishlistCollection = client
      .db('advertisement')
      .collection('wishlist');
    
    
    
    // jwt related apis

    app.post('/jwt', async (req, res) => {
      const user = req.body;  
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
      res.send({token})
    })



    // verify token of middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({message: 'unauthorized access'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if (err) {
         return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next()
     })
    }

    // verify admin 
    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({message: 'forbidden access'})
      }
  next()
    }

    // wish list insert in db
    app.post('/wishlist', async (req, res) => {
      const item = req.body;
      const result = await wishlistCollection.insertOne(item);
      res.send(result);
    });
    // wishlist get all
    app.get('/wishlist', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = await wishlistCollection.find(query).toArray();
      res.send(cursor);
    });
    // verify button for manage item list
    app.patch('/wishlist/verify/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          roles: 'verify'
        }
      }
      const result = await wishlistCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    // reject button for manage item list
    app.patch('/wishlist/reject/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          roles: 'reject'
        }
      }
      const result = await wishlistCollection.updateOne(query, updateDoc);
      res.send(result)
    })

    app.post('/description', async (req, res) => {
      const item = req.body;
      const result = await wishlistCollection.insertOne(item);
      res.send(result);
    });
    app.get('/description', async (req, res) => {
      const cursor = await wishlistCollection.find().toArray();
      res.send(cursor);
    });

    // post properties from all item in db
    app.post('/properties', async (req, res) => {
      const item = req.body;
      const result = await propertiesCollection.insertOne(item);
      res.send(result);
    });
    //  delete specific item from properties
    app.delete('/properties/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertiesCollection.deleteOne(query);
      res.send(result);
    });

    //  all properties get item
    app.get('/properties', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = await propertiesCollection.find(query).toArray();
      res.send(cursor);
    });
    // single properties get item
    app.get('/properties/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertiesCollection.findOne(query);
      res.send(result);
    });

    // advertisement home page url
    app.get('/advertisement', async (req, res) => {
      const result = await advertisementCollection.find().toArray();
      res.send(result);
    });
    // specific get data from id
    app.get('/advertisement/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await advertisementCollection.findOne(query);
      res.send(result);
    });

    // post all users & checking all existing email
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already existed', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    //  get all users & checking all existing email get
    app.get('/users',  async (req, res) => {
    
      const cursor = await userCollection.find().toArray();
      res.send(cursor);
    });


    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) { 
        admin = user?.role === 'admin'
      }
      res.send({admin})
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id)};
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // user admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
         role: 'admin' 
        }
      }
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    // user agent
    app.patch('/users/agent/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
         role: 'agent' 
        }
      }
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Elite Estate Running Now');
});
app.listen(port, () => {
  console.log(`Elite Estate Running On Port : ${port}`);
});
