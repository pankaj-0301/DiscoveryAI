"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const documents_1 = require("@langchain/core/documents");
const events_1 = require("events");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
// Load environment variables
dotenv_1.default.config();
// CourtListener API base URL
const COURT_LISTENER_BASE_URL = "https://www.courtlistener.com/api/rest/v3/";
// API endpoints
const ENDPOINTS = {
    opinions: "opinions/",
    people: "people/",
    courts: "courts/",
    dockets: "dockets/",
    search: "search/",
};
// Get API keys from environment variables
const COURT_LISTENER_API_KEY = process.env.COURT_LISTENER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// Specify OpenAI models
const OPENAI_CHAT_MODEL = "gpt-4"; // Change this to your desired chat model
const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002"; // Change this to your desired embedding model
const LEGAL_QUERY_ANALYSIS_PROMPT = `
You are an expert in US legal research. Given a user's query about law or legal services, 
analyze it and determine the most appropriate search strategy within the context of US law.

User query: {query}

Provide your response in the following format:
Search strategy: [brief description of search strategy]
Refined query: [refined version of the query for better search results]
Jurisdiction: [specific US state or "Federal" if applicable, otherwise "US General"]

If the query is not related to US law or legal services, respond with:
Search strategy: General web search
Refined query: [refined version of the query for better search results]
Jurisdiction: N/A
`;
const LEGAL_RESPONSE_PROMPT = `
You are a friendly and knowledgeable assistant specializing in US legal research. Your goal is to have a natural, engaging conversation while providing helpful information about US law and legal services. Adapt your tone to be casual for general queries and more professional for legal topics.

User query: {query}

Search results:
{context}

Please respond to the query in a conversational manner. Follow these guidelines:

1. If the query is a greeting or small talk, respond naturally as a friend would.
2. For non-legal queries, provide a friendly, informal response based on the available information.
3. For legal queries, maintain a professional tone while still being approachable.
4. Use contractions and casual language when appropriate to sound more natural.
5. If the query is unclear, politely ask for clarification.
6. Avoid formal phrases like "I regret to inform you" or "sorry to inform you".
7. If relevant, include US case names, dates, legal principles, and statutes, but explain them in simple terms.
8. Acknowledge if there's conflicting information and explain the differences conversationally.
9. Use a clear structure, but avoid numbered lists unless necessary for legal explanations.
10. Cite sources casually, like "according to [source number]" rather than formal citations.
11. If the query isn't fully addressed by the search results, suggest what other information might be helpful.
12. For legal topics, offer a balanced view if there are multiple perspectives within US law.
13. Suggest next steps or areas for further research in a friendly, helpful manner.
14. Be aware of and respect different jurisdictions within the US (state vs. federal law).
15. If the query relates to a specific state's laws, mention that your information is based on general knowledge and may not reflect the most current legal status in that state.
16. For federal legal matters, consider mentioning relevant US Supreme Court decisions or federal statutes if applicable.

Remember, your goal is to be helpful and engaging, whether the query is casual or legally focused, while maintaining a US-centric perspective on legal matters.
`;
class WebScrapingAgent {
    searchUrl;
    constructor() {
        this.searchUrl = "https://www.google.com/search";
    }
    async searchWeb(query, numResults = 10) {
        const escapedQuery = encodeURIComponent(query);
        const url = `${this.searchUrl}?q=${escapedQuery}&num=${numResults}`;
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };
        const response = await axios_1.default.get(url, { headers });
        const $ = (0, cheerio_1.load)(response.data);
        const results = [];
        $('.g').each((i, elem) => {
            const $elem = $(elem);
            const $anchor = $elem.find('a');
            if ($anchor.length) {
                const link = $anchor.attr('href');
                const title = $elem.find('h3.r').text() || "No title";
                const snippet = $elem.find('div.s').text() || "No snippet available";
                results.push(new documents_1.Document({
                    pageContent: `Source: Web Search\nTitle: ${title}\nURL: ${link}\nSnippet: ${snippet}`,
                    metadata: { source: link, number: i + 1 }
                }));
            }
            if (results.length >= numResults) {
                return false; // Break the loop
            }
        });
        return results;
    }
}
async function courtListenerSearch(query, endpoint = "search") {
    const url = COURT_LISTENER_BASE_URL + ENDPOINTS[endpoint];
    const headers = {
        "Authorization": `Token ${COURT_LISTENER_API_KEY}`
    };
    const params = {
        q: query,
        format: "json"
    };
    const response = await axios_1.default.get(url, { headers, params });
    return response.data;
}
class LegalResearchChain {
    llm;
    embeddings;
    strParser;
    webScraper;
    constructor(llm, embeddings) {
        this.llm = llm;
        this.embeddings = embeddings;
        this.strParser = new output_parsers_1.StringOutputParser();
        this.webScraper = new WebScrapingAgent();
    }
    async analyzeQuery(query) {
        if (query.split(' ').length <= 2 || ['hello', 'hi', 'hey'].includes(query.toLowerCase())) {
            return { strategy: "General conversation", refinedQuery: query, jurisdiction: "N/A" };
        }
        const prompt = prompts_1.PromptTemplate.fromTemplate(LEGAL_QUERY_ANALYSIS_PROMPT);
        const chain = prompt.pipe(this.llm).pipe(this.strParser);
        const result = await chain.invoke({ query });
        const lines = result.trim().split("\n");
        let strategy = "General web search";
        let refinedQuery = query;
        let jurisdiction = "US General";
        for (const line of lines) {
            if (line.startsWith("Search strategy:")) {
                strategy = line.split(": ", 2)[1].trim();
            }
            else if (line.startsWith("Refined query:")) {
                refinedQuery = line.split(": ", 2)[1].trim();
            }
            else if (line.startsWith("Jurisdiction:")) {
                jurisdiction = line.split(": ", 2)[1].trim();
            }
        }
        console.log("xyz here ");
        return { strategy, refinedQuery, jurisdiction };
    }
    async searchAndProcess(query, strategy, jurisdiction) {
        const documents = [];
        // Perform web search
        const webResults = await this.webScraper.searchWeb(query + " US law");
        documents.push(...webResults);
        // If strategy suggests legal-specific search, also search US legal databases
        if (strategy.toLowerCase().includes("legal")) {
            const courtListenerResults = await courtListenerSearch(query);
            for (let i = 0; i < Math.min(3, courtListenerResults.results.length); i++) {
                const result = courtListenerResults.results[i];
                const content = `Source: US Legal Database\n` +
                    `Name: ${result.name || 'N/A'}\n` +
                    `Role: ${result.role || 'N/A'}\n` +
                    `Court: ${result.court || 'N/A'}\n` +
                    `Date Filed: ${result.date_filed || 'N/A'}\n` +
                    `Snippet: ${result.snippet || 'N/A'}`;
                documents.push(new documents_1.Document({
                    pageContent: content,
                    metadata: { source: result.absolute_url || "", number: documents.length + 1 }
                }));
            }
        }
        return documents;
    }
    async generateResponse(query, context) {
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', LEGAL_RESPONSE_PROMPT],
            ['human', '{query}'],
        ]);
        const chain = prompt.pipe(this.llm).pipe(this.strParser);
        return await chain.invoke({ query, context });
    }
    async processQuery(query) {
        const analysis = await this.analyzeQuery(query);
        const documents = await this.searchAndProcess(analysis.refinedQuery, analysis.strategy, analysis.jurisdiction);
        const context = documents.map(doc => `${doc.metadata.number}. ${doc.pageContent}`).join("\n\n");
        const response = await this.generateResponse(query, context);
        return response;
    }
}
async function handleLegalSearch(message, llm, embeddings) {
    const chain = new LegalResearchChain(llm, embeddings);
    const emitter = new events_1.EventEmitter();
    try {
        const response = await chain.processQuery(message);
        emitter.emit('data', JSON.stringify({ type: 'response', data: response }));
        emitter.emit('end');
    }
    catch (err) {
        emitter.emit('error', JSON.stringify({ data: 'An error has occurred please try again later' }));
        console.error(`Error in LegalSearch: ${err}`);
    }
    return emitter;
}
exports.default = handleLegalSearch;
