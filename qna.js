let {
    getRandomFallbackAnswers,
    filterString
} = require("./utils")
const moment = require('moment');
let axios = require("axios")
require('dotenv').config()


//QNA
async function qna(question, manager) {
    //Load NLP Manager
    await manager.load("./model.nlp")

    //Generating Response
    const response = await manager.process('en', question);

    let finalAnswers = []

    //Check the greet response (topic)
    if (response && response.intent && (response.intent.toLowerCase().includes("greet") || response.intent.toLowerCase().includes("action"))) {
        let answer = response.answer || "I am sorry, I don't know the answer. Please ask questions related to forum."
        finalAnswers.push({
            "answer_summary": answer,
            "isGreet": true
        })
    }
    // For other topics rather than greet
    else {
        //Classifcations found
        if (response && response.classifications && response.classifications.length > 0) {
            let classifications = response.classifications;
            let validClassifications = classifications.filter((e) => {
                return e.score > 0.1 && !e.intent.toLowerCase().includes("greet")
            })
            //Valid Classifications found
            if (validClassifications && validClassifications.length > 0) {
                let allAnswers = []
                for (let i = 0; i < validClassifications.length; i++) {
                    if (validClassifications[i].intent.includes("MIF")) {
                        let intent = validClassifications[i].intent.split("_");
                        let POST_ID = intent[0];
                        console.log(POST_ID)
                        let post = await getDataByPOSTID(POST_ID)
                        console.log(post)
                        if (post && post.length > 0) {
                            for (let j = 0; j < post.length; j++) {
                                let comment_summary = post[j].Comment && post[j].Comment != "NULL" ? await generateAnswer(filterString(post[j].Comment)) : {
                                    "answer_summary": "No comments found!",
                                    "isGreet": false
                                }
                                finalAnswers.push({
                                    "answer_summary": comment_summary.answer_summary,
                                    "isGreet": comment_summary.isGreet,
                                    "props": {
                                        "ID": post[j].Post_ID,
                                        "Posted_By": post[j].SubmittedBy,
                                        "Subject": post[j].Subject,
                                        "Question": post[j].Question,
                                        "FeedType": post[j].FeedType,
                                        "Posted_On": moment(post[j].Submitted_On, "YYYY-MM-DD").format('MMMM Do YYYY'),
                                        "Likes": post[j].LikeCount,
                                        "Comments": post[j].CommentCount,
                                        "Views": post[j].ViewCount,
                                        "Comment_By": post[j].Comment_By,
                                        "Commented_On": moment(post[j].Comment_On, "YYYY-MM-DD").format('MMMM Do YYYY'),
                                        "Category": post[j].Category
                                    }
                                })
                            }
                        }
                    }
                }

            } else {
                console.log("No Valid Classifications found!")
                finalAnswers.push({
                    "answer_summary": getRandomFallbackAnswers(),
                    "isGreet": true
                })
            }
        } else {
            console.log("No Classifications found!")
            finalAnswers.push({
                "answer_summary": getRandomFallbackAnswers(),
                "isGreet": true
            })
        }
    }
    return {
        "data": finalAnswers,
        "response": response
    };
}

async function generateAnswer(answer) {
    try {
        let answer_summary = ""

        let data = JSON.stringify({
            "text": answer
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.SUMMARIZE_API_SERVER}/mif`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        await axios.request(config)
            .then((response) => {
                let data = response.data;
                answer_summary = data && data.length > 0 ? data[0].summary_text : ""
            })
            .catch((error) => {
                console.log(error);
            });


        return {
            answer_summary: answer_summary,
            isGreet: false
        }
    } catch (error) {
        return {
            answer_summary: "I am sorry! I don't know about this. Please ask questions related to forum.",
            isGreet: true
        }
    }
}

async function getDataByPOSTID(id) {
    let {
        getMIFData
    } = require("./sql")
    let sqlData = await getMIFData();
    let filteredData = sqlData.filter((s) => {
        return s.Post_ID == id
    })
    return filteredData
}

module.exports = {
    qna
}