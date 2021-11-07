const express = require("express");
const app = express();
const cors = require('cors');
const mongodb = require("mongodb");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv")
dotenv.config();
const PORT = process.env.PORT || 3000;
const url = process.env.MONGO_URI;

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
        console.log("error1")
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
console.log(error)
    }
})

app.post("/login", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("airbnbClone");

        // Find the user 
        let user = await db.collection("airbnb_users").findOne({ email: req.body.email });

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
        console.log("error3")
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
        console.log("error4")
    }
})


app.post("/create-room",[authenticate], async function (req, res) {
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
        console.log("error5")
        res.status(500).json({
            message: "Something went wrong"
        })
    }

})

app.get("/booked-rooms/:id/:startDate/:endDate/:days",[authenticate],async function (req,res) {
    try {
        
        // Connect the Database
        let client = await mongoClient.connect(url);
        
        // Select the DB
        let db = client.db("airbnbClone");
        
        //Select the Collection and perform the action
        
        let data = await db.collection("roominfos").find({_id:mongodb.ObjectId(req.params.id)}).toArray();
        data[0].isbooked=true;
        data[0].startdate=req.params.startDate;
        data[0].enddate=req.params.endDate;
        // data[0].customername=req.params.username;
        data[0].days=req.params.days
        let update = await db.collection("roominfos")
        .findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: data[0] })
        console.log(data);
        data[0].userid=req.userid;
        console.log("-----------------------------------------------------------------------------")
        let bookeddata = await db.collection("bookedrooms").insertMany(data);
        
        // Close the Connection
        await client.close();

        res.json(data);
    } catch (error) {
        console.log("room-book-error")
    }
})

app.get("/roomsbooked",[authenticate],async function (req,res) {
    try {
        
        // Connect the Database
        let client = await mongoClient.connect(url);

        // Select the DB
        let db = client.db("airbnbClone");

        
        //Select the Collection and perform the action
        let data = await db.collection("bookedrooms").find({userid:req.userid}).toArray();
        console.log("roomsbooked");
        
        // Close the Connection
        await client.close();

        res.json(data);
    } catch (error) {
        console.log("error7")
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
        console.log("error8")
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
        console.log("error9")
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