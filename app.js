const { dockStart } = require('@nlpjs/basic');
let { train } = require("./train")
let { qna } = require("./qna")
let { getMIFData } = require("./sql")
const csv = require('csvtojson');
let { loadActions } = require("./actions")
let { SummarizationPipeline } = require("./summarizer")
let summarizer;
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
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
            },
            ner: {
                threshold: 1
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
        let response = await qna(req.params.question, manager, summarizer);
        res.send(response)
    } catch (error) {
        console.log(error)
        res.send({
            "data": [{
                "answer_summary": "I am still learning! I don't understand this. Please ask something related to forum.",
                "isGreet": true
            }],
            "response": error
        })
    }
})

app.get('/train', async (req, res) => {
    try {
        let response = await train(manager);
        res.send(response)
    } catch (error) {
        console.log(error)
        res.send({
            "status": "400",
            "message": "Error in training model " + error
        })
    }
})

app.listen(port, async () => {
    summarizer = await SummarizationPipeline.getInstance()
    console.log(`MIF Bot listening on port ${port}`)
})