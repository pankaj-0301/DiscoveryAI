"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const imageSearchAgent_1 = __importDefault(require("../agents/imageSearchAgent"));
const providers_1 = require("../lib/providers");
const messages_1 = require("@langchain/core/messages");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        let { query, chat_history, chat_model_provider, chat_model } = req.body;
        chat_history = chat_history.map((msg) => {
            if (msg.role === 'user') {
                return new messages_1.HumanMessage(msg.content);
            }
            else if (msg.role === 'assistant') {
                return new messages_1.AIMessage(msg.content);
            }
        });
        const chatModels = await (0, providers_1.getAvailableChatModelProviders)();
        const provider = chat_model_provider ?? Object.keys(chatModels)[0];
        const chatModel = chat_model ?? Object.keys(chatModels[provider])[0];
        let llm;
        if (chatModels[provider] && chatModels[provider][chatModel]) {
            llm = chatModels[provider][chatModel];
        }
        if (!llm) {
            res.status(500).json({ message: 'Invalid LLM model selected' });
            return;
        }
        const images = await (0, imageSearchAgent_1.default)({ query, chat_history }, llm);
        res.status(200).json({ images });
    }
    catch (err) {
        res.status(500).json({ message: 'An error has occurred.' });
        logger_1.default.error(`Error in image search: ${err.message}`);
    }
});
exports.default = router;
