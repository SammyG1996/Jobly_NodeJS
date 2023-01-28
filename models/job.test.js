"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
  } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
		title: "test",
		salary: 126000,
		equity: null,
		company_handle: "c1"
    };
  
    test("test if create job works", async function () {
      let job = await Job.create(newJob);
      expect(job).toEqual({
        "companyHandle" : `${newJob.company_handle}`, 
        "equity" : newJob.equity, 
        "id" : expect.any(Number), 
        "salary" : newJob.salary, 
        "title" : `${newJob.title}`
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = ${job.id}`);

      expect(result.rows[0]).toEqual(
        {
          "company_handle" : `${newJob.company_handle}`, 
          "equity" : newJob.equity, 
          "id" : expect.any(Number), 
          "salary" : newJob.salary, 
          "title" : `${newJob.title}`
        },
      );
    });
  
    test("bad request with dupe", async function () {
      try {
        await Job.create(newJob);
        await Job.create(newJob);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
    
  });
  

  /************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let job = await Job.findAll();
    expect(job).toEqual([
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
    ]);
  });
});


/*************************** createFilterSql */

describe("createFilterSql", () => {

  test("works (this also makes sure it works even when hasEquity is undefined)", async () => {
    const title = "test";
    const minSalary = 100000;
    const hasEquity = undefined;
    const res = await Job.createFilterSql(title, minSalary, hasEquity);

    /**This ensures that undefined from maxEmployees is not included in the returned sanitized objects */
    expect(res.sanatizedStatments).toEqual(["test%", "100000"]);
    /** This ensures that the SQL statment is formulated without the maxEmployees which is undefined */
    expect(res.sqlStatments).toEqual("WHERE title ILIKE $1 AND salary > $2");
  })

})


/************************************** update */

describe("update", function () {
  const updateData = 		{
    "title": "TESTTEST"
  };

  test("works", async function () {

    const jobSqlReq = await db.query(`
    SELECT * FROM jobs;
    `)

    const {id} = jobSqlReq.rows[0]

    let job = await Job.update(id, updateData);
    expect(job.title).toEqual(updateData.title);

    const result = await db.query(`
    SELECT title FROM jobs WHERE id = ${id}
    `)

    expect(result.rows[0].title).toEqual(updateData.title)

  });


  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {

      const jobSqlReq = await db.query(`
      SELECT * FROM jobs;
      `)
  
      const {id} = jobSqlReq.rows[0]

      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobSqlReq = await db.query(`
    SELECT * FROM jobs;
    `)

    const {id} = jobSqlReq.rows[0]

    await Job.remove(id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id = ${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});