// Importing required modules
const express = require("express");
const app = express(); // Initializing the express app
const ObjectID = require("mongodb").ObjectID;
const MongoClient = require("mongodb").MongoClient;
const path = require("path");

// Middleware to parse JSON data from incoming requests
app.use(express.json());

// Setting the port number for the server
app.set("port", 3000);

// Middleware for handling Cross-Origin Resource Sharing (CORS) settings
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
    res.setHeader("Access-Control-Allow-Credentials", "true"); // Allow credentials in cross-origin requests
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT"); // Allowed HTTP methods
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    ); // Allowed headers in requests
    next(); // Proceed to the next middleware or route handler
});

app.use((req, res, next) => {
    const method = req.method; // Extracting the HTTP method from the request
    const url = req.url;
    const timestamp = new Date();

    console.log(`[${timestamp}] ${method} request to ${url}`); // Logging the method, URL, and timestamp to the console

    next();
});

// Variable to hold the database connection
let db;

// Connecting to MongoDB using connection string from environment variables
MongoClient.connect(process.env.CONNECTION_STRING, (err, client) => {
    if (err) throw err; // Exit the program if there is a connection error
    db = client.db(process.env.DATABASE); // Store the database object
});

// Root endpoint - A response to test server connectivity
app.get("/", (req, res, next) => {
    console.log("Accessed root endpoint");
    res.send("Select a collection, e.g., /collection/messages");
});

// Middleware to handle routes that include a collection name as a parameter
app.param("collectionName", (req, res, next, collectionName) => {
    console.log(`Collection set to: ${collectionName}`);
    req.collection = db.collection(collectionName); // Attach the MongoDB collection to the request object
    return next(); // Proceed to the actual route handler
});

// GET request to retrieve all documents from a specified collection
app.get("/collection/:collectionName", (req, res, next) => {
    console.log(`Retrieving objects from collection: ${req.params.collectionName}`);
    req.collection.find({}).toArray((e, results) => {
        // Retrieve all documents from the collection
        if (e) return next(e); // Handle errors
        res.send(results); // Send the results as a JSON response
    });
});

// POST request to add a new document to a specified collection
app.post("/collection/:collectionName", (req, res, next) => {
    console.log(`Adding an object to collection: ${req.params.collectionName}`);
    req.collection.insert(req.body, (e, results) => {
        // Insert the provided data into the collection
        if (e) return next(e); // Handle errors
        console.log("Object added:", results.ops);
        res.send(results.ops); // Send the added document as a response
    });
});

// PUT request to update a document in a specified collection by its ID
app.put("/collection/:collectionName/:id", (req, res, next) => {
    console.log(
        `Updating object in collection: ${req.params.collectionName} with ID: ${req.params.id}`
    ); // Log the operation
    req.collection.update(
        { _id: new ObjectID(req.params.id) }, // Match the document by its MongoDB ObjectID
        { $set: req.body }, // Update the document with the provided data
        { safe: true, multi: false }, // Ensure safety and update only one document
        (e, result) => {
            if (e) return next(e); // Handle errors
            console.log(
                result.result.n === 1 ? "Object updated successfully" : "Object update failed"
            ); // Log success or failure
            res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" }); // Send response
        }
    );
});

// GET request to search for documents in a collection based on a query parameter
app.get("/search/:collectionName", (req, res, next) => {
    const searchQuery = req.query.query || ""; // Extract search query from request
    console.log(`Searching in collection: ${req.params.collectionName} with query: ${searchQuery}`);
    const searchRegex = new RegExp(searchQuery, "i"); // Create a case-insensitive regex for matching
    req.collection
        .find({
            $or: [
                // Search across multiple fields using logical OR
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex },
                { price: { $regex: searchRegex } },
                { availableInventory: { $regex: searchRegex } },
            ],
        })
        .toArray((e, results) => {
            // Convert the results to an array
            if (e) return next(e); // Handle errors
            console.log(`Search results: ${results.length} documents found`); // Log the number of matches
            res.send(results); // Send the results as a JSON response
        });
});

// Serving static files from a "static" directory
var imagePath = path.resolve(__dirname, "static"); // Get absolute path to the static directory
app.use("/static", express.static(imagePath)); // Serve static files from the path

// Start the server and listen on a specified port
const port = process.env.PORT || 3000; // Use the environment port or default to 3000
app.listen(port, () => {
    console.log("Express.js server running at localhost:" + port); // Log the server's start status
});
