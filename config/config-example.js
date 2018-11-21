"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    server: {
        host: "localhost",
        port: 30996,
        log: "./log.txt",
        queueSize: 10
    },
    webhook: {
        secret: "",
        url: "/webhook",
        method: "POST",
    },
    git: {
        path: "/path/to/repo",
        repository: "",
        branch: "master",
    },
    ftp: {
        address: "",
        username: "",
        password: "",
        folder: "",
    }
};
