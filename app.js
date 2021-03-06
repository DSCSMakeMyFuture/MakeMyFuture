/** Ohlone's ./MakeMyFuture Online Schedule Builder
 * 
 * Welcome to Ohlone's Server-Side Driver app!
 * This file sets up the server and has it running on port 3000, (requires the existence
 * of the public folder on your local repository), while handling any POST and GET
 * requests made to the server by routing them to their respecitive functions.
 * 
 * Make sure to have dependencies installed beforehand by using npm install.
 * 
 * Current dependencies:
 * express
 * dotenv
 * mongodb
 * crypto
 * 
 * @file app.js
 * @authors Pirjot Atwal,
 * @version 01/06/2022
 */

console.log("Welcome to ./MakeMyFuture! Setting up the server...");

// IMPORT MODULES
// Setup the server by importing express and building the app.
const express = require('express');
const app = express();

// SERVE FAVICON TO USER
const favicon = require('serve-favicon');
const path = require('path');
app.use(favicon(path.join(__dirname, 'public', 'favicon', 'favicon.ico')));

//Import Environment Variables into the process
require('dotenv').config();

//Import local modules
const routes = require('./routes.js');
const mongo = require('./mongodb-library.js');
const cookieParser = require('cookie-parser');

//MIDDLEWARE FUNCTIONS
//Parse the user's cookies
app.use(cookieParser());
//Serve the static files located in the public folder
app.use(express.static('public'));
//Parse incoming JSON body requests
app.use(express.json());
//Attempt connection to mongo
mongo.connectClient();


//SERVER SETUP AND ROUTES
//Begin listening for connections and print status to console
let listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Starting to listen at localhost:" + listener.address().port);
});

//Begin all app routes

//BEGIN ALL GET ROUTES

// Logout of the account
app.get('/logout', (req, res) => routes.logout(req, res));

// On every page load, verify if the user is signed in and if so, who they are signed is as.
app.get('/verify-session', (req, res) => routes.verify_session(req, res));

// Get all schedules that belong to the user (under the user id)
app.get('/get-user-schedules', (req, res) => routes.get_user_schedules(req, res));

// Get all Majors and Universities Information
app.get('/fetch-major-colleges', (req, res) => routes.fetch_major_colleges(req, res));

//BEGIN ALL POST ROUTES

// Sign up for an account
app.post('/sign-up', (req, res) => routes.sign_up(req, res));

// Login to an account
app.post('/login', (req, res) => routes.login(req, res));

// Post a schedule and save it to the database.
app.post('/post-schedule', (req, res) => routes.post_schedule(req, res));

// Query data from the catalog and return it
app.post('/query-data', (req, res) => routes.query_data(req, res));

// Create a new schedule for the user
app.post('/create-schedule', (req, res) => routes.create_schedule(req, res));

// Fetch the schedule matching the given name/data
app.post('/fetch-schedule', (req, res) => routes.fetch_schedule(req, res));

// Edit a user's schedule (add or remove a class one at a time)
app.post('/edit-schedule', (req, res) => routes.edit_schedule(req, res));

// Delete a schedule for the user
app.post('/delete-schedule', (req, res) => routes.delete_schedule(req, res));

// Fetch schedules in batch using a query
app.post('/fetch-schedules-batch', (req, res) => routes.fetch_schedules_batch(req, res));

// Fetch user profile using their username
app.post('/fetch-user-profile', (req, res) => routes.fetch_user_profile(req, res));

// Update the account's profile using a provided field and value.
app.post('/update-account', (req, res) => routes.update_account(req, res));

//On server/process closing, perform cleanup functions
process.on('SIGINT', () => {
    mongo.closeClient();
    console.log("\nClosing down ./MakeMyFuture server...");
    process.exit(0);
});