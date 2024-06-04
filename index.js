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
   const advertisementCollection = client.db('advertisement').collection('advertise')
   const userCollection = client.db('advertisement').collection('users');
   const propertiesCollection = client.db('advertisement').collection('properties')

   // post properties from all item in db
   app.post('/properties', async(req, res)=>{
     const item = req.body;
     const result = await propertiesCollection.insertOne(item);
     res.send(result);
   })

   //  all properties get item
   app.get('/properties', async (req, res) => {
     const email = req.query.email;
     const query = {email: email}
     const cursor = await propertiesCollection.find(query).toArray();
     res.send(cursor);
   })
   // single properties get item
   app.get('/properties/:id', async (req, res) => {
     const id = req.params.id;
     const query = { _id: new ObjectId(id) };
     const result = await propertiesCollection.findOne(query);
     res.send(result)
   })


  // advertisement home page url 
  app.get('/advertisement', async (req, res) => {
   const result = await advertisementCollection.find().toArray()
   res.send(result);
  })
// specific get data from id 
  app.get('/advertisement/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await advertisementCollection.findOne(query);
   res.send(result);
  })


   // post all users & checking all existing email
   app.post('/users', async (req, res) => {
     const user = req.body;
     const query = { email: user.email };
     const existingUser = await userCollection.findOne(query);
     if (existingUser) {
       return res.send({message: 'user already existed', insertedId: null})
     }
     const result = await userCollection.insertOne(user);
     res.send(result)
   })
   //  get all users & checking all existing email get
   app.get('/users', async (req, res) => {
     const cursor = await userCollection.find().toArray();
     res.send(cursor)
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
 res.send('Elite Estate Running Now')
});
app.listen(port, () => {
 console.log(`Elite Estate Running On Port : ${port}`);
})