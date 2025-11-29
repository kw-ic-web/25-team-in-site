import openai from '../config/openai.config.js';

export const OpenAIService = {
    /**
     * Get chat completion from OpenAI
     * @param {Array} messages - Array of message objects [{ role: 'user', content: '...' }]
     * @param {string} model - Model to use (default: gpt-3.5-turbo)
     * @returns {Promise<string>} - The content of the response
     */
    async getChatCompletion(messages, model = 'gpt-3.5-turbo') {
        try {
            const completion = await openai.chat.completions.create({
                messages,
                model,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    },
};
