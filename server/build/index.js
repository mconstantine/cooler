"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_server_express_1 = require("apollo-server-express");
var typeDefs_1 = require("./typeDefs");
var resolvers_1 = require("./resolvers");
var init_1 = require("./init");
var dotenv_1 = __importDefault(require("dotenv"));
var express_1 = __importDefault(require("express"));
var path_1 = __importDefault(require("path"));
var getContext_1 = require("./getContext");
var http_1 = __importDefault(require("http"));
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
function listen(server) {
    return new Promise(function (resolve, reject) {
        try {
            server.listen({ port: process.env.SERVER_PORT }, function () {
                return resolve("http://localhost:" + process.env.SERVER_PORT);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
function startServer() {
    dotenv_1.default.config();
    return function_1.pipe(init_1.init(), fp_ts_1.taskEither.chain(function () {
        return fp_ts_1.taskEither.fromTask(function () {
            var server = new apollo_server_express_1.ApolloServer({
                typeDefs: typeDefs_1.typeDefs,
                resolvers: resolvers_1.resolvers,
                context: getContext_1.getContext,
                subscriptions: getContext_1.subscriptionOptions
            });
            var app = express_1.default();
            var httpServer = http_1.default.createServer(app);
            server.applyMiddleware({ app: app });
            server.installSubscriptionHandlers(httpServer);
            app
                .use('/public', express_1.default.static(path_1.default.join(process.cwd(), '/public')))
                .use('/', express_1.default.static(path_1.default.join(process.cwd(), '../cooler/build')))
                .use('*', function (_req, res) {
                return res.sendFile(path_1.default.join(process.cwd(), '../cooler/build/index.html'));
            });
            return listen(httpServer);
        });
    }));
}
startServer()().then(fp_ts_1.either.fold(function (error) { return console.log(error); }, function (url) { return console.log("Server ready at " + url); }), function (error) { return console.log(error); });
