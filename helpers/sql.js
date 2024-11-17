const { BadRequestError } = require("../expressError");

/*
* Makes selective update queries
*
*
* @param {Object} dataToUpdate - Object containing fields to update and their new values.
* @param {Object} jsToSql - Optional mapping of JavaScript field names to SQL column names.
*                           Example: { firstName: "first_name" }
*
* @throws {BadRequestError} If dataToUpdate is empty.
*
* @returns {Object} Object containing:
*                     - setCols: A string with column names and parameter placeholders.
*                     - values: Array of values to be updated.
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
