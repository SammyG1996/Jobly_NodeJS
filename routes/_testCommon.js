"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job")
const { createToken } = require("../helpers/tokens");

/* This will delete all users from the DB and then create new ones */
async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users"); /* This deletes everything in the "users" table */
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies"); /* This deletes everything in the "companies" table */
 
  await db.query("DELETE FROM jobs")
  /* Then 3 companies and 3 users are created to insert into thier respective tables */
  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: true,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  await Job.create({
    title: "test1",
    salary: 126000,
    equity: null,
    company_handle: "c1"
});
  await Job.create({
    title: "test2",
    salary: 100000,
    equity: 1,
    company_handle: "c2"
  });
  await Job.create({
    title: "test3",
    salary: 50000,
    equity: null,
    company_handle: "c3"
  });
}
/* Begin SQL is a keyword used in the Method editor to indicate the beginning of a sequence of SQL commands that must be interpreted by the current data source of the process */
async function commonBeforeEach() {
  await db.query("BEGIN");
}

/* The ROLLBACK statement lets a user undo all the alterations and changes that occurred on the current transaction after the last COMMIT. */
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

/* This will end the connection to the database */
async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
};
