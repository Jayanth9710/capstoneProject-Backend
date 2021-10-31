const express = require("express");
const app = express();
const cors = require('cors');
const mongodb = require("mongodb");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv")

const PORT = process.env.port || 3000;
const url = process.env.MONGO_URI;
dotenv.config();
app.use(cors({
    origin: "*"
}))

app.use(express.json());


function authenticate(req, res, next) {
    try {
    // Check if the token is present
    // if present -> check if it is valid
    if(req.headers.authorization){
        jwt.verify(req.headers.authorization,process.env.JWT_SECRET,function(error,decoded){
            if(error){
                res.status(500).json({
                    message: "Unauthorized"
                })
            }else{
                console.log(decoded)
                req.userid = decoded.id;
            next()
            }
            
        });
      
    }else{
        res.status(401).json({
            message: "No Token Present"
        })
    }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
    
}

app.post("/register", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone");

        // Hash the password
        let salt = bcryptjs.genSaltSync(10);
        let hash = bcryptjs.hashSync(req.body.password, salt)
        req.body.password = hash;

        // Select the Collection and perform the action
        let data = await db.collection("airbnb_users").insertOne(req.body)

        // Close the Connection
        await client.close();

        res.json({
            message: "User Registered",
            id: data._id
        })
    } catch (error) {

    }
})

app.post("/login", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone");

        // Find the user 
        let user = await db.collection("airbnb_users").findOne({ username: req.body.username });

        if (user) {
            // Hash the incoming password
            // Compare that password with user's password
            console.log(req.body)
            console.log(user.password)
            let matchPassword = bcryptjs.compareSync(req.body.password, user.password)
            if (matchPassword) {
                // Generate JWT token
                let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
                res.json({
                    message: true,
                    token
                })
            } else {
                res.status(404).json({
                    message: "Username/Password is incorrect"
                })
            }
            // if both are correct then allow them
        } else {
            res.status(404).json({
                message: "Username/Password is incorrect"
            })
        }

    } catch (error) {
        console.log(error)
    }
})


app.get("/list-all-rooms", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone");

        // Select the collection and perform action
        let data = await db.collection("roominfos").find().toArray();
        

        // Close the Connection
        client.close();

        res.json(data);
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})


app.post("/create-room", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone")

        // Select the Collection and perform the action
        
        console.log(req.body)
        let data = await db.collection("roominfos").insertOne(req.body)

        // Close the Connection
        await client.close();

        res.json({
            message: "Room Added"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong"
        })
    }

})

app.get("/booked-rooms/:id",async function (req,res) {
    try {
        console.log(req.params.id)
        // Connect the Database
        let client = await mongoClient.connect(url);

        // Select the DB
        let db = client.db("airbnbClone");

        //Select the Collection and perform the action
        let data = await db.collection("roominfos").find({_id:mongodb.ObjectId(req.params.id)}).toArray();
        let bookeddata = await db.collection("bookedrooms").insertMany({_id:mongodb.ObjectId(req.params.id)}).toArray();
        console.log(data)
        // Close the Connection
        await client.close();

        res.json(data);
    } catch (error) {
        
    }
})

app.get("/roomsbooked",async function (req,res) {
    try {
        
        // Connect the Database
        let client = await mongoClient.connect(url);

        // Select the DB
        let db = client.db("airbnbClone");

        //Select the Collection and perform the action
        let data = await db.collection("roominfos").find({}).toArray();
        console.log("roomsbooked");
        console.log(data)
        // Close the Connection
        await client.close();

        res.json(data);
    } catch (error) {
        
    }
})



app.put("/update-room/:id",[authenticate], async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone")

        // Select the Collection and perform the action
        let data = await db.collection("roominfos")
            .findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body })

        // Close the Connection
        await client.close();

        res.json({
            message: "Room Details Updated"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
})


app.delete("/delete-room/:id",[authenticate], async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone")

        // Select the Collection and perform the action
        let data = await db.collection("roominfos")
            .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) })

        // Close the Connection
        await client.close();

        res.json({
            message: "Room Deleted"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
})

app.get("/bookedrooms", [authenticate], async (req, res) => {
    res.json({
        message: "Protected Data"
    })
})

app.listen(PORT, function () {
    console.log(`The app is listening in port ${PORT}`)
})