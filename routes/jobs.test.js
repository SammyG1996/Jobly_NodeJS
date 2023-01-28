"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll, /* This will delete all users from the DB and then create new ones */
  commonBeforeEach, /* This will run BEGIN, an SQL keyword used to indicate the beginning of a sequence of SQL commands that must be interpreted by the current data source of the process */
  commonAfterEach, /* This will run the ROLLBACK statement which lets a user undo all the alterations and changes that occurred on the current transaction after the last COMMIT. */
  commonAfterAll,/* This will end the connection to the database */
  u1Token
} = require("./_testCommon");
const { response } = require("../app");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
		title: "test",
		salary: 126000,
		equity: null,
		company_handle: "c1"
    };


    test("test adding job works", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: "test",
		    salary: 126000,
		    equity: null,
		    company_handle: "c1"
          })
          .set("authorization", `Bearer ${u1Token}`);
    
      expect(resp.statusCode).toEqual(201);
    });


  
    test("bad request with missing data (missing title)", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
		    salary: 126000,
		    equity: null,
		    company_handle: "c1"
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({title: "test",
          salary: 126000,
          equity: null,
          company_handle: 0
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });

  });
  


/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("getting all jobs", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
              {
                id : expect.any(Number),
                title: "test1",
                salary: 126000,
                equity: null,
                companyHandle: "c1"
              },
              {
                id : expect.any(Number),
                title: "test2",
                salary: 100000,
                equity: "1",
                companyHandle: "c2"
              },
              {
                id : expect.any(Number),
                title: "test3",
                salary: 50000,
                equity: null,
                companyHandle: "c3"
              },
            ],
      });
    });
  
    /** This should only bring back 1 entry */
    test("test filter (also checks if case insensitive)", async function () {
      const resp = await request(app).get("/jobs?title=Test");
      expect(resp.body).toEqual({
        jobs:
        [
          {
            id : expect.any(Number),
            title: "test1",
            salary: 126000,
            equity: null,
            companyHandle: "c1"
          },
          {
            id : expect.any(Number),
            title: "test2",
            salary: 100000,
            equity: "1",
            companyHandle: "c2"
          },
          {
            id : expect.any(Number),
            title: "test3",
            salary: 50000,
            equity: null,
            companyHandle: "c3"
          },
        ],
      });
    });
  
  
    test("fails: test next() handler", async function () {
      // there's no normal failure event which will cause this route to fail ---
      // thus making it hard to test that the error-handler works with it. This
      // should cause an error, all right :)
      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .get("/jobs")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });

  });
  

  /************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {

    test("tests updating a job", async function () {
      const jobsReq = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);

      const job = jobsReq.body.jobs[0]

      job.title = "TESTTEST"

      const resp = await request(app)
          .patch(`/jobs/${job.id}`)
          .send({
            title: "TESTTEST",
          })
          .set("authorization", `Bearer ${u1Token}`);

      expect(resp.body).toEqual({job});
    });
  
    test("test unauth to update", async function () {
        const jobsReq = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
  
        const job = jobsReq.body.jobs[0]
    
        const resp = await request(app)
            .patch(`/jobs/${job.id}`)
            .send({
                title: "TESTTEST",
            });
        expect(resp.statusCode).toEqual(401);
    });
  
    test("not found job exists", async function () {
      const resp = await request(app)
          .patch(`/jobs/nope`)
          .send({
            title: "nope",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });

  });

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works to delete", async function () {
        const jobsReq = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
        const job = jobsReq.body.jobs[0]

        const resp = await request(app)
            .delete(`/jobs/${job.id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: `${job.id}` });
    });

  });
  