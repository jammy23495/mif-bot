let {
    isBot,
    isNULL,
    getRandomFallbackAnswers
} = require("./utils")

let {
    loadActions
} = require("./actions")


let SummarizerManager = require("node-summarizer").SummarizerManager;

//QNA
async function qna(question, manager) {
    
    manager.load()
    //Generating Response
    const response = await manager.process('en', question);

    let finalAnswers = []

    //Check the greet response (topic)
    if (response && response.intent && (response.intent.toLowerCase().includes("greet") || response.intent.toLowerCase().includes("action"))) {
        let answer = await generateAnswer(response.answer || "I am sorry, I don't know the answer. Please ask questions related to forum.")
        finalAnswers.push({
            "answer_summary": answer.answer_summary,
            "props": answer.props,
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
                    let newUtterance = await manager.findAllAnswers("en", validClassifications[i].intent)
                    allAnswers.push(newUtterance[0]);
                }
                //Get all answers
                if (allAnswers && allAnswers.length > 0) {
                    console.log(`${allAnswers.length} valid answer(s)\n`)
                    for (let i = 0; i < allAnswers.length; i++) {
                        console.log(`Answer: ${i+1}`)
                        let ans = await generateAnswer(allAnswers[i].answer)
                        let isGreet = isBot(ans.props.Answered_By)
                        let isCommented = isNULL(ans.props.Answered_By)
                        ans.isGreet = isGreet
                        ans.isCommented = isCommented
                        finalAnswers.push(ans)
                    }
                } else {
                    console.log("No Answer found for Valid Classification!")
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
                console.log("No Valid Classifications found!")
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
            console.log("No Classifications found!")
            finalAnswers.push({
                "answer_summary": getRandomFallbackAnswers(),
                "isGreet": true,
                "props": {
                    "ID": "null",
                    "Answered_By": "Bot"
                }
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
    } catch (error) {
        return {
            answer_summary: "I am sorry! I don't know about this. Please ask questions related to forum.",
            props: {}
        }
    }


}


module.exports = {
    qna
}