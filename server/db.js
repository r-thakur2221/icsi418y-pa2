const mongoose = require('mongoose');
const dbconfigs = require("./configs/db.config");

const connectionURL = dbconfigs.dbConnectionURL;

mongoose.connect(connectionURL)
    .then(() => {
        console.log("Successfully connected to database");
    })
    .catch(err => {
        console.log("Error in db connection", err);
    });