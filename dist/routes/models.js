"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("../utils/logger"));
const providers_1 = require("../lib/providers");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const [chatModelProviders, embeddingModelProviders] = await Promise.all([
            (0, providers_1.getAvailableChatModelProviders)(),
            (0, providers_1.getAvailableEmbeddingModelProviders)(),
        ]);
        res.status(200).json({ chatModelProviders, embeddingModelProviders });
    }
    catch (err) {
        res.status(500).json({ message: 'An error has occurred.' });
        logger_1.default.error(err.message);
    }
});
exports.default = router;
