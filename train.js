const moment = require('moment');
const csv = require('csvtojson');
let {
    loadActions
} = require("./actions")

let {
    getMIFData
} = require("./sql")

let language = "en"

//Train MIF Dataset
async function train(manager) {
    try {
        let jsonArray = await csv().fromFile("./mif.csv");
        let sqlData = await getMIFData();
        jsonArray = [...jsonArray, ...sqlData]
        let classifications = []

        //Create Intents and Utterances from Greet
        for (let index = 0; index < jsonArray.length; index++) {
            let topic = jsonArray[index].Topic ? jsonArray[index].Topic : "MIF";
            let subject = jsonArray[index].Subject ? jsonArray[index].Subject : "";
            let question = jsonArray[index].Question ? jsonArray[index].Question.replaceAll("\"", "\'") : "";
            question = question.replaceAll("�", "");
            let ROW_ID = jsonArray[index].Row_Number.toString();
            let ID = jsonArray[index].Post_ID.toString();
            let answer = await filterAnswer(jsonArray[index].Comment);
            let likes = jsonArray[index].LikeCount ? jsonArray[index].LikeCount : 0;
            let comments = jsonArray[index].CommentCount ? jsonArray[index].CommentCount : 0;
            let post_url = jsonArray[index].Post_URL ? jsonArray[index].Post_URL : "https://www.google.com";
            let post_date = jsonArray[index].Comment_On;
            let post_date_string = moment(post_date, "YYYY-MM-DD").format('MMMM Do YYYY');
            let answered_by = jsonArray[index].Comment_By;

            let newanswer = answer + `???{"ID":"${ID}","Answered_By":"${answered_by}","likes":${likes},"comments":${comments},"post_url":"${post_url}","post_date":"${post_date_string}","subject":"${subject}","question":"${question}","answer":"${answer}"}`

            let intent = ROW_ID + `_${topic}` + "_intent_" + subject.replaceAll(" ", "_")

            manager.addDocument(language, subject, intent);
            manager.addDocument(language, "Summarize " + subject, intent);
            manager.addDocument(language, "Tell me something about " + subject, intent);
            manager.addDocument(language, "Is there any post related to " + subject, intent);



            manager.addAnswer(language, intent, newanswer);
        }


        //Load Actions & Entities
        await loadActions(manager, jsonArray, classifications)

        // Train and save the model.
        await manager.train();
        manager.save();
        return {
            "status": "200",
            "message": "Model Trained successfully!"
        }
    } catch (error) {
        return {
            "status": "400",
            "message": error
        }
    }
}

async function filterAnswer(answer) {
    if (answer) {
        answer = answer.replaceAll("\"", "\'")
        answer = answer.replaceAll("\r", " ")
        answer = answer.replaceAll("\n", " ")
        answer = answer.replaceAll("\t", " ")
        return answer;
    } else {
        return "I am sorry! I don't know about this."
    }
}


module.exports = {
    train
}