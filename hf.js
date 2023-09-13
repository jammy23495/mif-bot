let { HfInference } = require('@huggingface/inference')

const hf = new HfInference()

// Natural Language

async function summarize(text) {
    var startTime = performance.now()


    let response = await hf.summarization({
        model: 'facebook/bart-large-cnn',
        inputs: text,
        parameters: {
            max_length: 100
        }
    })

    var endTime = performance.now()

    console.log(`Call took ${(endTime - startTime) / 1000} seconds`)
    return response;
}

module.exports = { summarize }