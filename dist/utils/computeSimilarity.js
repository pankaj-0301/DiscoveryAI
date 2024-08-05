"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compute_dot_1 = __importDefault(require("compute-dot"));
const compute_cosine_similarity_1 = __importDefault(require("compute-cosine-similarity"));
const config_1 = require("../config");
const computeSimilarity = (x, y) => {
    const similarityMeasure = (0, config_1.getSimilarityMeasure)();
    if (similarityMeasure === 'cosine') {
        return (0, compute_cosine_similarity_1.default)(x, y);
    }
    else if (similarityMeasure === 'dot') {
        return (0, compute_dot_1.default)(x, y);
    }
    throw new Error('Invalid similarity measure');
};
exports.default = computeSimilarity;
