"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const images_1 = __importDefault(require("./images"));
const videos_1 = __importDefault(require("./videos"));
const config_1 = __importDefault(require("./config"));
const models_1 = __importDefault(require("./models"));
const suggestions_1 = __importDefault(require("./suggestions"));
const router = express_1.default.Router();
router.use('/images', images_1.default);
router.use('/videos', videos_1.default);
router.use('/config', config_1.default);
router.use('/models', models_1.default);
router.use('/suggestions', suggestions_1.default);
exports.default = router;
