export const externalPackages = [
  // common and no need to bundle in rsc
  "react",
  "react-dom",
  "react-server-dom-webpack",
  "tailwindcss",
  "zod",
  // icon libraries
  "@heroicons/react",
  // twofold libraries
  "@twofold/framework/encryption",
  // cjs unable to bundle
  // from next.js: https://github.com/vercel/next.js/blob/canary/packages/next/src/lib/server-external-packages.json
  // thank you next!
  "@appsignal/nodejs",
  "@aws-sdk/client-s3",
  "@aws-sdk/s3-presigned-post",
  "@blockfrost/blockfrost-js",
  "@highlight-run/node",
  "@jpg-store/lucid-cardano",
  "@libsql/client",
  "@mikro-orm/core",
  "@mikro-orm/knex",
  "@node-rs/argon2",
  "@node-rs/bcrypt",
  "@prisma/client",
  "@react-pdf/renderer",
  "@sentry/profiling-node",
  "@swc/core",
  "argon2",
  "autoprefixer",
  "aws-crt",
  "bcrypt",
  "better-sqlite3",
  "canvas",
  "cheerio",
  "cpu-features",
  "cypress",
  "dd-trace",
  "eslint",
  "express",
  "firebase-admin",
  "isolated-vm",
  "jest",
  "jsdom",
  "keyv",
  "libsql",
  "mdx-bundler",
  "mongodb",
  "mongoose",
  "nodemailer",
  "node-cron",
  "node-pty",
  "node-web-audio-api",
  "oslo",
  "pg",
  "playwright",
  "playwright-core",
  "postcss",
  "prettier",
  "prisma",
  "puppeteer",
  "puppeteer-core",
  "rimraf",
  "sharp",
  "shiki",
  "sqlite3",
  "ts-node",
  "ts-morph",
  "typescript",
  "vscode-oniguruma",
  "webpack",
  "websocket",
  "zeromq",
];

export const bundlePackages = ["@twofold/framework"];