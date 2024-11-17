"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

class Job {
    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   **/

    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs (title,
                               salary,
                               equity,
                               company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
          [
            data.title,
            data.salary,
            data.equity,
            data.companyHandle,
          ]);
      let job = result.rows[0];
  
      return job;
    }

      /** Find all jobs (optional filter on searchFilters).
     *
     * searchFilters (all optional):
     * - minSalary
     * - hasEquity (true returns only jobs with equity > 0, other values ignored)
     * - title (will find case-insensitive, partial matches)
     *
     * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
     * */

    static async findAll(filters = {}) {
          let query = `SELECT j.id,
                              j.title,
                              j.salary,
                              j.equity,
                              j.company_handle AS "companyHandle",
                              c.name AS "companyName"
                      FROM jobs j 
                        LEFT JOIN companies AS c ON c.handle = j.company_handle`;

          const queries = [];
          const wheres = [];

          if (filters.title) {
            queries.push(`%${filters.title}%`);
            wheres.push(`title ILIKE $${queries.length}`);
          }

          if (filters.minSalary) {
            queries.push(filters.minSalary);
            wheres.push(`salary >= $${queries.length}`);
          }

          if (filters.hasEquity) {
            wheres.push(`equity > 0`);
          }

          if (wheres.length > 0) {
            query += " WHERE " + wheres.join(" AND ");
          }

          query += " ORDER BY title";
          const jobsResponse = await db.query(query, queries);
          return jobsResponse.rows;
    }

    /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
      const jobsResponse = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
         FROM jobs
         WHERE id = $1`, [id]);

      const job = jobsResponse.rows[0];

      if (!job) throw new NotFoundError(`No job: ${id}`);

      const companiesResponse = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         WHERE handle = $1`, [job.companyHandle]);

      delete job.companyHandle;
      job.company = companiesResponse.rows[0];

      return job;
    }

    static async update(id, data) {
      const { setCols, values } = sqlForPartialUpdate(
          data,
          {});
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
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
      const job = result.rows[0];

      if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
