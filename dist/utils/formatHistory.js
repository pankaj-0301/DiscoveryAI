"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatChatHistoryAsString = (history) => {
    return history
        .map((message) => `${message._getType()}: ${message.content}`)
        .join('\n');
};
exports.default = formatChatHistoryAsString;
