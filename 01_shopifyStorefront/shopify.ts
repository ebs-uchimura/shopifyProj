/**
 * shopify.ts
 **
 * function：Shopify API アプリ
 **/

'use strict';

/// 定数
// 名前空間 
import { myDevConst } from './consts/globalinfo';
import globals from './consts/globalenv';
/// モジュール  
import * as path from 'node:path'; // パス設定用
import passport from 'passport'; // ログイン用
import cors from 'cors'; // cors設定
import * as userPassportStrategy from 'passport-local'; // ユーザログイン用
import NodeCache from "node-cache"; // キャッシュ用
import cookieParser from 'cookie-parser'; // クッキー用
import express from 'express'; // express用
import * as session from 'express-session'; // セッション用
import mysqlSession from 'express-mysql-session'; // セッションDB設定用
import Logger from './class/Logger'; // ロガー用
import { userRouter } from './routes/routes'; // ユーザ用
import { memberRouter } from './routes/memberroutes'; // 会員用
// MYSQL読込
import { selectAsset } from './modules/mysqlModule'; // DB用

/// モジュール設定
const globalLogLevel: string = myDevConst.LOG_LEVEL; // ログレベル
const globalDefaultUrl: string = myDevConst.DEFAULT_URL; // 基本URL
const globalAppName: string = myDevConst.APP_NAME!; // アプリ名
// 開発モード
const globalDefaultPort: number = Number(globals.LISTEN_PORT); // 開発ポート番号
// express設定
const MySQLStore: any = mysqlSession(session.default);
// ロガー設定
const logger: Logger = new Logger(myDevConst.COMPANY_NAME, globalAppName, globalLogLevel);
// キャッシュ設定
const cacheMaker: NodeCache = new NodeCache();
// シークレット文字列
const globalSecretString: string = globals.SESSION_SECRET!;

// セッション保存用
const sessionStore: any = new MySQLStore({
  host: globals.SQL_HOST!,
  port: Number(globals.SQL_PORT),
  user: globals.SQL_ADMINUSER!,
  password: globals.SQL_ADMINPASS!,
  database: globals.SQL_KEYDBNAME!,
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
// cors設定
app.use(cors());
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

// パスポート設定(ユーザ)
passport.use('userLocal', new userPassportStrategy.Strategy({
  usernameField: 'usermail', // ユーザメール
  passwordField: 'password' // ユーザパスワード
}, async function (username: string, password: string, cb: any) {
  try {
    // 該当ユーザ抽出
    const targetUser: any = await selectAsset('user', ['usermail', 'usable'], [[username], [1]]);
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

  } catch (e: unknown) {
    logger.error(e);
    // エラー
    return cb(null, false, { message: "login error" })
  }
}));

// ユーザ情報をセッションへ保存
passport.serializeUser((user: any, done: any) => {
  console.log("serialize:" + user.id + user.role);
  done(null, user);
});
// IDからユーザ情報を取得
passport.deserializeUser(async (user: any, done: any) => {
  console.log("deserialize:" + user.id + user.role);
  // 該当ユーザ抽出
  const targetUser: any = await selectAsset(user.role, ['id', 'usable'], [[user.id], [1]]);
  done(null, targetUser);
});

// キャッシュクリア
cacheMaker.flushAll();
// ユーザ画面
app.use('/', userRouter());
// 会員用画面（認証要）
app.use('/my/', memberRouter());

// エラーハンドラ
app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction,
  ) => {
    logger.error(err);
    res.render('error.ejs', {
      title: "500エラー",
      message: "Internal Server Error",
    });
  }
);

// 待機
app.listen(globalDefaultPort, () => {
  logger.info(
    `GMO card app listening at ${globalDefaultUrl}:${globalDefaultPort}`
  );
});
