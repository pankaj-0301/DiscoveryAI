"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runnables_1 = require("@langchain/core/runnables");
const listLineOutputParser_1 = __importDefault(require("../lib/outputParsers/listLineOutputParser"));
const prompts_1 = require("@langchain/core/prompts");
const formatHistory_1 = __importDefault(require("../utils/formatHistory"));
const suggestionGeneratorPrompt = `
You are an AI suggestion generator for an AI powered search engine. You will be given a conversation below. You need to generate 4-5 suggestions based on the conversation. The suggestion should be relevant to the conversation that can be used by the user to ask the chat model for more information.
You need to make sure the suggestions are relevant to the conversation and are helpful to the user. Keep a note that the user might use these suggestions to ask a chat model for more information. 
Make sure the suggestions are medium in length and are informative and relevant to the conversation.

Provide these suggestions separated by newlines between the XML tags <suggestions> and </suggestions>. For example:

<suggestions>
Tell me more about SpaceX and their recent projects
What is the latest news on SpaceX?
Who is the CEO of SpaceX?
</suggestions>

Conversation:
{chat_history}
`;
const outputParser = new listLineOutputParser_1.default({
    key: 'suggestions',
});
const createSuggestionGeneratorChain = (llm) => {
    return runnables_1.RunnableSequence.from([
        runnables_1.RunnableMap.from({
            chat_history: (input) => (0, formatHistory_1.default)(input.chat_history),
        }),
        prompts_1.PromptTemplate.fromTemplate(suggestionGeneratorPrompt),
        llm,
        outputParser,
    ]);
};
const generateSuggestions = (input, llm) => {
    llm.temperature = 0;
    const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
    return suggestionGeneratorChain.invoke(input);
};
exports.default = generateSuggestions;
