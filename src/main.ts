import { NestFactory } from "@nestjs/core";
import * as session from "express-session";
import { AppModule } from "./app.module";
import { createClient } from "redis";
import * as connectRedis from "connect-redis";
import * as passport from "passport";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as cookieParser from "cookie-parser";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
BigInt.prototype["toJSON"] = function () {
    return this.toString();
};

/**
 * Check whether this server should run in HTTPS mode or not.
 * @returns true if HTTPS environment variable is set and isn't equal to "false", otherwise returns false.
 */
function isHttps(): boolean {
    return !!process.env.HTTPS && process.env.HTTPS !== "false";
}

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    if (!process.env.TRUST_PROXY) {
        throw new Error(
            "Required environment variable TRUST_PROXY is not set. " +
                'Set to "false" if you wish to disable trusting proxies.'
        );
    }
    app.set("trust proxy", process.env.TRUST_PROXY === "false" ? false : process.env.TRUST_PROXY);

    app.use(cookieParser());

    if (!process.env.SESSION_SECRET) {
        throw new Error("Required environment variable SESSION_SECRET is not set.");
    }

    // Create and add the middleware for sessions.
    const redisSessionStorageClient = createClient({
        legacyMode: true,
        url: process.env.REDIS_URL
    });
    redisSessionStorageClient.connect().catch(console.error);

    const RedisSessionStore = connectRedis(session);
    app.use(
        session({
            store: new RedisSessionStore({
                client: redisSessionStorageClient,
                prefix: "glimpse-sess:"
            }),
            name: "glimpse-sess",
            cookie: {
                maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
                secure: isHttps()
            },
            secret: process.env.SESSION_SECRET ?? "",
            saveUninitialized: false,
            resave: false
        })
    );
    app.use(passport.initialize());
    app.use(passport.session());

    await app.listen(4000);
}

bootstrap().catch((e) => {
    console.error(e);
    process.exit(1);
});
