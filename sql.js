const sql = require('mssql')
require('dotenv').config()
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}

async function getMIFData() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query`select * from MIFBOT`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getListOfExperts() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query`exec GetExpertList`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getListOfCategories() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query`select Name from Categories`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    getMIFData,
    getListOfExperts,
    getListOfCategories
}