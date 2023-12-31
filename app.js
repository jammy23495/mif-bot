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
    getMIFData,
    getFAQs,
    addFAQs,
    getUtterances,
    getDistinctIntents,
    getListOfCategories,
    addUtterances
} = require("./sql")
let {
    loadActions
} = require("./actions")
let {
    SummarizationPipeline
} = require("./summarizer")
let summarizer;
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
app.use(express.static('ui'))
var cors = require('cors')
var bodyParser = require('body-parser');
const {
    getRandomFallbackAnswers
} = require('./utils');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json())
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

    //Load Actions & Entities
    await loadActions(manager)

})();

app.get('/', async (req, res) => {
    res.sendFile(ui / index.html)
})

app.get('/faqs', async (req, res) => {
    res.sendFile(__dirname + "/ui/faq.html")
})

app.get('/faqs/get', async (req, res) => {
    res.send(await getFAQs())
})

app.post('/faqs/add', async (req, res) => {
    res.send(await addFAQs(req.body.question, req.body.answer))
})

app.get('/utterances', async (req, res) => {
    res.sendFile(__dirname + "/ui/utterances.html")
})

app.get('/utterances/get', async (req, res) => {
    res.send(await getUtterances())
})

app.get('/intents/get', async (req, res) => {
    res.send(await getDistinctIntents())
})

app.post('/utterances/add', async (req, res) => {
    res.send(await addUtterances(req.body.utterance, req.body.language, req.body.intent))
})

app.get('/categories/get', async (req, res) => {
    res.send(await getListOfCategories())
})

app.post('/ask', async (req, res) => {
    try {
        let question = req && req.body && req.body.question ? req.body.question : "hi";
        let response = await qna(question, manager, summarizer);
        if (response && response.response && response.response.intent && response.response.intent == "None") {
            response = await qna(`Any post on ${question}`, manager, summarizer)
            if (response && response && response.response && response.response.intent && response.response.intent.includes("action")) {
                response = await qna(`Any query on ${question}`, manager, summarizer)
            }
        }
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
    // summarizer = await SummarizationPipeline.getInstance()
    console.log(`MIF Bot listening on port ${port}`)
})