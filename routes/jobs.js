"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login and Admin
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);

      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });


/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {
    try {
    
        const {title, minSalary, hasEquity} = req.query;
        
        const jobs = await Job.findAll(title, minSalary, hasEquity);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
  });



 /** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { title, salary, equity }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      /** Check to see what params I need to pass in to do the patch */
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });


  /** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 * 
 * If deletion is successful it will be returned to the user 
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });


module.exports = router