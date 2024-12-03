const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

const app = express();
app.use(express.json());
app.set("port", 3000);
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    next();
});

let db;
MongoClient.connect(
    "mongodb+srv://arfakazi:jimin1310@cluster0.jpux4ux.mongodb.net/",
    (err, client) => {
        db = client.db("Aras_Classes");
    }
);

// Routing

app.get("/", (req, res, next) => {
    res.send("select a collection,e.g.,/collection/messages");
});

// Sets the collection Name
app.param("collectionName", (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next();
});

//
app.get("/collection/:collectionName", (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    });
});

// ??
app.post("/collection/:collectionName", (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e);
        res.send(results.ops);
    });
});

const ObjectID = require("mongodb").ObjectID;
app.get("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e);
        res.send(result);
    });
});

// Update an object
app.put("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e);
            res.send(result.result.n === 1 ? { msg: "Success :D" } : { msg: "Error :(" });
        }
    );
});

// Delete an object
app.delete("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.deleteOne({ _id: ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e);
        res.send(result.result.n === 1 ? { msg: "Success!!" } : { msg: "error" });
    });
});

app.listen(3000, () => {
    console.log("express.js server running at localhost:3000");
});
