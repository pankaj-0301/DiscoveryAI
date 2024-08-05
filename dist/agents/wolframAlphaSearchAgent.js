"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const output_parsers_1 = require("@langchain/core/output_parsers");
const documents_1 = require("@langchain/core/documents");
const searxng_1 = require("../lib/searxng");
const formatHistory_1 = __importDefault(require("../utils/formatHistory"));
const events_1 = __importDefault(require("events"));
const logger_1 = __importDefault(require("../utils/logger"));
const basicWolframAlphaSearchRetrieverPrompt = `
You will be given a conversation below and a follow up question. You need to rephrase the follow-up question if needed so it is a standalone question that can be used by the LLM to search the web for information.
If it is a writing task or a simple hi, hello rather than a question, you need to return \`not_needed\` as the response.

Example:
1. Follow up question: What is the atomic radius of S?
Rephrased: Atomic radius of S

2. Follow up question: What is linear algebra?
Rephrased: Linear algebra

3. Follow up question: What is the third law of thermodynamics?
Rephrased: Third law of thermodynamics

Conversation:
{chat_history}

Follow up question: {query}
Rephrased question:
`;
const basicWolframAlphaSearchResponsePrompt = `
    You are Perplexica, an AI model who is expert at searching the web and answering user's queries. You are set on focus mode 'Wolfram Alpha', this means you will be searching for information on the web using Wolfram Alpha. It is a computational knowledge engine that can answer factual queries and perform computations.

    Generate a response that is informative and relevant to the user's query based on provided context (the context consits of search results containg a brief description of the content of that page).
    You must use this context to answer the user's query in the best way possible. Use an unbaised and journalistic tone in your response. Do not repeat the text.
    You must not tell the user to open any link or visit any website to get the answer. You must provide the answer in the response itself. If the user asks for links you can provide them.
    Your responses should be medium to long in length be informative and relevant to the user's query. You can use markdowns to format your response. You should use bullet points to list the information. Make sure the answer is not short and is informative.
    You have to cite the answer using [number] notation. You must cite the sentences with their relevent context number. You must cite each and every part of the answer so the user can know where the information is coming from.
    Place these citations at the end of that particular sentence. You can cite the same sentence multiple times if it is relevant to the user's query like [number1][number2].
    However you do not need to cite it using the same number. You can use different numbers to cite the same sentence multiple times. The number refers to the number of the search result (passed in the context) used to generate that part of the answer.

    Aything inside the following \`context\` HTML block provided below is for your knowledge returned by Wolfram Alpha and is not shared by the user. You have to answer question on the basis of it and cite the relevant information from it but you do not have to 
    talk about the context in your response. 

    <context>
    {context}
    </context>

    If you think there's nothing relevant in the search results, you can say that 'Hmm, sorry I could not find any relevant information on this topic. Would you like me to search again or ask something else?'.
    Anything between the \`context\` is retrieved from Wolfram Alpha and is not a part of the conversation with the user. Today's date is ${new Date().toISOString()}
`;
const strParser = new output_parsers_1.StringOutputParser();
const handleStream = async (stream, emitter) => {
    for await (const event of stream) {
        if (event.event === 'on_chain_end' &&
            event.name === 'FinalSourceRetriever') {
            emitter.emit('data', JSON.stringify({ type: 'sources', data: event.data.output }));
        }
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
const createBasicWolframAlphaSearchRetrieverChain = (llm) => {
    return runnables_1.RunnableSequence.from([
        prompts_1.PromptTemplate.fromTemplate(basicWolframAlphaSearchRetrieverPrompt),
        llm,
        strParser,
        runnables_1.RunnableLambda.from(async (input) => {
            if (input === 'not_needed') {
                return { query: '', docs: [] };
            }
            const res = await (0, searxng_1.searchSearxng)(input, {
                language: 'en',
                engines: ['wolframalpha'],
            });
            const documents = res.results.map((result) => new documents_1.Document({
                pageContent: result.content,
                metadata: {
                    title: result.title,
                    url: result.url,
                    ...(result.img_src && { img_src: result.img_src }),
                },
            }));
            return { query: input, docs: documents };
        }),
    ]);
};
const createBasicWolframAlphaSearchAnsweringChain = (llm) => {
    const basicWolframAlphaSearchRetrieverChain = createBasicWolframAlphaSearchRetrieverChain(llm);
    const processDocs = (docs) => {
        return docs
            .map((_, index) => `${index + 1}. ${docs[index].pageContent}`)
            .join('\n');
    };
    return runnables_1.RunnableSequence.from([
        runnables_1.RunnableMap.from({
            query: (input) => input.query,
            chat_history: (input) => input.chat_history,
            context: runnables_1.RunnableSequence.from([
                (input) => ({
                    query: input.query,
                    chat_history: (0, formatHistory_1.default)(input.chat_history),
                }),
                basicWolframAlphaSearchRetrieverChain
                    .pipe(({ query, docs }) => {
                    return docs;
                })
                    .withConfig({
                    runName: 'FinalSourceRetriever',
                })
                    .pipe(processDocs),
            ]),
        }),
        prompts_1.ChatPromptTemplate.fromMessages([
            ['system', basicWolframAlphaSearchResponsePrompt],
            new prompts_1.MessagesPlaceholder('chat_history'),
            ['user', '{query}'],
        ]),
        llm,
        strParser,
    ]).withConfig({
        runName: 'FinalResponseGenerator',
    });
};
const basicWolframAlphaSearch = (query, history, llm) => {
    const emitter = new events_1.default();
    try {
        const basicWolframAlphaSearchAnsweringChain = createBasicWolframAlphaSearchAnsweringChain(llm);
        const stream = basicWolframAlphaSearchAnsweringChain.streamEvents({
            chat_history: history,
            query: query,
        }, {
            version: 'v1',
        });
        handleStream(stream, emitter);
    }
    catch (err) {
        emitter.emit('error', JSON.stringify({ data: 'An error has occurred please try again later' }));
        logger_1.default.error(`Error in WolframAlphaSearch: ${err}`);
    }
    return emitter;
};
const handleWolframAlphaSearch = (message, history, llm, embeddings) => {
    const emitter = basicWolframAlphaSearch(message, history, llm);
    return emitter;
};
exports.default = handleWolframAlphaSearch;
