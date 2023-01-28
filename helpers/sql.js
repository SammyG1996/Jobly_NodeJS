const { BadRequestError } = require("../expressError");

/* This function will get passed in the information two values:

  dataToUpdate -> This will contain the user information that was submitted via the PATCH request
  jsToSql -> This contains a framework of the data to update. It will contain the fields that could be updated along with thier tabLe column's name.  

First we extract the keys of the data that came from the user. For example:

  {
    "username" : "example", 
    "firstName" : "John"
  }

  will become ["username", "firstName"]

Then If key.length is 0 than you know there was nothing to update and an error is thrown. 

A new variable is then going to be formed by mapping over all the "keys" that came from the users input data. 
For every key, your going to create an SQL update statment using sanatization. 
First you check "does jsToSql[colName AKA key] exist?". If it does than you use that as your table column name. If that does not exist when you search for it, then you will use that current key that's being mapped over (this is set to the colName value). 
Then you will set the sanatization by using the index and addind 1 to it. This is because index numbers start at 0 but sanatization starts at $1. 

Once you have mapped through all the keys you should have a new array filled with SQL update syntax. 
You then are going to return the following back to the update function in the User's model: 

  setCols -> this will contain all the SQL commands that are in the "cols" array and combine them all into one string, joined together by ", " to make one cohesive SQL update statement
  values -> will contain an array of all the values that are found in the information sent by the user. This is done because each place in this array will corispond to the number found in the sanitized SQL statment. Therefore this array will contain the information to be placed in the sanitizaition portion of the SQL updated statement.
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
