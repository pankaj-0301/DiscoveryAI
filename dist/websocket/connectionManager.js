"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnection = void 0;
const messageHandler_1 = require("./messageHandler");
const providers_1 = require("../lib/providers");
const logger_1 = __importDefault(require("../utils/logger"));
const openai_1 = require("@langchain/openai");
const handleConnection = async (ws, request) => {
    try {
        const searchParams = new URL(request.url, `http://${request.headers.host}`)
            .searchParams;
        const [chatModelProviders, embeddingModelProviders] = await Promise.all([
            (0, providers_1.getAvailableChatModelProviders)(),
            (0, providers_1.getAvailableEmbeddingModelProviders)(),
        ]);
        const chatModelProvider = searchParams.get('chatModelProvider') ||
            Object.keys(chatModelProviders)[0];
        const chatModel = searchParams.get('chatModel') ||
            Object.keys(chatModelProviders[chatModelProvider])[0];
        const embeddingModelProvider = searchParams.get('embeddingModelProvider') ||
            Object.keys(embeddingModelProviders)[0];
        const embeddingModel = searchParams.get('embeddingModel') ||
            Object.keys(embeddingModelProviders[embeddingModelProvider])[0];
        let llm;
        let embeddings;
        if (chatModelProviders[chatModelProvider] &&
            chatModelProviders[chatModelProvider][chatModel] &&
            chatModelProvider != 'custom_openai') {
            llm = chatModelProviders[chatModelProvider][chatModel];
        }
        else if (chatModelProvider == 'custom_openai') {
            llm = new openai_1.ChatOpenAI({
                modelName: chatModel,
                openAIApiKey: searchParams.get('openAIApiKey'),
                temperature: 0.7,
                configuration: {
                    baseURL: searchParams.get('openAIBaseURL'),
                },
            });
        }
        if (embeddingModelProviders[embeddingModelProvider] &&
            embeddingModelProviders[embeddingModelProvider][embeddingModel]) {
            embeddings = embeddingModelProviders[embeddingModelProvider][embeddingModel];
        }
        if (!llm || !embeddings) {
            ws.send(JSON.stringify({
                type: 'error',
                data: 'Invalid LLM or embeddings model selected, please refresh the page and try again.',
                key: 'INVALID_MODEL_SELECTED',
            }));
            ws.close();
        }
        ws.on('message', async (message) => await (0, messageHandler_1.handleMessage)(message.toString(), ws, llm, embeddings));
        ws.on('close', () => logger_1.default.debug('Connection closed'));
    }
    catch (err) {
        ws.send(JSON.stringify({
            type: 'error',
            data: 'Internal server error.',
            key: 'INTERNAL_SERVER_ERROR',
        }));
        ws.close();
        logger_1.default.error(err);
    }
};
exports.handleConnection = handleConnection;
