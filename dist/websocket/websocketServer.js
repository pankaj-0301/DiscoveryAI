"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = void 0;
const ws_1 = require("ws");
const connectionManager_1 = require("./connectionManager");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
const initServer = (server) => {
    const port = (0, config_1.getPort)();
    const wss = new ws_1.WebSocketServer({ server });
    wss.on('connection', connectionManager_1.handleConnection);
    logger_1.default.info(`WebSocket server started on port ${port}`);
};
exports.initServer = initServer;
