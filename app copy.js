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

//train
async function train() {
    const jsonArray = await csv().fromFile("./intents.csv");
    let language = "en"

    //Create Intents and Utterances from CSV
    for (let index = 0; index < jsonArray.length; index++) {
        let question = jsonArray[index].Question;
        let ID = jsonArray[index].Post_ID;
        let answer = jsonArray[index].Answer;
        let likes = jsonArray[index].Likes ? jsonArray[index].Likes : null;
        let comments = jsonArray[index].Comments ? jsonArray[index].Comments : null;
        let post_url = jsonArray[index].Post_URL ? jsonArray[index].Post_URL : null;
        let post_date = jsonArray[index].Post_Date ? jsonArray[index].Post_Date : null;
        let post_date_string = moment(post_date, "DD-MM-YYYY").format('MMMM Do YYYY');
        let answered_by = jsonArray[index].Answered_By ? jsonArray[index].Answered_By : "Bot";

        let newanswer = answer + `???{"ID":${ID},"Answered_By":"${answered_by}","likes":${likes},"comments":${comments},"post_url":"${post_url}","post_date":"${post_date_string}"}`
        let intent = ID + "_intent_" + question.replaceAll(" ", "_")
        manager.addDocument(language, question, intent);
        // manager.addDocument(language, answer, intent);
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
                return e.score >= 0.3
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
                        // console.log(`Answer ${i+1}: ` + allAnswers[i].answer)
                        let ans = await generateAnswer(allAnswers[i].answer)
                        let isBot = ans.jsonString.Answered_By !== "Bot" ? false : true;
                        ans.isBot = isBot
                        console.log(isBot)
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
    let position = answer.lastIndexOf("???")
    let slicedString = answer.slice(position)
    answer = answer.slice(0, position)
    let jsonString = JSON.parse(slicedString.split("???").pop())
    let Summarizer = new SummarizerManager(answer, 5);
    let answer_summary = Summarizer.getSummaryByFrequency().summary;
    return {
        answer_summary: answer_summary,
        jsonString: jsonString
    }
}

app.get('/', async (req, res) => {
    res.sendFile(ui / index.html)
})

app.get('/ask/:question', async (req, res) => {
    let response = await qna(req.params.question);
    res.send(response)
})


app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    
    await train();
})