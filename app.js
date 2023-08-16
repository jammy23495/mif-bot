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


//Train MIF Dataset
async function train() {
    const jsonArray = await csv().fromFile("./mif.csv");

    //Create Intents and Utterances from Greet
    for (let index = 0; index < jsonArray.length; index++) {
        let subject = jsonArray[index].Subject ? jsonArray[index].Subject : "";
        let question = jsonArray[index].Question ? jsonArray[index].Question : "";
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
                        let isBotFound = isBot(ans.jsonString.Answered_By)
                        let isCommented = isNULL(ans.jsonString.Answered_By)
                        ans.isBot = isBotFound
                        ans.isCommented = isCommented
                        console.log(ans)
                        finalAnswers.push(ans)
                    }
                }
            } else {
                finalAnswers.push({
                    "answer_summary": "I am sorry, I don't know about this. Please connect with our Subject Matter expert.",
                    "isBot": true,
                    "jsonString": {
                        "ID": "null",
                        "Answered_By": "Bot"
                    }
                })
            }
        } else {
            finalAnswers.push({
                "answer_summary": "I am sorry, I don't know about this. Please connect with our Subject Matter expert.",
                "isBot": true,
                "jsonString": {
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
        console.log("I am sorry, I don't know about this")
        finalAnswers.push({
            "answer_summary": "I am sorry, I don't know about this. Please connect with our Subject Matter expert.",
            "isBot": true,
            "jsonString": {
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
    let jsonString = JSON.parse(slicedString.split("???").pop())
    let answer_summary = ""
    try {
        let Summarizer = new SummarizerManager(answer, 5);
        answer_summary = Summarizer.getSummaryByFrequency().summary;
    } catch (error) {
        console.log(error)
        answer_summary = answer;
    }

    return {
        answer_summary: answer_summary,
        jsonString: jsonString
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