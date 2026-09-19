/**
 * routes.ts
 *
 * route：メインルーティング用
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
let globalMode: string; // モード名
let globalEnvfileName: string; // 環境ファイル名
let globalLogLevel: string; // ログレベル
let globalDefaultUrl: string; // デフォルトURL

// モジュール定義
import * as path from 'node:path'; // path用
import { setTimeout } from 'node:timers/promises'; // 待機用
import { Router } from 'express'; // express用
import sanitizeHtml from 'sanitize-html'; // サニタイザ
import { config as dotenv } from 'dotenv'; // 環境変数用
import Logger from '../class/Logger'; // ログ用
import Crypto from '../class/Crypto0616'; // 暗号化用
// モジュール読込
import { selectAsset, selectJoinAsset, insertData } from '../modules/mysqlModule';
import { regetProduct, regetCategory, regetRecommendProduct, regetCartNum } from '../modules/regetModule';

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalMode = 'local'; // 開発モード
  globalEnvfileName = '../.localenv'; // 環境変数ファイル
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myLocalDevConst.DEFAULT_URL; // 基本URL
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalMode = 'development'; // 開発モード
  globalEnvfileName = '../.devenv'; // 環境変数ファイル
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myDevConst.DEFAULT_URL; // 基本URL
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  // 本番モード
} else {
  globalMode = 'production'; // 本番モード
  globalEnvfileName = '../.env'; // 環境変数ファイル
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myConst.DEFAULT_URL; // 基本URL
  globalAppName = myConst.APP_NAME!; // アプリ名
}
// 環境変数設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// ロガー設定
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// 暗号化用
const FIXED_PEPEER: string = process.env.CRYPTO_PEPPER!;
// 暗号化設定
const cryptoMaker: Crypto = new Crypto(logger, null, FIXED_PEPEER);

// 一般ルータ
export const userRouter = () => {
  // ルータ
  const router: any = Router();
  /// get
  // トップページ
  router.get('/', async (req: any, res: any) => {
    try {
      logger.debug('top: top started');
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        req.session.key = randomkey;
      }
      /// データ取得
      // 新商品
      const latestProducts = await selectJoinAsset('product', 'category', ['latest', 'display', 'usable'], [[1], [1], [1]], ['display', 'usable'], [[1], [1]], 3, 'id', 'product', ['product.id', 'product.imagepath', 'productname', 'categoryname', 'product.description'], true);
      // ランキング
      const rankingProducts = await selectAsset('product', ['ranking', 'display', 'usable'], [[1, 2, 3, 4, 5], [1], [1]], undefined, 'id', ['id', 'productname', 'imagepath']);
      // ニュース
      const allNews: any = await selectAsset('news', ['display', 'usable'], [[1], [1]], 4, 'id', ['id', 'date', 'title', 'imageurl', 'context']);
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();
      // おすすめ商品
      const allRecomProducts: any = await regetRecommendProduct();
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      await setTimeout(1000);
      logger.debug('top: top completed.');

      // トップページ表示
      res.render('index', {
        root: globalDefaultUrl, // ルートURL
        allcategories: allCategories, // 全カテゴリ
        allproducts: allproducts, // 全商品
        news: allNews, // ニュース
        recommend: allRecomProducts, // おススメ商品
        latest: latestProducts, // 新商品
        ranking: rankingProducts, // ランキング商品
        mode: globalMode, // モード
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'DBエラー', // タイトル
        message: 'DB抽出エラー' // メッセージ
      });
    }
  });

  // カテゴリ
  router.get('/category/:no', async (req: any, res: any) => {
    try {
      logger.debug('category: category started');
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        // セッション追加
        req.session.key = randomkey;
      }
      // カテゴリNO
      const categoryNo: any = sanitizeHtml(req.params.no);
      // データ無し
      if (categoryNo == '') {
        throw new Error('category: no necessary data');
      }
      /// データ取得
      // 商品NO
      const sanitizedCategoryNo: any = Number(sanitizeHtml(categoryNo));
      // 商品
      const myProducts = await selectJoinAsset('product', 'category', ['display', 'usable'], [[1], [1]], ['id', 'display', 'usable'], [[sanitizedCategoryNo], [1], [1]], undefined, 'pdorder', 'product', ['product.id', 'product.category_id', 'productname', 'product.imagepath', 'pricerange', 'context', 'category.categoryname', 'englishname'], true);
      // 商品ID・価格修正作業
      if (myProducts.length > 0) {
        // 商品価格修正
        myProducts.forEach((pd: any) => {
          // 商品NO
          pd.padid = pd.id.toString().padStart(4, '0');
          // 価格を桁表示に
          pd.pricerange = pd.pricerange.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
        });
      } else if (myProducts.length > 1) {
        // 重複エラー
        throw new Error('category: duplicate product error');
      }
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品名
      const allproducts: any = await regetProduct();
      // カート数キャッシュ
      const tmpCartNum: number = await regetCartNum(loggedIn, req);
      await setTimeout(1000);
      logger.debug('category: category completed');

      // カテゴリ画面表示
      res.render('category', {
        root: globalDefaultUrl, // ルートURL
        myproducts: myProducts, // 商品
        allcategories: allCategories, // 全カテゴリ
        allproducts: allproducts, // 全商品
        search: false, // 検索フラグ
        login: loggedIn, // ログイン
        cartno: tmpCartNum // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'DBエラー', // タイトル
        message: 'DB抽出エラー' // メッセージ
      });
    }
  });

  // 商品
  router.get('/product/:no', async (req: any, res: any) => {
    try {
      logger.debug('product: product started');
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // 平均星数
      let average: number;
      // 平均星文字列
      let averageTxt: string;
      // カテゴリ
      let reviewStarNo: number[] = [];
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        req.session.key = randomkey;
      }
      // 商品NO
      const productNo: any = sanitizeHtml(req.params.no);
      // データ無し
      if (productNo == '') {
        throw new Error('product: no necessary data');
      }
      /// データ取得
      // 商品NO
      const sanitizedProductNo: any = Number(productNo);
      // 商品
      const myProducts = await selectJoinAsset('product', 'category', ['id', 'display', 'usable'], [[sanitizedProductNo], [1], [1]], ['display', 'usable'], [[1], [1]], 1, 'id', 'product', ['product.id', 'product.category_id', 'productname', 'product.pricerange', 'product.imagepath', 'product.detailhtml', 'product.printing', 'category.categoryname']);
      // 商品ID・価格修正作業
      if (myProducts.length > 0) {
        // 商品NO
        myProducts[0].padid = myProducts[0].id.toString().padStart(4, '0');
        // 価格を桁表示に
        myProducts[0].pricerange = myProducts[0].pricerange.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });

      } else if (myProducts.length > 1) {
        // 重複エラー
        throw new Error('product: duplicate product error');
      }
      // レビュー
      const selectedReview: any = await selectAsset('review', ['product_id', 'display', 'usable'], [[sanitizedProductNo], [1], [1]], undefined, 'id', ['id', 'reviewername', 'stars', 'content', 'updated_at']);
      // レビューあり
      if (selectedReview.length > 0) {
        // レビュー星数
        const reviewStars: number[] = selectedReview.map((rv: any) => {
          return rv.stars;
        });
        // レビュー数
        for (let i = 1; i < 6; i++) {
          reviewStarNo.push(reviewStars.filter((star: number) => star === i).length);
        }
        // レビュー合計
        const sum: number = reviewStars.reduce(function (acc: number, cur: number) {
          return acc + cur;
        });
        // レビュー平均
        average = sum / reviewStars.length;
        averageTxt = String(Math.round(average * 2 / 1) * 1 / 2);
        // 投稿日時更新作業
        selectedReview.map((pd: any) => {
          // カット
          pd.updated_at = new Date(pd.updated_at).toISOString().slice(0, 10);
        });
      } else {
        // 空設定
        average = 0;
        averageTxt = "";
      }
      // レビューCSS
      const finalStars: string = reviewStarNo.reverse().join(",");
      // レビューCSS
      const finalAverage: string = average.toFixed(1);
      // レビューCSS
      const finalAverageTxt: string = averageTxt.replace(".", "-");
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品名
      const allproducts: any = await regetProduct();
      // おススメ商品
      const allRecomProducts: any = await regetRecommendProduct();
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      await setTimeout(1000);
      logger.debug('product: product completed');

      console.log(finalStars);
      // 商品ページ表示
      res.render('detail', {
        root: globalDefaultUrl, // ルートURL
        myproduct: myProducts[0], // 商品
        allcategories: allCategories, // 全カテゴリ
        allproducts: allproducts, // 全商品
        recommend: allRecomProducts, // おススメ商品
        review: selectedReview, // レビュー
        stars: finalStars, // ☆数
        average: finalAverage, // レビュー平均
        averagetext: finalAverageTxt, // レビューCSS
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'DBエラー', // タイトル
        message: 'DB抽出エラー' // メッセージ
      });
    }
  });

  // ニュース
  router.get('/news/:no', async (req: any, res: any) => {
    try {
      logger.debug('news: news started');
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        req.session.key = randomkey;
      }
      // ニュースNO
      const newsNo: any = sanitizeHtml(req.params.no);
      // データ無し
      if (newsNo == '') {
        throw new Error('news: no necessary data');
      }
      // 検出用文字列
      const sanitizedNewsNo: any = Number(sanitizeHtml(newsNo));
      // ニュース
      const myNews: any = await selectAsset('news', ['id', 'display', 'usable'], [[Number(sanitizedNewsNo)], [1], [1]], 1, 'id', ['id', 'date', 'title', 'imageurl', 'context']);
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      await setTimeout(500);
      logger.debug('news: news completed');

      // カテゴリ画面表示
      res.render('news', {
        root: globalDefaultUrl, // ルートURL
        news: myNews, // ニュース
        category: allCategories, // カテゴリ
        productnames: allproducts, // 商品名
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'DBエラー', // タイトル
        message: 'DB抽出エラー' // メッセージ
      });
    }
  });

  /// post
  // 検索
  router.post('/search', async (req: any, res: any) => {
    try {
      logger.debug('search: search started');
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        req.session.key = randomkey;
      }
      // 検索ワード
      const searchWd: any = sanitizeHtml(req.body.search);
      // データ無し
      if (searchWd == '') {
        throw new Error('search: no necessary data');
      }
      // 検索商品名
      const searchedProductInfos = await selectAsset('product', ['*productname'], [[searchWd]]);
      // 商品ID・価格修正作業
      if (searchedProductInfos.length > 0) {
        // 商品価格修正
        searchedProductInfos.forEach((pd: any) => {
          // 価格を桁表示に
          pd.pricerange = pd.pricerange.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
        });
      } else if (searchedProductInfos.length > 1) {
        // 重複エラー
        throw new Error('category: duplicate product error');
      }
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();

      // カート数キャッシュ
      const tmpCartNum: number = await regetCartNum(loggedIn, req);
      await setTimeout(1000);
      logger.debug('search: search completed');

      // カテゴリ画面表示
      res.render('category', {
        root: globalDefaultUrl, // ルートURL
        myproducts: searchedProductInfos, // 検索商品
        allcategories: allCategories, // カテゴリ
        allproducts: allproducts, // 全商品
        search: true, // 検索フラグ
        login: loggedIn, // ログイン
        cartno: tmpCartNum // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'エラー', // タイトル
        message: '検索エラー' // メッセージ
      });
    }
  });

  // いいね登録
  router.post('/goodon', async (req: any, _: any) => {
    try {
      logger.trace('goodon: good reg started');
      logger.trace(req.session);
      logger.trace(req.body);
      // 商品ID
      const productId: any = sanitizeHtml(JSON.parse(req.body.id));
      // データ無し
      if (productId == '') {
        throw new Error('goodon: no necessary data');
      }
      // いいね登録
      await insertData('favorite', ['product_id', 'user_id', 'usable'], [Number(productId), undefined, 1]);
      logger.trace('goodon: good reg completed');

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // いいね削除
  router.post('/goodoff', async (req: any, _: any) => {
    try {
      logger.trace('goodoff: goodoff started');
      logger.trace(req.session);
      logger.trace(req.body);
      // 商品ID
      const productId: any = sanitizeHtml(JSON.parse(req.body.id));
      // データ無し
      if (productId == '') {
        throw new Error('goodoff: no necessary data');
      }
      // いいね登録
      await insertData('favorite', ['product_id', 'usable'], [productId, 0]);
      logger.trace('goodoff: goodoff completed');

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  return router;
};