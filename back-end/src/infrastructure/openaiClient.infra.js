import OpenAI from "openai";
import config from "../config/env.config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const openaiClient = openai;
