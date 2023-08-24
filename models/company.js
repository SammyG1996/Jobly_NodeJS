"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {createToken} = require('../helpers/tokens')

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * If there are no sqlStatments to filter then they will just be ignored
   * */

  static async findAll(name, minEmployees, maxEmployees) {
    const {sqlStatments, sanatizedStatments} = await this.createFilterSql(name, minEmployees, maxEmployees);
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${sqlStatments ? sqlStatments : ''}
           ORDER BY name`, sanatizedStatments ? sanatizedStatments : '');
    return companiesRes.rows;
  }

  /* This function will take the query params and parse them to create an SQL statment
  
  Therefore : 

  'ba', 200, 500 -> "WHERE name ILIKE $1 AND num_employees > $2 AND num_employees < $3"

  Sanitization is used also, so every time a SQL statment is made, there is a subsequent array that holds all the items to be sanitized.
  The function will return either an object with both the created SQL statment and sanitized arguments, or it will return false

  */
  static async createFilterSql(name, minEmployees, maxEmployees){
    const sqlStatments = [];
    const sanatizedStatments = [];
    /* If these statements exist then it will be added to the array of sql statments and the sanitized arg will also be added to an array*/
    name ? sqlStatments.push(`name ILIKE $${sqlStatments.length + 1}`) && sanatizedStatments.push(`${name}%`) : null;
    minEmployees ? sqlStatments.push(`num_employees > $${sqlStatments.length + 1}`) && sanatizedStatments.push(`${minEmployees}`) : null;
    maxEmployees ? sqlStatments.push(`num_employees < $${sqlStatments.length + 1}`) && sanatizedStatments.push(`${maxEmployees}`) : null;

    /* If maxEmployees is greater than mixEmployees than an error will be thrown */
    if(maxEmployees < minEmployees){
       throw new BadRequestError('minEmployees connot be greater than maxEmployees')
    }

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

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
      const companyRes = await db.query(
          `
          SELECT to_json(res)from(
            SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  to_json(j) "jobs"
                  FROM companies c
                  INNER JOIN jobs j
                  ON c.handle = j.company_handle
                  WHERE c.handle = $1
          ) res;`,[handle]);

      const company = companyRes.rows[0];

      if (!company) throw new NotFoundError(`No company: ${handle}`);

      return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
