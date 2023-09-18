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
        const result = await sql.query `select * from MIFBOT`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getListOfExperts() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec GetExpertList`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getListOfAPSOS() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec GetAPSOsList`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getWeeklyQuizAnswers() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec GetCorrectAnsMemberList`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getListOfCategories() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select Name from Categories`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getInformationBasket() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from InformationBaskets`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getNodalDTE() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select Id,Name from NodalDte`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getTechBytes() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from TechBytes`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getTechBytesHistory() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from TechByteshistory`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getAnnouncements() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from Announcements`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getDistinctMIFBotData() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select distinct POST_ID, FeedType, IsActive, Feed_COM_LIKE, IsExpertLiked,IsAPSOsLiked from MIFBOT`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}


async function getAPSOsPosts() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec GetAPSOsFeedCount`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}


async function getAttachmentsInIS() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from InformationBaskets I inner join Members m on  I.CreatedBy = m.Id`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}



module.exports = {
    getMIFData,
    getListOfExperts,
    getListOfCategories,
    getListOfAPSOS,
    getWeeklyQuizAnswers,
    getInformationBasket,
    getNodalDTE,
    getTechBytes,
    getAnnouncements,
    getDistinctMIFBotData,
    getAPSOsPosts,
    getAttachmentsInIS,
    getTechBytesHistory
}