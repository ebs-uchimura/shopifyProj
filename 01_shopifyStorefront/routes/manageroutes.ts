/**
 * manageroutes.ts
 *
 * route：管理画面関係ルーティング用
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
let globalEnvfileName: string; // 環境ファイル名
let globalServerUrl: string; // サーバURL
let globalLogLevel: string; // ログレベル

/// モジュール定義
import * as path from 'node:path'; // path用
import { setTimeout } from 'node:timers/promises'; // 待機用
import { Router } from 'express'; // express用
import sanitizeHtml from 'sanitize-html'; // サニタイズ用
import { config as dotenv } from 'dotenv'; // 環境変数用
import Logger from '../class/Logger'; // ロガー用
// MYSQL読込
import { countAssets, selectAsset, selectJoinAsset, updateData, insertData } from '../modules/mysqlModule';
// Shopify読込
import { getProductData, getCategoryData } from '../modules/shopifyModule';

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalEnvfileName = '../.localenv'; // 環境変数ファイル
  globalServerUrl = myLocalDevConst.DEFAULT_URL!; // 検証用サーバURL
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalEnvfileName = '../.devenv'; // 環境変数ファイル
  globalServerUrl = myDevConst.DEFAULT_URL!; // 検証用サーバURL
  globalLogLevel = myDevConst.LOG_LEVEL!; // ログレベル
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  // 本番モード
} else {
  globalEnvfileName = '../.env'; // 環境変数ファイル
  globalServerUrl = myConst.DEFAULT_URL!; // サーバURL
  globalLogLevel = myConst.LOG_LEVEL!; // ログレベル
  globalAppName = myConst.APP_NAME!; // アプリ名
}
// 環境変数設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// ロガー設定
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// 管理画面関係ポストルータ
export const manageRouter = () => {
  // ルータ
  const router: any = Router();

  /// get
  // 管理画面トップ
  router.get('/', (_: any, res: any) => {
    try {
      logger.info('manage: top connected');
      // ログイン済み
      //if (req.session.passport) {
      // 管理画面表示
      res.render('manage/manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: 'compassLinq', // タイトル
      });
      //}

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // 管理者ログイン画面
  router.get('/login', async (_: any, res: any) => {
    try {
      logger.debug('manage: login mode');
      // ログイン
      res.render('manage/login_manage', {
        root: globalServerUrl, // ルートURL
        title: '管理者ログイン',
        message: '',
      });

    } catch (e) {
      logger.error(e);
    }
  });

  // 注文管理画面
  router.get('/order', async (_: any, res: any) => {
    try {
      logger.info('manage: order connected');
      // 送付用
      let tmpcartforSend: any = [];
      // 全注文
      const manTmpCart: any = await selectJoinAsset('tmpcart', 'user', ['usable'], [[1]], ['usable'], [[1]], undefined, 'id', 'tmpcart', ['tmpcart.id', 'tmpcart.user_id', 'user.firstname', 'user.lastname', 'tmpcart.printing', 'tmpcart.updated_at']);
      console.log(manTmpCart);
      // ヒットあり
      if (manTmpCart.length > 0) {
        // 価格修正作業
        manTmpCart.map((cart: any) => {
          // 日付を返還
          cart.updated_at = new Date(cart.updated_at).toISOString().slice(0, 16);
          // 送付用に格納
          tmpcartforSend.push(cart);
        });
        await setTimeout(500);
        logger.info('manage: order completed');
        // 名入れ管理画面表示
        res.render('manage/order_manage.ejs', {
          root: globalServerUrl, // ルートURL
          title: 'shopify注文管理', // タイトル
          data: tmpcartforSend, // 注文
        });
      } else {
        logger.info('manage: no order');
        // 名入れ管理画面表示
        res.render('manage/order_manage.ejs', {
          root: globalServerUrl, // ルートURL
          title: 'shopify注文管理', // タイトル
          data: [], // 注文
        });
      }

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // 商品管理画面
  router.get('/product', async (_: any, res: any) => {
    try {
      logger.info('manage: product connected');
      // 全商品
      const manProducts: any = await selectAsset('product', ['usable'], [[1]]);
      // ヒットあり
      if (manProducts.length > 0) {
        // 価格修正作業
        manProducts.map((pd: any) => {
          // 10文字以上
          if (pd.productname.length > 10) {
            // 10文字にカット
            pd.description = sanitizeHtml(pd.description).replace(/['"]+/g, '');
          }
        });
      }
      await setTimeout(500);
      logger.info('manage: product completed');
      // 商品管理画面表示
      res.render('manage/product_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: 'shopify商品', // タイトル
        data: manProducts, // 商品
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  }
  );

  // カテゴリ管理画面
  router.get('/category', async (_: any, res: any) => {
    try {
      logger.info('manage: category connected');
      // 全カテゴリ
      const manCategories: any = await selectAsset('category', ['usable'], [[1]]);
      await setTimeout(500);
      logger.info('manage: category completed');
      // カテゴリ管理画面表示
      res.render('manage/category_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: 'shopifyカテゴリ', // タイトル
        data: manCategories, // カテゴリ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // レビュー管理画面
  router.get('/review', async (_: any, res: any) => {
    try {
      logger.info('manage: review connected');
      // 全レビュー
      const manReviews: any = await selectJoinAsset('review', 'product', ['usable'], [[1]], ['usable'], [[1]], undefined, 'id', 'review', ['review.id', 'product_id', 'productname', 'content', 'stars', 'review.display']);
      await setTimeout(500);
      logger.info('manage: review completed');
      // レビュー管理画面表示
      res.render('manage/review_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: 'shopifyレビュー', // タイトル
        data: manReviews, // レビュー
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // ニュース登録画面
  router.get('/newsreg', async (_: any, res: any) => {
    try {
      logger.info('manage: newsreg mode');
      // ニュース管理画面表示
      res.render('manage/newsreg_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: 'shopifyニュース登録', // タイトル
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // ニュース編集画面
  router.get('/newsedit', async (_: any, res: any) => {
    try {
      logger.info('manage: newsedit connected');
      // 全ニュース
      const manNews: any = await selectAsset('news', ['usable'], [[1]]);
      await setTimeout(500);
      logger.info('manage: newsedit completed');
      // ニュース管理画面表示
      res.render('manage/newsedit_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: 'shopifyニュース編集', // タイトル
        data: manNews, // ニュース
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // いいね管理画面
  router.get('/good', async (_: any, res: any) => {
    try {
      logger.info('manage: good connected');
      // いいね
      let goodInfos: any = [];
      // プロミス
      let promises: any = [];
      // 全いいね
      const manFavorites: any = await selectJoinAsset('favorite', 'product', ['usable'], [[1]], ['usable'], [[1]], undefined, 'id', 'product', ['product.id', 'productname']);
      // ヒットあり
      if (manFavorites.length > 0) {
        // 重複削除
        const uniqueFavs: any[] = Array.from(
          new Map(manFavorites.map((fav: any) => [fav.id, fav])).values()
        );
        // いいねループ
        for (const favpd of uniqueFavs) {
          // いいね追加
          goodInfos.push({
            id: favpd.id, // いいねID
            name: favpd.productname, // いいね商品
          });
          // プロミス追加
          promises.push(countAssets('favorite', ['product_id', 'usable'], [[favpd.id], [1]]));
        }
        // いいね数
        const countResult: any = await Promise.all(promises);
        await setTimeout(500);
        logger.info('manage: good completed');
        // いいね管理画面表示
        res.render('manage/good_manage.ejs', {
          root: globalServerUrl, // ルートURL
          title: 'shopifyいいね', // タイトル
          count: countResult, // いいね数
          infos: goodInfos, // いいね
        });
      } else {
        logger.info('manage: no good');
        // いいね管理画面表示
        res.render('manage/good_manage.ejs', {
          root: globalServerUrl, // ルートURL
          title: 'shopifyいいね', // タイトル
          count: [], // いいね数
          infos: [], // いいね
        });
      }

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  /// post
  // 初期化
  router.post('/init', async (_: any, res: any) => {
    try {
      logger.info('manage: init connected');
      // カテゴリデータ
      const categoryData: any = await getCategoryData(250);
      // 商品データ
      const productData: any = await getProductData(250);

      // データあり
      if (categoryData.gids.length > 0 && productData.length > 0) {
        // カテゴリデータ登録/更新
        for await (const [i, data] of Object.entries(categoryData.gids)) {
          // 対象GID
          const cID = typeof data === 'string' ? data : String(data);
          // 対象データ数
          const categoryCnt: number = await countAssets('category', ['categorygid', 'usable'], [[cID], [0, 1]]);
          // 登録なし
          if (categoryCnt == 0) {
            // カテゴリ登録
            await insertData('category', ['categorygid', 'categoryname', 'display', 'usable'], [cID, categoryData.names[i], 1, 1]);
          } else {
            // カテゴリ更新
            await updateData('category', ['categorygid', 'usable'], [cID, 1], ['categoryname', 'usable'], [categoryData.names[i], 1]);
          };
        };

        // 商品データ登録
        for await (const [j, _] of Object.entries(productData)) {
          // 取得データ
          const pdGid: string = productData[j].id; // 商品ID
          const pdName: string = productData[j].title; // 商品名
          const pdStock: number = productData[j].totalInventory; // 在庫数
          const pdDetail: string = productData[j].description; // 商品詳細
          const pdHtmlDetail: string = productData[j].descriptionHtml; // 商品詳細(HTML)
          const pdImgPath: string = productData[j].featuredImage.url; // 商品画像URL
          const pdCategory: string = productData[j].category.name; // カテゴリ名
          const pdPrice: number = Math.floor(productData[j].priceRange.maxVariantPrice.amount); // 価格
          // 商品登録数カウント
          const pdCount: number = await countAssets('product', ['productgid', 'usable'], [[pdGid], [1]]);

          // 登録なし
          if (pdCount == 0) {
            // 全カテゴリ
            const tmpCategories: any = await selectAsset('category', ['categoryname', 'usable'], [[pdCategory], [1]]);
            // 重複有
            if (tmpCategories.length > 1) {
              // エラー
              throw new Error('insertData: duplicate insert error');
            }
            // 重複有
            if (tmpCategories[0]) {
              // 商品登録
              await insertData('product', ['category_id', 'productgid', 'productname', 'stock', 'detailhtml', 'description', 'imagepath', 'pricerange', 'display', 'usable'], [tmpCategories[0].id, pdGid, pdName, pdStock, pdHtmlDetail, pdDetail, pdImgPath, pdPrice, 1, 1]);
            }

          } else {
            // 商品更新
            await updateData('product', ['productgid', 'usable'], [pdGid, 1], ['productname', 'stock', 'detailhtml', 'description', 'imagepath', 'pricerange', 'display', 'usable'], [pdName, pdStock, pdHtmlDetail, pdDetail, pdImgPath, pdPrice, 1, 1]);
          }
        };
        await setTimeout(500);
        logger.info('manage: init completed');
      } else {
        logger.info('manage: no shopify data');
      }
      // 完了
      res.render('manage/complete_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: '完了', // タイトル
        message: '初期化が完了しました。', // メッセージ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // カテゴリアップデート
  router.post('/category', async (req: any, res: any) => {
    try {
      logger.info('manage: category reg connected');
      // 受信データ
      const allCtIds: any = req.body.id ?? null; // ID
      const imageUrls: any = req.body.imageurl; // 画像url
      const engNames: any = req.body.englishname; // 英語名
      const contexts: any = req.body.context; // コンテンツ
      const chkIndexes: any = req.body.check; // 掲載
      const rankings: any = req.body.ranking; // ランキング
      // 登録アリ
      if (allCtIds.length > 0) {
        // カテゴリデータ登録
        for await (const [i, _] of Object.entries(allCtIds)) {
          // 取得データ
          const ctId: number = Number(allCtIds[i]); // カテゴリID
          const imageUrl: string = imageUrls[i]; // 画像url
          const englishName: string = engNames[i]; // 英語名
          const context: string = contexts[i]; // 説明文
          const rank: number = Number(rankings[i]); // ランキング
          // 掲載対象
          const tmpCheckId: number = extractChecked(chkIndexes, ctId);
          // カテゴリ更新
          await updateData('category', ['id', 'usable'], [ctId, 1], ['englishname', 'context', 'imagepath', 'ranking', 'display', 'usable'], [englishName, context, imageUrl, rank, tmpCheckId, 1]);
        };
        await setTimeout(500);
      }
      logger.info('manage: category reg completed');
      // 完了
      res.render('manage/complete_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: '完了', // タイトル
        message: 'カテゴリ更新が完了しました。', // メッセージ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // 商品アップデート
  router.post('/product', async (req: any, res: any) => {
    try {
      logger.info('manage: product reg connected');
      // 受信データ
      const allPdIds: any = req.body.id; // 全ID
      const pdorder: any = req.body.pdorder; // 表示順
      const recomChkIdxes: any = req.body.check1; // おすすめ
      const latestChkIdxes: any = req.body.check2; // 新商品
      const printingChkIdxes: any = req.body.check3; // 名入れ
      const displayChkIdxes: any = req.body.check; // 掲載
      const variantids: string[] = req.body.variantid; // variID
      const rankings: string[] = req.body.ranking; // ランキング
      // 登録アリ
      if (allPdIds.length > 0) {
        // 商品データ登録
        for await (const [i, _] of Object.entries(allPdIds)) {
          // 取得データ
          const order: number = Number(pdorder[i]); // 表示順
          const pdId: number = Number(allPdIds[i]); // 商品ID
          const variant: string = variantids[i]; // バリアントID
          const rank: number = Number(rankings[i]); // ランキング
          // 数値のみ
          const tmpCheckId1: number = extractChecked(recomChkIdxes, pdId);
          const tmpCheckId2: number = extractChecked(latestChkIdxes, pdId);
          const tmpCheckId3: number = extractChecked(displayChkIdxes, pdId);
          const tmpCheckId4: number = extractChecked(printingChkIdxes, pdId);
          // 商品更新
          await updateData('product', ['id', 'usable'], [pdId, 1], ['variantid', 'printing', 'recommend', 'latest', 'display', 'ranking', 'pdorder'], [variant, tmpCheckId4, tmpCheckId1, tmpCheckId2, tmpCheckId3, rank, order]);
        }
        await setTimeout(2000);
      }
      logger.info('manage: product reg completed');
      // 完了
      res.render('manage/complete_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: '完了', // タイトル
        message: '商品更新が完了しました。', // メッセージ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // レビュー
  router.post('/review', async (req: any, res: any) => {
    try {
      logger.info('manage: review reg connected');
      // 受信データ
      const allRevIds: any = req.body.id; // レビュー
      const chkIdxes: any = req.body.check; // インデックス
      // 登録アリ
      if (allRevIds.length > 0) {
        // レビューインデックス
        for await (const [i, _] of Object.entries(allRevIds)) {
          // 取得データ
          const revId: number = Number(allRevIds[i]); // レビューID
          // 追加対象
          const tmpCheckId: number = extractChecked(chkIdxes, revId);
          // 削除対象
          //const tmpDelId: number = 1 - extractChecked(allRevIds, revId);
          // レビュー追加
          await updateData('review', ['id', 'usable'], [revId, 1], ['display'], [tmpCheckId]);
        };
        await setTimeout(500);
      }
      logger.info('manage: review reg completed');
      // 完了
      res.render('manage/complete_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: '完了', // タイトル
        message: 'レビュー登録が完了しました。', // メッセージ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // ニュースアップデート
  router.post('/editnews', async (req: any, res: any) => {
    try {
      logger.info('manage: news edit connected');
      // 受信データ
      const reqIds: any = req.body.id; // ID
      const reqDates: any = req.body.date; // 日付
      const reqTitles: any = req.body.title; // タイトル
      const reqContexts: any = req.body.context; // ニュース
      const reqImageUrls: any = req.body.image; // 画像url
      const checkedIndex: any = req.body.check; // 掲載
      const delIndexes: any = req.body.delete; // 削除
      // 登録アリ
      if (reqIds.length > 0) {
        // ニュースインデックス
        for await (const [i, _] of Object.entries(reqIds)) {
          // 取得データ
          const tmpId: number = Number(reqIds[i]); // ID
          const date: string = reqDates[i]; // インデックス
          const title: string = reqTitles[i]; // タイトル
          const context: string = reqContexts[i]; // ニュース内容
          const imageUrl: string = reqImageUrls[i]; // 画像url
          // 掲載対象
          const tmpCheckId: number = extractChecked(checkedIndex, tmpId);
          // 削除対象
          const tmpDelId: number = 1 - extractChecked(delIndexes, tmpId);
          // ニュース更新
          await updateData('news', ['id', 'usable'], [tmpId, 1], ['title', 'context', 'date', 'imageurl', 'display', 'usable'], [title, context, date, imageUrl, tmpCheckId, tmpDelId]);
        }
        await setTimeout(500);
      }
      logger.info('manage: news edit completed');
      // 完了
      res.render('manage/complete_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: '完了', // タイトル
        message: 'ニュース編集が完了しました。', // メッセージ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // ニュース登録
  router.post('/registnews', async (req: any, res: any) => {
    try {
      logger.info('manage: news reg connected');
      // 受信データ
      const reqDates: any = req.body.date; // 日付
      const reqTitles: any = req.body.title; // タイトル
      const reqContexts: any = req.body.context; // ニュース内容
      // ニュースインデックス
      // 取得データ
      const date: string = reqDates; // インデックス
      const title: string = reqTitles; // タイトル
      const context: string = reqContexts; // ニュース内容
      // ニュース登録
      await insertData('news', ['title', 'context', 'date', 'display', 'usable'], [title, context, date, , 0, 1]);
      await setTimeout(500);
      logger.info('manage: news reg completed');
      // 完了
      res.render('manage/complete_manage.ejs', {
        root: globalServerUrl, // ルートURL
        title: '完了', // タイトル
        message: 'ニュース登録が完了しました。', // メッセージ
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // チェック対象抽出関数
  const extractChecked = (array: string[], id: number): number => {
    // 数値のみ
    if (typeof id === "number" && array) {
      if (array.includes(String(id))) {
        return 1;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }
  return router;
}