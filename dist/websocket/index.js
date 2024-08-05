"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebSocketServer = void 0;
const websocketServer_1 = require("./websocketServer");
const startWebSocketServer = (server) => {
    (0, websocketServer_1.initServer)(server);
};
exports.startWebSocketServer = startWebSocketServer;
