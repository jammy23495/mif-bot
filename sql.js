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

async function getFAQs() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from FAQ order by ID desc`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function addFAQs(question, answer) {
    try {
        await sql.connect(sqlConfig)
        const getLastFAQ = await sql.query `SELECT Top 1 ID FROM FAQ order by ID desc`
        let result = getLastFAQ.recordsets[0]
        let ID = result[0].ID
        if (ID) {
            ID = parseInt(ID) + 1
            let pool = await sql.connect(sqlConfig);
            let results = await pool.request()
                .input('ID', sql.VarChar(10), ID.toString())
                .input('Question', sql.VarChar(sql.MAX), question)
                .input('Answer', sql.VarChar(sql.MAX), answer)
                .execute('SP_InsertFAQ')

            if (results && results.returnValue && results.returnValue == 1) {
                return {
                    "status": 200
                }
            } else {
                return {
                    "status": 400
                }
            }
        }
        // return result.recordsets[0]
    } catch (error) {
        console.log(error)
        return {
            "error": error,
            "status": 400
        }
    }
}

async function addUtterances(utterance, language, intent) {
    try {
        await sql.connect(sqlConfig)
        const getLastFAQ = await sql.query `SELECT Top 1 ID FROM Utterances order by ID desc`
        let result = getLastFAQ.recordsets[0]
        let ID = result[0].ID
        if (ID) {
            ID = parseInt(ID) + 1
            let pool = await sql.connect(sqlConfig);
            let results = await pool.request()
                .input('ID', sql.Int, ID)
                .input('Utterance', sql.VarChar(sql.MAX), utterance)
                .input('Intent', sql.VarChar(100), intent)
                .input('Language', sql.VarChar(20), language || "en")
                .execute('SP_InsertUtterance')

            if (results && results.returnValue && results.returnValue == 1) {
                return {
                    "status": 200
                }
            } else {
                return {
                    "status": 400
                }
            }
        }
        // return result.recordsets[0]
    } catch (error) {
        console.log(error)
        return {
            "error": error,
            "status": 400
        }
    }
}

async function getUtterances() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from Utterances`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getDistinctIntents() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select distinct Intent from Utterances`
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
        const result = await sql.query `SELECT top 1 WKID, COUNT(*) AS Count         
        FROM MIFApp4.dbo.WeeklyQuizsAns
		where WKID in (select MAX(ID) from MIFApp4.dbo.WeeklyQuiz  )
        GROUP BY WKID
        order by wkid desc`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getListOfCategories() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from Categories`
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
        const result = await sql.query `SELECT TOP (1) * FROM Announcements order by Created desc`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getDistinctMIFBotData() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select distinct POST_ID, FeedType, IsActive, 
        Feed_COM_LIKE, IsExpertLiked, IsAPSOsLiked, 
        IsCOMCommented, IsExpertCommented, IsAPSOsCommented,
        IsFeedByCOM, IsFeedByExpert, IsFeedByAPSOs,
        Category from MIFBOT`
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

async function getBookMarks() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `select * from BookMarks`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getMostActiveMember() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec MostActiveMember`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getPieChartData() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec GetPieChartData`
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getTrending() {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query `exec Treding`
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
    getTechBytesHistory,
    getBookMarks,
    getMostActiveMember,
    getPieChartData,
    getTrending,
    getFAQs,
    getUtterances,
    addFAQs,
    getDistinctIntents,
    addUtterances
}