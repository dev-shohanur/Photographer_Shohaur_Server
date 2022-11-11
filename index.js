const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId }  = require('mongodb');

const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Api Runing');
})

//User Name: process.env.DB_USER



//Password:   process.env.DB_PASSWORD

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@fristusemongodb.yjaddi5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    console.log(authHeader);

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        console.log(err);
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {

    try {
        const servicesCollection = client.db('photographerShohanur').collection('service');
        const reviewCollection = client.db('photographerShohanur').collection('review');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5d' })
            
            res.send({ token })
        })

        
        app.get('/service', async (req, res) => {
            const cursor = servicesCollection.find({});
            const services = await cursor.limit(3).toArray();
            res.send(services);
        })
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.send(service);
        })
        app.post('/service', async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            service._id = result.insertedId;
            res.send(service);
        })
        app.get('/review', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            
            if (decoded.email !== req.query.email) {
                
                return res.status(403).send({ message: 'unauthorized access' })
                
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            console.log(reviews);
            res.send(reviews);
        })
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            review._id = result.insertedId;
            res.send(review);
        })
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { serviceId: id };
            console.log(query);
            const review = await reviewCollection.find(query, { sort: [['IsoDate', -1]] }).toArray();
            res.send(review);
        })
        app.get('/reviews/:id',  async (req, res) => {
            // const decoded = req.decoded;
            
            // if (decoded.email !== req.query.email) {
                
            //     return res.status(403).send({ message: 'unauthorized access' })

            // }
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);
            res.send(review);
        })
        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: ObjectId(id) }
            const review = req.body.reviews;
            console.log(review);
            const option = {upsert: true}
            const updateUser = {
                $set: {
                    reviews: review
                }
            };
            const result = await reviewCollection.updateOne(filter, updateUser, option);
            res.send(result)
        })
        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query)
            res.send(result);
        })
    }
    finally {

    }
};
run().catch(error => console.error(error))

app.listen(port, () => {
    console.log('Api Runing port', port);
})