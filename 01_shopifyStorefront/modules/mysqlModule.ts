/**
 * mysqlModule.ts
 *
 * module：MYSQL用
 **/

'use strict';

/// 定数
// import global interface
import { } from '../@types/globaljoinsql.d';
// 名前空間 
import { myDev } from '../consts/globalinfo';
import { myConst } from '../consts/globalvariables';
import { myDevConst } from '../consts/globalvariablesdev';
import { myLocalDevConst } from '../consts/globalvariableslocal';

/// 初期設定
// 可変要素
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let globalLogLevel: string; // ログレベル

// モジュール
import * as path from 'node:path'; // パス用
import { config as dotenv } from 'dotenv'; // 環境情報
import Logger from '../class/Logger'; // ログ用
import SQL from '../class/MySqlJoin0623'; // sql用

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalEnvfileName = '../.localenv';
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalEnvfileName = '../.devenv';
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  // 本番モード
} else {
  globalEnvfileName = '../.env';
  globalAppName = myConst.APP_NAME!; // アプリ名
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
}
// 環境変数
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// ロガー
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// DB設定
const myDB: SQL = new SQL(
  process.env.SQL_HOST!, // ホスト名
  process.env.SQL_ADMINUSER!, // ユーザ名
  process.env.SQL_ADMINPASS!, // ユーザパスワード
  Number(process.env.SQL_PORT), // ポートNO
  process.env.SQL_KEYDBNAME!, // DB名
  logger, // ロガー
);

/* count */
// アセット数カウント
export const countAssets = async (table: string, columns: string[], data: any[][]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace('mysql: countAssets mode');
      // 対象データ
      const assetCountArgs: countargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: data, // 値
      };
      // 対象データ取得
      const targetUserCount: number = await myDB.countDB(assetCountArgs);
      // ユーザ数
      resolve(targetUserCount);
      logger.trace('mysql: countAssets end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

/* select */
// アセット選択
export const selectAsset = async (table: string, columns: string[], values: any[][], limit?: number, order?: string, fields?: string[], reverse?: boolean, spanflg?: boolean): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace('mysql: selectAsset mode');
      // 対象データ
      let assetSelectArgs: selectargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: values, // 値
        limit: limit, // 上限
        order: order, // 順番
        reverse: reverse,
        fields: fields, // 選択カラム
      };
      // 範囲指定
      if (spanflg) {
        assetSelectArgs.spanval = 1;
        assetSelectArgs.spancol = 'created_at';
        assetSelectArgs.spandirection = 'after';
        assetSelectArgs.spanunit = 'hour';
      }
      // 対象データ取得
      const targetAssetData: any = await myDB.selectDB(assetSelectArgs);
      // 結果
      if (targetAssetData == 'error') {
        // DBエラー
        throw new Error('mysql: selectAsset error');

      } else if (targetAssetData == 'empty') {
        // ヒットなし
        resolve([]);
        logger.trace('mysql: selectAsset empty');

      } else {
        // 結果
        resolve(targetAssetData);
        logger.trace('mysql: selectAsset end');
      }

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

// アセット連結選択
export const selectJoinAsset = async (table: string, jointable: string, columns: string[], values: any[][], joincolumns: string[], joinvalues: any[][], limit?: number, order?: string, ordertable?: string, fields?: string[], reverse?: boolean): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace('mysql: selectJoinAsset mode');
      // 対象データ
      const selectJoinAssetObj: joinargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: values, // 値
        originid: `${jointable}_id`, // 元テーブルID
        jointable: jointable, // 連結テーブル
        joincolumns: joincolumns, // 連結カラム
        joinvalues: joinvalues, // 値
        joinid: 'id', // 連結ID
        limit: limit, // 上限
        order: order, // 順番
        ordertable: ordertable,  // 順番テーブル
        reverse: reverse,
        fields: fields, // 対象カラム
      };
      // 該当ユーザ抽出
      const selectedJoinAssetData: any = await myDB.selectJoinDB(selectJoinAssetObj);
      // 結果
      if (selectedJoinAssetData == 'error') {
        // DBエラー
        throw new Error('mysql: selectJoinAsset error');
      } else if (selectedJoinAssetData == 'empty') {
        // ヒットなし
        resolve([]);
        logger.trace('mysql: selectJoinAsset empty');
      } else {
        // 成功
        resolve(selectedJoinAssetData);
        logger.trace('mysql: selectJoinAsset end');
      }

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

// アセット選択
export const selectDoubleJoinAsset = async (table: string, jointable1: string, jointable2: string, columns: string[], values: any[][], joincolumns1: string[], joinvalues1: any[][], joincolumns2: string[], joinvalues2: any[][], fields: string[], reverse?: boolean): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace('mysql: selectDoubleJoinAsset mode');
      // 対象データ
      const selectJoinAssetObj: joindoubleargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: values, // 値
        originid1: `${jointable1}_id`,
        originid2: `${jointable2}_id`,
        jointable1: jointable1,  // 連結テーブル1
        jointable2: jointable2,  // 連結テーブル2
        joincolumns1: joincolumns1, // 連結カラム1
        joincolumns2: joincolumns2, // 連結カラム2
        joinvalues1: joinvalues1, // 連結値1
        joinvalues2: joinvalues2, // 連結値2
        joinid1: `id`, // 連結ID1
        joinid2: 'id', // 連結ID2
        reverse: reverse,
        fields: fields, // 対象カラム
      };
      // 該当ユーザ抽出
      const selectedJoinAssetData: any = await myDB.selectDoubleJoinDB(selectJoinAssetObj);
      // 結果
      if (selectedJoinAssetData == 'error') {
        // DBエラー
        throw new Error('mysql: selectDoubleJoinAsset error');
      } else if (selectedJoinAssetData == 'empty') {
        // ヒットなし
        resolve([]);
        logger.trace('mysql: selectDoubleJoinAsset empty');
      } else {
        // 成功
        resolve(selectedJoinAssetData);
        logger.trace('mysql: selectDoubleJoinAsset end');
      }

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

/* update */
// アセット更新
export const updateData = async (table: string, selColumns: string[], selData: any, setColumns: string[], setData: any[]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace('mysql: updateData mode');
      // 対象データ
      const updateAssetArgs: updateargs = {
        table: table, // テーブル
        setcol: setColumns, // 準備完了
        setval: setData, // 待機状態
        selcol: selColumns, // 対象
        selval: selData, // 対象値
      };
      // 更新処理
      const updateUserResult = await myDB.updateDB(updateAssetArgs);
      // 結果
      if (updateUserResult == 'error') {
        // エラー
        throw new Error('mysql: updateData error');
      } else if (updateUserResult == 'empty') {
        // 対象なし
        logger.trace('mysql: updateData empty');
      }
      // 成功
      resolve(updateUserResult);
      logger.trace('mysql: updateData end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject();
    }
  });
};

/* insert */
// アセット更新
export const insertData = async (table: string, columns: string[], data: any): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace('mysql: insertData mode');
      // 対象データ
      const insertDataArgs: insertargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: data, // 値
      };
      // インサートID
      const insertedTokenId: any = await myDB.insertDB(insertDataArgs);
      // 結果
      if (insertedTokenId == 'error' || insertedTokenId == 'empty') {
        // エラー
        throw new Error('mysql: insert error');
      }
      // 成功
      resolve(insertedTokenId);
      logger.trace('mysql: insertData end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject();
    }
  });
};
