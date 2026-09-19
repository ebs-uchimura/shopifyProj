/**
 * shopify.ts
 **
 * function：Shopify API アプリ
 **/

'use strict';

/// 定数
// 名前空間 
import { myDev } from './consts/globalinfo';
import { myConst } from './consts/globalvariables';
import { myDevConst } from './consts/globalvariablesdev';
import { myLocalDevConst } from './consts/globalvariableslocal';
// 可変要素
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let globalLogLevel: string; // ログレベル
let globalDefaultUrl: string; // デフォルトURL
let globalDefaultPort: number; // ポート番号

/// モジュール
import * as path from 'node:path'; // パス設定用
import { config as dotenv } from 'dotenv'; // 環境変数
import passport from 'passport'; // ログイン用
import cors from 'cors'; // cors
import helmet from 'helmet'; // セキュリティ対策用
import * as passportStrategy from 'passport-local'; // ログイン用
import cookieParser from 'cookie-parser'; // クッキー用
import express from 'express'; // express用
import * as session from 'express-session'; // express-session
import mysqlSession from 'express-mysql-session';
import basicAuth from 'basic-auth-connect'; // basic認証
import Logger from './class/Logger'; // ロガー用
import { userRouter } from './routes/routes'; // ユーザ用
import { memberRouter } from './routes/memberroutes'; // 会員用
import { authRouter } from './routes/authroutes'; // 認証用
import { manageRouter } from './routes/manageroutes'; // 管理画面用
// MYSQL読込
import { selectAsset } from './modules/mysqlModule';

/// モジュール設定
// 管理画面用
const adminApp: any = express.Router();

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalEnvfileName = '../.localenv'; // 環境変数
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myLocalDevConst.DEFAULT_URL; // 基本URL
  globalDefaultPort = Number(myLocalDevConst.LISTEN_PORT); // ポート番号
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalEnvfileName = '../.devenv'; // 環境変数
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myDevConst.DEFAULT_URL; // 基本URL
  globalDefaultPort = Number(myDevConst.LISTEN_PORT); // ポート番号
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  // 本番モード
} else {
  globalEnvfileName = '../.env'; // 環境変数
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myConst.DEFAULT_URL; // 基本URL
  globalDefaultPort = Number(myConst.LISTEN_PORT); // ポート番号
  globalAppName = myConst.APP_NAME!; // アプリ名
}

// 環境変数
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// express設定
const MySQLStore: any = mysqlSession(session);
// ロガー設定
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// 暗号化用
const FIXED_PEPEER: string = process.env.CRYPTO_PEPPER!;
// シークレット文字列
const globalSecretString: string = process.env.SESSION_SECRET!;

// セッション保存用
const sessionStore: any = new MySQLStore({
  host: process.env.SQL_HOST!,
  port: Number(process.env.SQL_PORT),
  user: process.env.SQL_ADMINUSER!,
  password: process.env.SQL_ADMINPASS!,
  database: process.env.SQL_KEYDBNAME!,
  clearExpired: true,
  checkExpirationInterval: 60000,
  expiration: 60000,
  createDatabaseTable: true,
  endConnectionOnClose: true,
  disableTouch: true,
  charset: "charset",
  schema: {
    tableName: "session",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data",
    },
  },
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 10,
});
/// express設定
const app: any = express();
// 通常設定
app.set('views', path.join(__dirname, 'views'));
// ejsテンプレート使用
app.set('view engine', 'ejs');
// 事前設定読込
app.locals.pluralize = require('pluralize');
// json設定
app.use(express.json());
// body設定
app.use(
  express.urlencoded({
    extended: true, // フォーム受信可
  })
);
// クッキー使用
app.use(cookieParser());
// publicフォルダ設定
app.use(express.static(path.join(__dirname, 'public')));
// セッション設定
app.use(session.default({
  secret: globalSecretString,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
}));
// パスポート認証
app.use(passport.authenticate('session'));
// ヘルメット使用
app.use(cors());
/*
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "ec.compass-linq.com", "cdnjs.cloudflare.com", "unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com",],
      "img-src": ["'self'", "cdn.shopify.com", "data: image:", "http://www.w3.org/2000/svg",],
      "connect-src": ["'self'", "ec.compass-linq.com", "compass-linq.myshopify.com"]
    },
  },
}));
*/

// パスポート設定(ユーザ)
passport.use('userLocal', new passportStrategy.Strategy({
  usernameField: 'usermail', // ユーザメール
  passwordField: 'password' // ユーザパスワード
}, async function (username, password, cb) {
  // 該当ユーザ抽出
  const targetUser: any = await selectAsset('user', ['mail', 'usable'], [[username], [1]]);
  // 登録なし
  if (targetUser.length == 0) {
    // 登録なしエラー
    throw new Error('passport: no user');
  }
  // 認証成功
  if (password === targetUser[0].password) {
    console.log('login success');
    return cb(null, { id: targetUser[0].id, role: 'user' });
  } else {
    console.log('login fail');
  }
}));

// ユーザ情報をセッションへ保存
passport.serializeUser((user: any, done: any) => {
  console.log("serialize:" + user);
  done(null, user);
});
// IDからユーザ情報を取得
passport.deserializeUser(async (user: any, done: any) => {
  console.log("deserialize:" + user.id + user.role);
  // 該当ユーザ抽出
  const targetUser: any = await selectAsset(user.role, ['id', 'usable'], [[user.id], [1]]);
  done(null, targetUser);
});

// ユーザ画面
app.use('/', userRouter());
// 認証関係画面
app.use('/auth/', authRouter());
// 会員用画面（認証要）
app.use('/my/', memberRouter());
// 管理者画面
app.use('/manage/', adminApp);
// 管理画面
app.use('/manage/', manageRouter());

/// BASIC認証（管理者用）
// 認証情報
const adminId: string = process.env.ADMIN_ID!; // ID
const adminPass: string = process.env.ADMIN_PASSWORD!; // パスワード
// 管理者用
adminApp.use(basicAuth(adminId, adminPass));

// エラーハンドラ
app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction,
  ) => {
    logger.error(err);
    res.send('error');
  }
);

// 待機
app.listen(globalDefaultPort, () => {
  logger.info(
    `GMO card app listening at ${globalDefaultUrl}:${globalDefaultPort}`
  );
});
