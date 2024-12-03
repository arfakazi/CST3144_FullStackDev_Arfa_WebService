const express = require("express");
const app = express();
const ObjectID = require("mongodb").ObjectID;
const MongoClient = require("mongodb").MongoClient;
const path = require("path");

function config(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    next();
}

app.use(express.json());
app.set("port", 3000);
app.use(config);

let db;
MongoClient.connect(process.env.CONNECTION_STRING, (err, client) => {
    if (err) throw err;
    db = client.db(process.env.DATABASE);
});

app.get("/", (req, res, next) => {
    console.log("Accessed root endpoint");
    res.send("Select a collection, e.g., /collection/messages");
});

app.param("collectionName", (req, res, next) => {
    console.log(`Collection set to: ${collectionName}`);
    req.collection = db.collection(collectionName);
    return next();
});

app.get("/collection/:collectionName", (req, res, next) => {
    console.log(`Retrieving objects from collection: ${req.params.collectionName}`);
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    });
});

app.post("/collection/:collectionName", (req, res, next) => {
    console.log(`Adding an object to collection: ${req.params.collectionName}`);
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e);
        console.log("Object added:", results.ops);
        res.send(results.ops);
    });
});

app.put("/collection/:collectionName/:id", (req, res, next) => {
    console.log(
        `Updating object in collection: ${req.params.collectionName} with ID: ${req.params.id}`
    );
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e);
            console.log(
                result.result.n === 1 ? "Object updated successfully" : "Object update failed"
            );
            res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" });
        }
    );
});

app.get("/search/:collectionName", (req, res, next) => {
    const searchQuery = req.query.query || "";
    console.log(`Searching in collection: ${req.params.collectionName} with query: ${searchQuery}`);
    const searchRegex = new RegExp(searchQuery, "i");
    req.collection
        .find({
            $or: [
                { subject: searchRegex },
                { location: searchRegex },
                { price: { $regex: searchRegex } },
                { spaces: { $regex: searchRegex } },
            ],
        })
        .toArray((e, results) => {
            if (e) return next(e);
            console.log(`Search results: ${results.length} documents found`);
            res.send(results);
        });
});

var imagePath = path.resolve(__dirname, "static");
app.use("/static", express.static(imagePath));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Express.js server running at localhost:" + port);
});
