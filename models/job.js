"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */


  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE company_handle = $1 AND title = $2`,
        [company_handle, title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${company_handle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, company_handle],
    );
    const job = result.rows[0];

    return job;
  }

   /** Find all jobs.
   *
   * Returns { title, salary, equity, company_handle }
   * 
   * Can filter on provided search filters:
   * - title
   * - minSalary
   * - hasEquity
   * 
   * You can pass in those filters when the function is called. Only the values that are defined will be included
   * 
   * */

    static async findAll(title, minSalary, hasEquity) {
      
        const {sqlStatments, sanatizedStatments} = await this.createFilterSql(title, minSalary, hasEquity);
        const jobsRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle AS "companyHandle"
               FROM jobs
               ${sqlStatments ? sqlStatments : ''}
               ORDER BY company_handle`, sanatizedStatments ? sanatizedStatments : '');
        return jobsRes.rows;
      }


  /* This function will take the query params and parse them to create an SQL statment
  
  Therefore : 

  'ba', 20000, 50000 -> "WHERE name ILIKE $1 AND salary > $2 AND equity > 0"

  Sanitization is used also, so every time a SQL statment is made, there is a subsequent array that holds all the items to be sanitized.
  The function will return either an object with both the created SQL statment and sanitized arguments, or it will return false

  */
  static async createFilterSql(title, minSalary, hasEquity){
    const sqlStatments = [];
    const sanatizedStatments = [];
    /* If these statements exist then it will be added to the array of sql statments and the sanitized arg will also be added to an array*/
    title ? sqlStatments.push(`title ILIKE $${sqlStatments.length + 1}`) && sanatizedStatments.push(`${title}%`) : null;
    minSalary ? sqlStatments.push(`salary > $${sqlStatments.length + 1}`) && sanatizedStatments.push(`${minSalary}`) : null;
    hasEquity ? sqlStatments.push(`equity > 0`) : null;

    /* This will send an obj with the sql ready or false */
    if(sqlStatments.length > 0){
      return {
        sqlStatments: `WHERE ${sqlStatments.join(' AND ')}`, 
        sanatizedStatments
      }
    } else {
      return false
    }

  }


   /** Update company job with `job`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {title, salary, equity}
   *
   * Throws NotFoundError if not found.
   * 
   * This function works by creating the udpated query and then submitting it
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity"
        });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;


    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

   /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   * 
   * If its succesfully deleted nothing is returned because the route will take care of that
   * 
   **/

    static async remove(id) {
        console.log(id)
        const result = await db.query(
              `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No company: ${id}`);
      }

}

module.exports = Job