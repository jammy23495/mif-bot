const {
    NlpManager
} = require('node-nlp');
const moment = require('moment');
const csv = require('csvtojson')
const prompt = require('prompt-sync')({
    sigint: true
});
let SummarizerManager = require("node-summarizer").SummarizerManager;
const express = require('express')
const app = express()
const port = 3000
app.use(express.static('ui'))

const fallBackAnswers = ["I am sorry, I don't understand this. Please ask me something related to forum.",
    "I am sorry, I don't understand this. Maybe the experts can help you. Please check with designated Subject Matter Expert."
]


//Initializing the NLPManager
const manager = new NlpManager({
    languages: ['en'],
    forceNER: true,
    nlu: {
        useNoneFeature: false
    },
    threshold: 0.1
});

let language = "en"

function getRandomFallbackAnswers() {
    let randomNumber = Math.floor(Math.random() * fallBackAnswers.length);
    return fallBackAnswers[randomNumber]
}


//Train MIF Dataset
async function train() {
    const jsonArray = await csv().fromFile("./mif.csv");

    //Create Intents and Utterances from Greet
    for (let index = 0; index < jsonArray.length; index++) {
        let subject = jsonArray[index].Subject ? jsonArray[index].Subject : "";
        let question = jsonArray[index].Question ? jsonArray[index].Question.replaceAll("\"", "\'") : "";
        let ROW_ID = jsonArray[index].Row_Number;
        let ID = jsonArray[index].Post_ID;
        let answer = jsonArray[index].Comment;
        let likes = jsonArray[index].LikeCount ? jsonArray[index].LikeCount : 0;
        let comments = jsonArray[index].CommentCount ? jsonArray[index].CommentCount : 0;
        let post_url = jsonArray[index].Post_URL ? jsonArray[index].Post_URL : "https://www.google.com";
        let post_date = jsonArray[index].Comment_On;
        let post_date_string = moment(post_date, "YYYY-MM-DD").format('MMMM Do YYYY');
        let answered_by = jsonArray[index].Comment_By;

        let newanswer = answer + `???{"ID":"${ID}","Answered_By":"${answered_by}","likes":${likes},"comments":${comments},"post_url":"${post_url}","post_date":"${post_date_string}","subject":"${subject}","question":"${question}","answer":"${answer}"}`

        let intent = ROW_ID + "_intent_" + subject.replaceAll(" ", "_")

        manager.addDocument(language, subject, intent);
        manager.addDocument(language, answered_by, intent);
        manager.addDocument(language, post_date, intent);
        manager.addDocument(language, post_date_string, intent);
        manager.addAnswer(language, intent, newanswer);
    }

    // Train and save the model.
    await manager.train();
    manager.save();
}

//QNA
async function qna(question) {
    //Generating Response
    const response = await manager.process('en', question);
    let finalAnswers = []
    if (response.answer) {
        if (response.classifications.length > 0) {
            let classifications = response.classifications;
            let validClassifications = classifications.filter((e) => {
                return e.score >= 0.1
            })
            console.log("Valid Classification: " + JSON.stringify(validClassifications))
            if (validClassifications.length > 0) {
                let allAnswers = []
                for (let i = 0; i < validClassifications.length; i++) {
                    let newUtterance = await manager.findAllAnswers("en", validClassifications[i].intent)
                    allAnswers.push(newUtterance[0]);
                }
                if (allAnswers.length > 0) {
                    console.log(`${allAnswers.length} valid answer(s)\n`)
                    for (let i = 0; i < allAnswers.length; i++) {
                        let ans = await generateAnswer(allAnswers[i].answer)
                        let isGreet = isBot(ans.props.Answered_By)
                        let isCommented = isNULL(ans.props.Answered_By)
                        ans.isGreet = isGreet
                        ans.isCommented = isCommented
                        console.log(ans)
                        finalAnswers.push(ans)
                    }
                }
            } else {
                finalAnswers.push({
                    "answer_summary": getRandomFallbackAnswers(),
                    "isGreet": true,
                    "props": {
                        "ID": "null",
                        "Answered_By": "Bot"
                    }
                })
            }
        } else {
            finalAnswers.push({
                "answer_summary": getRandomFallbackAnswers(),
                "isGreet": true,
                "props": {
                    "ID": "null",
                    "Answered_By": "Bot"
                }
            })
        }
        return {
            "data": finalAnswers,
            "response": response
        };
    } else {
        console.log(getRandomFallbackAnswers())
        finalAnswers.push({
            "answer_summary": getRandomFallbackAnswers(),
            "isGreet": true,
            "props": {
                "ID": "null",
                "Answered_By": "Bot"
            }
        })
        return {
            "data": finalAnswers,
            "response": response
        };
    }
}

async function generateAnswer(answer) {
    console.log(answer)
    let position = answer.lastIndexOf("???")
    let slicedString = answer.slice(position)
    answer = answer.slice(0, position)
    answer = isNULL(answer) ? "No comments found on this post/query!" : answer
    let answersCount = answer.split(/[.?!]/g).filter(Boolean).length;

    let props = JSON.parse(slicedString.split("???").pop())
    let answer_summary = ""

    if (answersCount < 5) {
        answer_summary = answer
    } else {
        let Summarizer = new SummarizerManager(answer, 5);
        answer_summary = Summarizer.getSummaryByFrequency().summary;
    }

    return {
        answer_summary: answer_summary,
        props: props
    }

}

function isNULL(property) {
    if (property === "NULL") return true
    else return false
}

function isBot(property) {
    if (property === "Bot") return true
    else return false
}

app.get('/', async (req, res) => {
    res.sendFile(ui / index.html)
})

app.get('/ask/:question', async (req, res) => {
    let response = await qna(req.params.question);
    res.send(response)
})


app.listen(port, async () => {
    await train();
    console.log(`Example app listening on port ${port}`)
})