"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSearxng = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const searchSearxng = async (query, opts) => {
    const searxngURL = (0, config_1.getSearxngApiEndpoint)();
    const url = new URL(`${searxngURL}/search?format=json`);
    url.searchParams.append('q', query);
    if (opts) {
        Object.keys(opts).forEach((key) => {
            if (Array.isArray(opts[key])) {
                url.searchParams.append(key, opts[key].join(','));
                return;
            }
            url.searchParams.append(key, opts[key]);
        });
    }
    const res = await axios_1.default.get(url.toString());
    const results = res.data.results;
    const suggestions = res.data.suggestions;
    return { results, suggestions };
};
exports.searchSearxng = searchSearxng;
