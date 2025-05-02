"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOPICS = void 0;
exports.getKafkaProducer = getKafkaProducer;
const client_1 = require("../../../../libs/src/kafka/client");
Object.defineProperty(exports, "TOPICS", { enumerable: true, get: function () { return client_1.TOPICS; } });
let producer;
async function getKafkaProducer() {
    if (!producer) {
        producer = await (0, client_1.createProducer)();
    }
    return producer;
}
