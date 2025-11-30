import { openaiClient } from "../infrastructure/openaiClient.infra.js";

export const HintService = {
  async _getChatCompletion(messages, model = "gpt-5.1-codex") {
    try {
      const completion = await openaiClient.chat.completions.create({
        messages,
        model,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  },
};
