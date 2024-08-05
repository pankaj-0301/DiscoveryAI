"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
const formatHistory_1 = __importDefault(require("../utils/formatHistory"));
const output_parsers_1 = require("@langchain/core/output_parsers");
const searxng_1 = require("../lib/searxng");
const imageSearchChainPrompt = `
You will be given a conversation below and a follow up question. You need to rephrase the follow-up question so it is a standalone question that can be used by the LLM to search the web for images.
You need to make sure the rephrased question agrees with the conversation and is relevant to the conversation.

Example:
1. Follow up question: What is a cat?
Rephrased: A cat

2. Follow up question: What is a car? How does it works?
Rephrased: Car working

3. Follow up question: How does an AC work?
Rephrased: AC working

Conversation:
{chat_history}

Follow up question: {query}
Rephrased question:
`;
const strParser = new output_parsers_1.StringOutputParser();
const createImageSearchChain = (llm) => {
    return runnables_1.RunnableSequence.from([
        runnables_1.RunnableMap.from({
            chat_history: (input) => {
                return (0, formatHistory_1.default)(input.chat_history);
            },
            query: (input) => {
                return input.query;
            },
        }),
        prompts_1.PromptTemplate.fromTemplate(imageSearchChainPrompt),
        llm,
        strParser,
        runnables_1.RunnableLambda.from(async (input) => {
            const res = await (0, searxng_1.searchSearxng)(input, {
                engines: ['bing images', 'google images'],
            });
            const images = [];
            res.results.forEach((result) => {
                if (result.img_src && result.url && result.title) {
                    images.push({
                        img_src: result.img_src,
                        url: result.url,
                        title: result.title,
                    });
                }
            });
            return images.slice(0, 10);
        }),
    ]);
};
const handleImageSearch = (input, llm) => {
    const imageSearchChain = createImageSearchChain(llm);
    return imageSearchChain.invoke(input);
};
exports.default = handleImageSearch;
