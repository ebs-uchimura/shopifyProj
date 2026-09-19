/**
 * passportModule.ts
 *
 * module：passport用
 **/

'use strict';

/// 定数
// 名前空間 
import { myDev } from '../consts/globalinfo';
import { myConst } from '../consts/globalvariables';
import { myDevConst } from '../consts/globalvariablesdev';
import { myLocalDevConst } from '../consts/globalvariableslocal';
// ログレベル
let globalAppName: string; // アプリ名
let globalLogLevel: string;

// モジュール
import Logger from '../class/Logger'; // ログ用

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  // 本番モード
} else {
  globalAppName = myConst.APP_NAME!; // アプリ名
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
}
// ロガー
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);

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
      res.redirect('/manage/login');  // ログイン画面に遷移
    }

  } catch (e) {
    // エラー
    logger.error(e);
  }
};
