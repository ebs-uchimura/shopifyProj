/**
 * regetModule.ts
 *
 * route：DB再取得用
**/

'use strict';

/// 定数
// 名前空間
import { myDev } from '../consts/globalinfo';
import { myConst } from '../consts/globalvariables';
import { myDevConst } from '../consts/globalvariablesdev';
import { myLocalDevConst } from '../consts/globalvariableslocal';
// 可変要素
let globalAppName: string; // アプリ名
let globalLogLevel: string; // ログレベル

// モジュール定義
import NodeCache from "node-cache"; // キャッシュ用
import Logger from '../class/Logger'; // ログ用
// MYSQL読込
import { countAssets, selectAsset, selectJoinAsset } from '../modules/mysqlModule';

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  // 本番モード
} else {
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  globalAppName = myConst.APP_NAME!; // アプリ名
}
// ロガー設定
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// キャッシュ設定
const cacheMaker: NodeCache = new NodeCache();

// カテゴリ再取得
export const regetCategory = async (): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // カテゴリ
      let tmpCategories: any;
      // カテゴリ
      tmpCategories = cacheMaker.get('defCategories');
      // カテゴリキャッシュ無し
      if (tmpCategories == null) {
        logger.trace('category: all mode');
        // カテゴリ
        const allCategories: any = await selectAsset('category', ['display', 'usable'], [[1], [1]], 6, 'ranking', ['id', 'categoryname', 'englishname', 'imagepath', 'context'], true);
        // カテゴリキャッシュ
        cacheMaker.set('defCategories', allCategories);
        // カテゴリ
        resolve(allCategories);
      } else {
        logger.trace('category: cache mode');
        // カテゴリ
        resolve(tmpCategories);
      }
    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('regetCategory error');
    }
  });
}

// 商品再取得
export const regetProduct = async (): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // カテゴリ
      let tmpProducts: any;
      // 商品名
      tmpProducts = cacheMaker.get('defProducts');
      //商品キャッシュ無し
      if (tmpProducts == null) {
        logger.trace('product: all mode');
        // 商品
        const allproducts: any = await selectAsset('product', ['display', 'usable'], [[1], [1]], undefined, 'id', ['id', 'productname']);
        // 結果あり
        if (allproducts.length > 0) {
          // 価格修正作業
          allproducts.map((pd: any) => {
            // 10文字以上
            if (pd.productname.length > 10) {
              // 10文字にカット
              pd.productname = pd.productname.slice(0, 10);
            }
          });
        }
        // 商品キャッシュ
        cacheMaker.set('defProducts', allproducts);
        // 商品
        resolve(allproducts);
      } else {
        logger.trace('product: cache mode');
        // 商品
        resolve(tmpProducts);
      }
    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('regetProduct error');
    }
  });
}

// おススメ商品再取得
export const regetRecommendProduct = async (): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // おすすめ商品
      let tmpRecommendProducts: any;
      // おすすめ商品
      tmpRecommendProducts = cacheMaker.get('defRecomProducts');
      // おすすめ商品キャッシュ無し
      if (tmpRecommendProducts == null) {
        logger.trace('recommend: all mode');
        // おススメ商品
        const allRecomproducts: any = await selectJoinAsset('product', 'category', ['recommend', 'display', 'usable'], [[1], [1], [1]], ['display', 'usable'], [[1], [1]], 3, 'id', 'product', ['product.id', 'product.imagepath', 'productname', 'categoryname', 'product.description'], true);
        // おススメ商品キャッシュ
        cacheMaker.set('defRecomProduct', allRecomproducts);
        // おススメ商品
        resolve(allRecomproducts);
      } else {
        logger.trace('recommend: cache mode');
        // おすすめ商品
        resolve(tmpRecommendProducts);
      }
    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('regetProduct error');
    }
  });
}

// カート数再取得
export const regetCartNum = async (loggedin: boolean, req: any): Promise<number> => {
  return new Promise(async (resolve, _) => {
    try {
      // ログイン時のみ
      if (loggedin) {
        logger.trace('cart: user mode');
        // カート数キャッシュ
        const tmpCartNum: any = cacheMaker.get('cartNum');
        // カート数キャッシュ無し
        if (tmpCartNum == null) {
          logger.trace('cart: all mode');
          // ユーザID
          const userId: number = Number(req.session.passport.user.id);
          // ユーザ判定
          if (req.session.passport.user.role != 'user') {
            throw new Error('regcart: not num');
          }
          // カート数
          const cartNums: number = await countAssets('tmpcart', ['user_id', 'usable'], [[userId], [1]])
          // カート数キャッシュ
          cacheMaker.set('cartNum', cartNums);
          // カート数
          resolve(cartNums);
        } else {
          logger.trace('cart: cache mode');
          resolve(0);
        }
      } else {
        logger.trace('cart: session mode');
        // セッションID
        const sessionId: any = req.session.key;
        // カート数
        const cartNums: number = await countAssets('tmpcart', ['session', 'usable'], [[sessionId], [1]])
        // カート数キャッシュ
        cacheMaker.set('cartNum', cartNums);
        // カート数
        resolve(cartNums);
      }

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      resolve(0);
    }
  });
}