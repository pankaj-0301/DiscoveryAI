"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const providers_1 = require("../lib/providers");
const config_1 = require("../config");
const router = express_1.default.Router();
router.get('/', async (_, res) => {
    const config = {};
    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
        (0, providers_1.getAvailableChatModelProviders)(),
        (0, providers_1.getAvailableEmbeddingModelProviders)(),
    ]);
    config['chatModelProviders'] = {};
    config['embeddingModelProviders'] = {};
    for (const provider in chatModelProviders) {
        config['chatModelProviders'][provider] = Object.keys(chatModelProviders[provider]);
    }
    for (const provider in embeddingModelProviders) {
        config['embeddingModelProviders'][provider] = Object.keys(embeddingModelProviders[provider]);
    }
    config['openaiApiKey'] = (0, config_1.getOpenaiApiKey)();
    config['ollamaApiUrl'] = (0, config_1.getOllamaApiEndpoint)();
    config['groqApiKey'] = (0, config_1.getGroqApiKey)();
    res.status(200).json(config);
});
router.post('/', async (req, res) => {
    const config = req.body;
    const updatedConfig = {
        API_KEYS: {
            OPENAI: config.openaiApiKey,
            GROQ: config.groqApiKey,
        },
        API_ENDPOINTS: {
            OLLAMA: config.ollamaApiUrl,
        },
    };
    (0, config_1.updateConfig)(updatedConfig);
    res.status(200).json({ message: 'Config updated' });
});
exports.default = router;
