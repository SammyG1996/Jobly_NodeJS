const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql")

const testDataToUpdate = { 
	"firstName" : "Sammy", 
}

const testJsToSql = {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin",
}


describe('sqlForPartialUpdate', () => {

    test('returns an array that contains the data for sanatization', () => {
        const results = sqlForPartialUpdate(testDataToUpdate, testJsToSql);
        expect(results.values).toContain(testDataToUpdate.firstName);
    })

    test('return SQL to insert firstName', () => {
        const results = sqlForPartialUpdate(testDataToUpdate, testJsToSql);
        expect(results.setCols).toContain("first_name")
    })

})