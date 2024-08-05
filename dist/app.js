"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_1 = require("./websocket");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const routes_1 = __importDefault(require("./routes"));
const config_1 = require("./config");
const logger_1 = __importDefault(require("./utils/logger"));
const port = (0, config_1.getPort)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const corsOptions = {
    origin: '*',
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use('/api', routes_1.default);
app.get('/api', (_, res) => {
    res.status(200).json({ status: 'ok' });
});
server.listen(port, () => {
    logger_1.default.info(`Server is running on port ${port}`);
});
(0, websocket_1.startWebSocketServer)(server);
