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