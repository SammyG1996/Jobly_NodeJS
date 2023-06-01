"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
// const {Pool} = require("pg");
const { getDatabaseUri } = require("./config");

let db;

const createConnection = () => {
  if (process.env.NODE_ENV === "production") {
    console.log('production')
    db = new Client({
      connectionString: getDatabaseUri(),
      ssl: {
        rejectUnauthorized: false
      }, 
      idle_in_transaction_session_timeout : 60000
    });
  } else {
    db = new Client({
      connectionString: getDatabaseUri()
    });
  }
  db.connect();
}


// Initail Connection
createConnection();

// CHECKS IS CONNECTION TO DB IS ACTIVE
setInterval(()=>{
  try {
    db.query('SELECT NOW();')
    console.log('CHECKING CONNECTION')
  } catch (error) {
    console.log(error)
  }
}, 270000)


module.exports = db;