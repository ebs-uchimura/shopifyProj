/**
 * passportModule.ts
 *
 * module：passport用
 **/

'use strict';

/// 定数
// 名前空間 
import { myDevConst } from '../consts/globalinfo';

// モジュール
import Logger from '../class/Logger'; // ログ用

// 開発モード
const globalAppName: string = myDevConst.APP_NAME!; // アプリ名
const globalLogLevel: string = myDevConst.LOG_LEVEL; // ログレベル
// ロガー
const logger: Logger = new Logger(myDevConst.COMPANY_NAME, globalAppName, globalLogLevel);

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
