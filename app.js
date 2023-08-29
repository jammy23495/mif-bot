const {
    dockStart
} = require('@nlpjs/basic');

let {
    train
} = require("./train")

let {
    qna
} = require("./qna")

let {
    getMIFData
} = require("./sql")
const csv = require('csvtojson');
let {
    loadActions
} = require("./actions")

const express = require('express')
const app = express()
const port = 3000
app.use(express.static('ui'))
var cors = require('cors')
app.use(cors({
    origin: '*'
}))
let manager;

(async () => {
    const dock = await dockStart({
        settings: {
            nlp: {
                forceNER: true,
                languages: ['en'],
                executeActionsBeforeAnswers: true
            }
        },
        use: ['Basic', 'LangEn'],
    });

    manager = dock.get('nlp');
    let jsonArray = await csv().fromFile("./mif.csv");
    let sqlData = await getMIFData();
    jsonArray = [...jsonArray, ...sqlData]
    let classifications = []
    //Load Actions & Entities
    await loadActions(manager, jsonArray, classifications)

})();

app.get('/', async (req, res) => {
    res.sendFile(ui / index.html)
})

app.get('/ask/:question', async (req, res) => {
    try {
        let response = await qna(req.params.question, manager);
        res.send(response)
    } catch (error) {
        console.log(error)
        res.send({
            "data": [
                {
                    "answer_summary": "I am still learning! I don't understand this. Please ask something related to forum.",
                    "isGreet": true
                }
            ],
            "response": error
        })
    }
})

app.get('/train', async (req, res) => {
    let response = await train(manager);
    res.send(response)
})

app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
})