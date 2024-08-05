"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableEmbeddingModelProviders = exports.getAvailableChatModelProviders = void 0;
const openai_1 = require("@langchain/openai");
const ollama_1 = require("@langchain/community/chat_models/ollama");
const ollama_2 = require("@langchain/community/embeddings/ollama");
// import { HuggingFaceTransformersEmbeddings } from './huggingfaceTransformer';
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
const getAvailableChatModelProviders = async () => {
    const openAIApiKey = (0, config_1.getOpenaiApiKey)();
    const groqApiKey = (0, config_1.getGroqApiKey)();
    const ollamaEndpoint = (0, config_1.getOllamaApiEndpoint)();
    const models = {};
    if (openAIApiKey) {
        try {
            models['openai'] = {
                // 'GPT-3.5 turbo': new ChatOpenAI({
                //   openAIApiKey,
                //   modelName: 'gpt-3.5-turbo',
                //   temperature: 0.7,
                // }),
                // 'GPT-4': new ChatOpenAI({
                //   openAIApiKey,
                //   modelName: 'gpt-4',
                //   temperature: 0.7,
                // }),
                // 'GPT-4 turbo': new ChatOpenAI({
                //   openAIApiKey,
                //   modelName: 'gpt-4-turbo',
                //   temperature: 0.7,
                // }),
                'GPT-4 omni': new openai_1.ChatOpenAI({
                    openAIApiKey,
                    modelName: 'gpt-4o',
                    temperature: 0.7,
                }),
            };
        }
        catch (err) {
            logger_1.default.error(`Error loading OpenAI models: ${err}`);
        }
    }
    if (groqApiKey) {
        try {
            models['groq'] = {
                'LLaMA3 8b': new openai_1.ChatOpenAI({
                    openAIApiKey: groqApiKey,
                    modelName: 'llama3-8b-8192',
                    temperature: 0.7,
                }, {
                    baseURL: 'https://api.groq.com/openai/v1',
                }),
                'LLaMA3 70b': new openai_1.ChatOpenAI({
                    openAIApiKey: groqApiKey,
                    modelName: 'llama3-70b-8192',
                    temperature: 0.7,
                }, {
                    baseURL: 'https://api.groq.com/openai/v1',
                }),
                'Mixtral 8x7b': new openai_1.ChatOpenAI({
                    openAIApiKey: groqApiKey,
                    modelName: 'mixtral-8x7b-32768',
                    temperature: 0.7,
                }, {
                    baseURL: 'https://api.groq.com/openai/v1',
                }),
                'Gemma 7b': new openai_1.ChatOpenAI({
                    openAIApiKey: groqApiKey,
                    modelName: 'gemma-7b-it',
                    temperature: 0.7,
                }, {
                    baseURL: 'https://api.groq.com/openai/v1',
                }),
            };
        }
        catch (err) {
            logger_1.default.error(`Error loading Groq models: ${err}`);
        }
    }
    if (ollamaEndpoint) {
        try {
            const response = await fetch(`${ollamaEndpoint}/api/tags`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const { models: ollamaModels } = (await response.json());
            models['ollama'] = ollamaModels.reduce((acc, model) => {
                acc[model.model] = new ollama_1.ChatOllama({
                    baseUrl: ollamaEndpoint,
                    model: model.model,
                    temperature: 0.7,
                });
                return acc;
            }, {});
        }
        catch (err) {
            logger_1.default.error(`Error loading Ollama models: ${err}`);
        }
    }
    // models['custom_openai'] = {};
    return models;
};
exports.getAvailableChatModelProviders = getAvailableChatModelProviders;
const getAvailableEmbeddingModelProviders = async () => {
    const openAIApiKey = (0, config_1.getOpenaiApiKey)();
    const ollamaEndpoint = (0, config_1.getOllamaApiEndpoint)();
    const models = {};
    if (openAIApiKey) {
        try {
            models['openai'] = {
                // 'Text embedding 3 small': new OpenAIEmbeddings({
                //   openAIApiKey,
                //   modelName: 'text-embedding-3-small',
                // }),
                'Text embedding 3 large': new openai_1.OpenAIEmbeddings({
                    openAIApiKey,
                    modelName: 'text-embedding-3-large',
                }),
            };
        }
        catch (err) {
            logger_1.default.error(`Error loading OpenAI embeddings: ${err}`);
        }
    }
    if (ollamaEndpoint) {
        try {
            const response = await fetch(`${ollamaEndpoint}/api/tags`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const { models: ollamaModels } = (await response.json());
            models['ollama'] = ollamaModels.reduce((acc, model) => {
                acc[model.model] = new ollama_2.OllamaEmbeddings({
                    baseUrl: ollamaEndpoint,
                    model: model.model,
                });
                return acc;
            }, {});
        }
        catch (err) {
            logger_1.default.error(`Error loading Ollama embeddings: ${err}`);
        }
    }
    // try {
    //   models['local'] = {
    //     'BGE Small': new HuggingFaceTransformersEmbeddings({
    //       modelName: 'Xenova/bge-small-en-v1.5',
    //     }),
    //     'GTE Small': new HuggingFaceTransformersEmbeddings({
    //       modelName: 'Xenova/gte-small',
    //     }),
    //     'Bert Multilingual': new HuggingFaceTransformersEmbeddings({
    //       modelName: 'Xenova/bert-base-multilingual-uncased',
    //     }),
    //   };
    // } catch (err) {
    //   logger.error(`Error loading local embeddings: ${err}`);
    // }
    return models;
};
exports.getAvailableEmbeddingModelProviders = getAvailableEmbeddingModelProviders;
