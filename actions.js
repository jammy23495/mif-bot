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

async function train() {

    manager.addDocument('en', 'what is the weather?', 'weather');
    manager.addAnswer('en', 'weather', 'the weather is');
    manager.addAction('weather', 'getWeather', ['jenil'], function weather(input, name) {
        console.log(name)
        return `${JSON.stringify(input)} sunny`
    });

    await manager.train();

    console.log(await manager.process("en", "what is the weather?"))
}



train()