"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceTransformersEmbeddings = void 0;
const embeddings_1 = require("@langchain/core/embeddings");
const chunk_array_1 = require("@langchain/core/utils/chunk_array");
class HuggingFaceTransformersEmbeddings extends embeddings_1.Embeddings {
    modelName = 'Xenova/all-MiniLM-L6-v2';
    model = 'Xenova/all-MiniLM-L6-v2';
    batchSize = 512;
    stripNewLines = true;
    timeout;
    pipelinePromise;
    constructor(fields) {
        super(fields ?? {});
        this.modelName = fields?.model ?? fields?.modelName ?? this.model;
        this.model = this.modelName;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
        this.timeout = fields?.timeout;
    }
    async embedDocuments(texts) {
        const batches = (0, chunk_array_1.chunkArray)(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, ' ')) : texts, this.batchSize);
        const batchRequests = batches.map((batch) => this.runEmbedding(batch));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batchResponse = batchResponses[i];
            for (let j = 0; j < batchResponse.length; j += 1) {
                embeddings.push(batchResponse[j]);
            }
        }
        return embeddings;
    }
    async embedQuery(text) {
        const data = await this.runEmbedding([
            this.stripNewLines ? text.replace(/\n/g, ' ') : text,
        ]);
        return data[0];
    }
    async runEmbedding(texts) {
        const { pipeline } = await import('@xenova/transformers');
        const pipe = await (this.pipelinePromise ??= pipeline('feature-extraction', this.model));
        return this.caller.call(async () => {
            const output = await pipe(texts, { pooling: 'mean', normalize: true });
            return output.tolist();
        });
    }
}
exports.HuggingFaceTransformersEmbeddings = HuggingFaceTransformersEmbeddings;
