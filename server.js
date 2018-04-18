"use strict";

const express = require("express");
const { URL } = require("url");
const redis = require("redis");
const util = require('util')
const assert = require('assert');

const app = express();

const bodyParser = require("body-parser");
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
let port = process.env.PORT || 8080;

let connectionString = process.env.REDIS_CONNECTION_STRING || "";
let client = null;

if (connectionString.startsWith("rediss://")) {
    client = redis.createClient(connectionString);
} else {
    client = redis.createClient();
}

client.on("error", function(err) {
    console.log("Error " + err);
});

// Add a word to the database
function addWord(word, definition) {
    return new Promise(function(resolve, reject) {
        // use the connection to add the word and definition entered by the user
        client.hset("words", word, definition, function(
            error,
            result
        ) {
            if (error) {
                reject(error);
            } else {
                resolve("success");
            }
        });
    });
}

// Get words from the database
function getWords() {
    return new Promise(function(resolve, reject) {
        // use the connection to return us all the documents in the words hash.
        client.hgetall("words", function(err, resp) {
            if (err) {
                reject(err);
            } else {
                resolve(resp);
            }
        });
    });
}

// We can now set up our web server. First up we set it to server static pages
app.use(express.static(__dirname + "/public"));

// The user has clicked submit to add a word and definition to the hash
// Send the data to the addWord function and send a response if successful
app.put("/words", function(request, response) {
    addWord(request.body.word, request.body.definition)
        .then(function(resp) {
            response.send(resp);
        })
        .catch(function(err) {
            console.log(err);
            response.status(500).send(err);
        });
});

// Read from the hash when the page is loaded or after a word is successfully added
// Use the getWords function to get a list of words and definitions from the hash
app.get("/words", function(request, response) {
    getWords()
        .then(function(words) {
            response.send(words);
        })
        .catch(function(err) {
            console.log(err);
            response.status(500).send(err);
        });
});

// Listen for a connection.
app.listen(port, function() {
    console.log("Server is listening on port " + port);
});

