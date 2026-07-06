/**
 * globaenv.ts
 **
 * function：global env variables
**/

/// 定数
// 名前空間 
import { myVariable } from "../consts/globalvariables";
// モジュール 
import * as path from 'node:path'; // パス設定用
import { config as dotenv } from 'dotenv'; // 環境変数
// 可変要素
let globalEnvfileName: string = '';
// 開発
if (myVariable.DEV_FLG) {
  // 環境ファイル名
  globalEnvfileName = '../.devenv';
} else {
  // 環境ファイル名
  globalEnvfileName = '../.env';
}
// 環境変数
dotenv({ path: path.join(__dirname, globalEnvfileName) });

const globals = {
  LISTEN_PORT: process.env.LISTEN_PORT,
  SQL_HOST: process.env.SQL_HOST,
  SQL_PORT: process.env.SQL_PORT,
  SQL_ADMINUSER: process.env.SQL_ADMINUSER,
  SQL_ADMINPASS: process.env.SQL_ADMINPASS,
  SQL_KEYDBNAME: process.env.SQL_KEYDBNAME,
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
  SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  SESSION_SECRET: process.env.SESSION_SECRET,
  CRYPTO_PEPPER: process.env.CRYPTO_PEPPER,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST,
  NODEMAILER_PORT: process.env.NODEMAILER_PORT,
  NODEMAILER_USERNAME: process.env.NODEMAILER_USERNAME,
  NODEMAILER_PASSWORD: process.env.NODEMAILER_PASSWORD,
};

export default globals;