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
const VideoSearchChainPrompt = `
  You will be given a conversation below and a follow up question. You need to rephrase the follow-up question so it is a standalone question that can be used by the LLM to search Youtube for videos.
  You need to make sure the rephrased question agrees with the conversation and is relevant to the conversation.
  
  Example:
  1. Follow up question: How does a car work?
  Rephrased: How does a car work?
  
  2. Follow up question: What is the theory of relativity?
  Rephrased: What is theory of relativity
  
  3. Follow up question: How does an AC work?
  Rephrased: How does an AC work
  
  Conversation:
  {chat_history}
  
  Follow up question: {query}
  Rephrased question:
  `;
const strParser = new output_parsers_1.StringOutputParser();
const createVideoSearchChain = (llm) => {
    return runnables_1.RunnableSequence.from([
        runnables_1.RunnableMap.from({
            chat_history: (input) => {
                return (0, formatHistory_1.default)(input.chat_history);
            },
            query: (input) => {
                return input.query;
            },
        }),
        prompts_1.PromptTemplate.fromTemplate(VideoSearchChainPrompt),
        llm,
        strParser,
        runnables_1.RunnableLambda.from(async (input) => {
            const res = await (0, searxng_1.searchSearxng)(input, {
                engines: ['youtube'],
            });
            const videos = [];
            res.results.forEach((result) => {
                if (result.thumbnail &&
                    result.url &&
                    result.title &&
                    result.iframe_src) {
                    videos.push({
                        img_src: result.thumbnail,
                        url: result.url,
                        title: result.title,
                        iframe_src: result.iframe_src,
                    });
                }
            });
            return videos.slice(0, 10);
        }),
    ]);
};
const handleVideoSearch = (input, llm) => {
    const VideoSearchChain = createVideoSearchChain(llm);
    return VideoSearchChain.invoke(input);
};
exports.default = handleVideoSearch;
