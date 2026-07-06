/**
 * passportModule.ts
 *
 * module：passport用
 **/

'use strict';

/// 定数
// 名前空間 
import { myVariable, myConst, myDevConst } from '../consts/globalvariables';

// ログレベル
let globalAppName: string = myDevConst.APP_NAME!; // アプリ名
let globalLogLevel: string = myDevConst.LOG_LEVEL;

// 開発
if (!myVariable.DEV_FLG) {
  // 環境ファイル名
  globalAppName = myConst.APP_NAME!;
  globalLogLevel = myConst.LOG_LEVEL;
} else {
  // 環境ファイル名
  globalAppName = myDevConst.APP_NAME!;
  globalLogLevel = myDevConst.LOG_LEVEL;
}

// モジュール
import Logger from '../class/Logger'; // ログ用
// 本番モード
// ロガー
const logger: Logger = new Logger(myVariable.COMPANY_NAME, globalAppName, globalLogLevel);

// 認証
export const isAuthenticated = (req: any, res: any, next: any): void => {
  try {
    if (req.isAuthenticated('userLocal')) {  // 認証済
      return next();
    }
    else {
      res.redirect('/auth/login');  // ログイン画面に遷移
    }

  } catch (e) {
    // エラー
    logger.error(e);
  }
};

// 管理者認証
export const isAdminAuthenticated = (req: any, res: any, next: any): void => {
  try {
    if (req.isAuthenticated('adminLocal')) {  // 認証済
      return next();
    }
    else {
      res.redirect('/login');  // ログイン画面に遷移
    }

  } catch (e) {
    // エラー
    logger.error(e);
  }
};
