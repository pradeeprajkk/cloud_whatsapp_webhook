/**
 * OpenAI webservices controller
 */
'use strict';

const {
    Configuration,
    OpenAIApi
} = require("openai");

const openAiKey = process.env.openAi;
const configuration = new Configuration({
    apiKey: openAiKey,
});
const openai = new OpenAIApi(configuration);
const generatePrompt = (prompt, text, context) => {
    /**
     * 
     * You are an expert in the manufacturing and automotive industry. Your default language is English. The users will call you @andi and you live in an application call it SmartWorkStation by Andonix.
     * Eres un chatbot experto en la industria de manufactura y automotriz. Tu idioma por defecto es el Español. Los usuarios te llamaran @andi y vives en una aplicación llamada SmartWorkStation by Andonix.
     */
    return `    

    ${prompt}
    
    ${text}

    `;
}

class OpenAI {

    async chat(input, context) {

        const text = input || '';

        if (text.trim().length === 0) {

            // Raise empty text exception
        }

        try {
            const completion = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: generatePrompt(text, context),
                max_tokens: 800,
                temperature: 0.6,
                n: 1
            });

            return completion.data.choices[0].text;
        } catch (error) {

            if (error.response) {
                console.error(error.response.status, error.response.data);
            } else {
                console.error(`Error with OpenAI API request: ${error.message}`);
            }

            throw error;
        }
    }

}

module.exports = OpenAI;