const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tr0mbiu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db("Assignment-12").collection("users");
        const surveyCollection = client.db("Assignment-12").collection("survey");



        app.get('/survey', async(req, res) =>{
            const cursor = surveyCollection.find();
            const result = await cursor.toArray();
            res.send(result);
          });

        app.post('/survey', async(req, res) =>{
            const newSurvey = req.body;
            console.log(newSurvey);
            const result = await surveyCollection.insertOne(newSurvey)
            res.send(result);
        })
        // users api

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                user.role = user.role || 'user';
                const query = { email: user.email };
                const existingUser = await userCollection.findOne(query);
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists', insertedId: null });
                }

                const result = await userCollection.insertOne(user);

                if (result && result.ops && result.ops.length > 0) {
                    const insertedUser = result.ops[0];
                    res.status(201).json({ message: 'User created successfully', insertedUser });
                } else {
                    res.status(500).json({ error: 'Failed to retrieve inserted user data' });
                }
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        app.patch('/users/admin/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const role = req.body.role;

                const filter = { _id: new ObjectId(id) };
                const update = { $set: { role: role } };

                const result = await userCollection.updateOne(filter, update);
                res.json({ modifiedCount: result.modifiedCount });
            } catch (error) {
                console.error('Error updating user role:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Delete user
        app.delete('/users/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };

                const result = await userCollection.deleteOne(query);
                res.json({ deletedCount: result.deletedCount });
            } catch (error) {
                console.error('Error deleting user:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // ...

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;



            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        // Get user by email
        
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email, role: 'user' };
            const user = await userCollection.findOne(query);
            res.send({ user });
        });


        // Get ProUser by email
      
        app.get('/users/pro/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email, role: 'proUser' }; // Ensure this matches the role in your database
            const proUser = await userCollection.findOne(query);
            res.send({ proUser });
        });


        // Get Surveyor by email
        app.get('/users/surveyor/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email, role: 'surveyor' };
            const surveyor = await userCollection.findOne(query);
            res.send({ surveyor });
        });

        app.delete('/survey/:id', async (req, res) => {
            const id = req.params.id;
      
            if (!ObjectId.isValid(id)) {
              console.error('Invalid ObjectID:', id);
              return res.status(400).send('Invalid ObjectID');
            }
      
            const query = { _id: new ObjectId(id) };
            const result = await surveyCollection.deleteOne(query);
            res.send(result);
          });





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
