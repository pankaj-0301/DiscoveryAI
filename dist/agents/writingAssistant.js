"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const output_parsers_1 = require("@langchain/core/output_parsers");
const events_1 = __importDefault(require("events"));
const logger_1 = __importDefault(require("../utils/logger"));
const writingAssistantPrompt = `
You are Perplexica, an AI model who is expert at searching the web and answering user's queries. You are currently set on focus mode 'Writing Assistant', this means you will be helping the user write a response to a given query. 
Since you are a writing assistant, you would not perform web searches. If you think you lack information to answer the query, you can ask the user for more information or suggest them to switch to a different focus mode.
`;
const strParser = new output_parsers_1.StringOutputParser();
const handleStream = async (stream, emitter) => {
    for await (const event of stream) {
        if (event.event === 'on_chain_stream' &&
            event.name === 'FinalResponseGenerator') {
            emitter.emit('data', JSON.stringify({ type: 'response', data: event.data.chunk }));
        }
        if (event.event === 'on_chain_end' &&
            event.name === 'FinalResponseGenerator') {
            emitter.emit('end');
        }
    }
};
const createWritingAssistantChain = (llm) => {
    return runnables_1.RunnableSequence.from([
        prompts_1.ChatPromptTemplate.fromMessages([
            ['system', writingAssistantPrompt],
            new prompts_1.MessagesPlaceholder('chat_history'),
            ['user', '{query}'],
        ]),
        llm,
        strParser,
    ]).withConfig({
        runName: 'FinalResponseGenerator',
    });
};
const handleWritingAssistant = (query, history, llm, embeddings) => {
    const emitter = new events_1.default();
    try {
        const writingAssistantChain = createWritingAssistantChain(llm);
        const stream = writingAssistantChain.streamEvents({
            chat_history: history,
            query: query,
        }, {
            version: 'v1',
        });
        handleStream(stream, emitter);
    }
    catch (err) {
        emitter.emit('error', JSON.stringify({ data: 'An error has occurred please try again later' }));
        logger_1.default.error(`Error in writing assistant: ${err}`);
    }
    return emitter;
};
exports.default = handleWritingAssistant;
