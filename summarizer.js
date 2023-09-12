async function createGenerator() {
    const {
        default: pipeline
    } = await import('@xenova/transformers');
    let generator = await pipeline('summarization');
    return generator
}

createGenerator()
// module.exports = {
//     createGenerator
// }