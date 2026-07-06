/**
 * routes.ts
 *
 * route：メインルーティング用
**/

"use strict";

/// 定数
// 名前空間
import { myDevConst } from "../consts/globalinfo";
import globals from "../consts/globalenv";
// モジュール定義
import { setTimeout } from "node:timers/promises"; // 待機用
import { Router } from "express"; // express用
import sanitizeHtml from "sanitize-html"; // sanitizer
import Logger from "../class/Logger"; // ログ用
import Crypto from "../class/Crypto0616"; // 暗号化用
// モジュール読込
import { selectAsset, selectJoinAsset, insertData } from "../modules/mysqlModule";
import { regetProduct, regetCategory, regetRecommendProduct, regetCartNum } from "../modules/regetModule";

// 開発モード
const globalMode: string = "development"; // 開発モード
const globalLogLevel: string = myDevConst.LOG_LEVEL; // ログレベル
const globalDefaultUrl: string = myDevConst.DEFAULT_URL; // 基本URL
const globalAppName: string = myDevConst.APP_NAME!; // アプリ名

// ロガー設定
const logger: Logger = new Logger(myDevConst.COMPANY_NAME, globalAppName, globalLogLevel);
// 暗号化用
const FIXED_PEPEER: string = globals.CRYPTO_PEPPER!;
// 暗号化設定
const cryptoMaker: Crypto = new Crypto(logger, null, FIXED_PEPEER);

// 一般ルータ
export const userRouter = () => {
  // ルータ
  const router: any = Router();
  /// get
  // トップページ
  router.get("/", async (req: any, res: any) => {
    try {
      logger.debug("top: top started");
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
        // セッション設定
        req.session.key = randomkey;
      }
      /// データ取得
      // 新商品
      const latestProducts = await selectJoinAsset("product", "category", "category_id", ["latest", "display", "usable"], [[1], [1], [1]], ["display", "usable"], [[1], [1]], ["product.id", "product.imagepath1", "productname", "categoryname", "product.description"], 3, "id", "product", true);
      // ランキング
      const rankingProducts = await selectAsset("product", ["ranking", "display", "usable"], [[1, 2, 3, 4, 5], [1], [1]], undefined, "id", ["id", "productname", "imagepath1"]);
      // ニュース
      const allNews: any = await selectAsset("news", ["display", "usable"], [[1], [1]], 4, "id", ["id", "date", "title", "imageurl", "context"]);
      // トップ画像
      const allTopImages: any = await selectAsset("topimg", ["display", "usable"], [[1], [1]], 3);
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();
      // おすすめ商品
      const allRecomProducts: any = await regetRecommendProduct();
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      // 1秒ウェイト
      await setTimeout(1000);
      logger.debug("top: top completed.");

      // トップページ表示
      res.render("index.ejs", {
        root: globalDefaultUrl, // ルートURL
        allcategories: allCategories, // 全カテゴリ
        allproducts: allproducts, // 全商品
        news: allNews, // ニュース
        recommend: allRecomProducts, // おススメ商品
        latest: latestProducts, // 新商品
        ranking: rankingProducts, // ランキング商品
        mode: globalMode, // モード
        login: loggedIn, // ログイン
        cartno: myCartNums, // カート数
        topimg: allTopImages, // トップ画像
      });

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // カテゴリ
  router.get("/category/:no", async (req: any, res: any) => {
    try {
      logger.debug("category: category started");
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
      const categoryNo: any = req.params.no ?? "";
      // データ無し
      if (categoryNo == "") {
        // エラー
        throw new Error("category: no necessary data");
      }
      /// データ取得
      // 商品NO
      const tmpCategoryNo: any = Number(categoryNo);
      // 商品
      const myProducts = await selectJoinAsset("product", "category", "category_id", ["display", "usable"], [[1], [1]], ["id", "display", "usable"], [[tmpCategoryNo], [1], [1]], ["product.id", "product.productgid", "product.category_id", "product.productname", "product.imagepath1", "product.imagepath2", "product.bottleprinting", "product.glassprinting", "category.context", "category.categoryname", "category.englishname"], undefined, "pdorder", "product", true);
      // 商品ID・価格修正作業
      if (myProducts.length > 0) {
        // 商品価格修正
        for (const product of myProducts) {
          // 商品NO
          product.padid = product.id.toString().padStart(4, "0");
          // バリアント
          const tmpVariant: any = await selectAsset("variants", ["productgid", "usable"], [[product.productgid], [1]]);
          // バリアント
          product.variants = tmpVariant;
        }
      } else if (myProducts.length > 1) {
        // 重複エラー
        throw new Error("category: duplicate product error");
      }
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品名
      const allproducts: any = await regetProduct();
      // カート数キャッシュ
      const tmpCartNum: number = await regetCartNum(loggedIn, req);
      // 1秒ウェイト
      await setTimeout(1000);
      logger.debug("category: category completed");

      // カテゴリ画面表示
      res.render("category.ejs", {
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
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー",
        message: "Internal Server Error",
      });
    }
  });

  // 商品
  router.get("/product/:no", async (req: any, res: any) => {
    try {
      logger.debug("product: product started");
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // 平均星数
      let average: number;
      // 平均星文字列
      let averageTxt: string;
      // バリアント
      let variantResult: any;
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
        // セッション追加
        req.session.key = randomkey;
      }
      // 商品NO
      const productNo: any = req.params.no ?? "";
      // データ無し
      if (productNo == "") {
        // エラー
        throw new Error("product: no necessary data");
      }
      /// データ取得
      // 商品NO
      const sanitizedProductNo: any = Number(productNo);
      // 商品
      const myProducts = await selectJoinAsset("product", "category", "category_id", ["id", "display", "usable"], [[sanitizedProductNo], [1], [1]], ["display", "usable"], [[1], [1]], ["product.id", "product.productgid", "product.category_id", "productname", "product.imagepath1", "product.imagepath2", "product.imagepath3", "product.imagepath4", "product.imagepath5", "product.imagepath6", "product.detailhtml", "product.bottleprinting", "product.glassprinting", "category.categoryname"], 1, "id", "product");
      // 商品ID・価格修正作業
      if (myProducts.length > 0) {
        // 商品NO
        myProducts[0].padid = myProducts[0].id.toString().padStart(4, "0");
        // 登録数カウント
        variantResult = await selectAsset("variants", ["productgid", "usable"], [[myProducts[0].productgid], [1]]);

      } else if (myProducts.length > 1) {
        // 重複エラー
        throw new Error("product: duplicate product error");
      } else {
        // 重複エラー
        throw new Error("product: no product error");
      }
      // レビュー
      const selectedReview: any = await selectAsset("review", ["product_id", "display", "usable"], [[sanitizedProductNo], [1], [1]], undefined, "id", ["id", "reviewername", "stars", "content", "updated_at"]);
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
      // 1秒ウェイト
      await setTimeout(1000);
      logger.debug("product: product completed");
      console.log(myProducts);
      // 商品ページ表示
      res.render("detail.ejs", {
        root: globalDefaultUrl, // ルートURL
        myproduct: myProducts[0], // 商品
        myVariants: variantResult, // バリアント
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
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // ニュース
  router.get("/newslist", async (req: any, res: any) => {
    try {
      logger.debug("newslist: newslist started");
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
      // ニュース
      const allNews: any = await selectAsset("news", ["display", "usable"], [[1], [1]], 1, "id", ["id", "date", "title", "imageurl", "context"]);
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      // 0.5秒ウェイト
      await setTimeout(500);
      logger.debug("news: news completed");

      // ニュース画面表示
      res.render("news.ejs", {
        root: globalDefaultUrl, // ルートURL
        news: allNews, // ニュース
        allproducts: allproducts, // 全商品
        allcategories: allCategories, // 全カテゴリ
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // ニュース
  router.get("/news/:no", async (req: any, res: any) => {
    try {
      logger.debug("news: news started");
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
      // ニュースNO
      const newsNo: any = req.params.no ?? "";
      // データ無し
      if (newsNo == "") {
        // エラー
        throw new Error("news: no necessary data");
      }
      // 検出用文字列
      const numberedNewsNo: any = Number(newsNo);
      // ニュース
      const myNews: any = await selectAsset("news", ["id", "display", "usable"], [[numberedNewsNo], [1], [1]], 1, "id", ["id", "date", "title", "imageurl", "context"]);
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      // 0.5秒ウェイト
      await setTimeout(500);
      logger.debug("news: news completed");

      // ニュース画面表示
      res.render("news.ejs", {
        root: globalDefaultUrl, // ルートURL
        news: myNews[0], // ニュース
        allproducts: allproducts, // 全商品
        allcategories: allCategories, // 全カテゴリ
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // 特定商取引法ページ
  router.get("/tokusho", async (req: any, res: any) => {
    try {
      logger.debug("tokusho: tokusho started");
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      // 特定商取引法ページ
      res.render("tokusho.ejs", {
        root: globalDefaultUrl, // ルートURL
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // プライバシーポリシーページ
  router.get("/privacy", async (req: any, res: any) => {
    try {
      logger.debug("privacy: privacy started");
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // カート数
      const myCartNums: any = await regetCartNum(loggedIn, req);
      // プライバシーポリシーページ
      res.render("privacy.ejs", {
        root: globalDefaultUrl, // ルートURL
        login: loggedIn, // ログイン
        cartno: myCartNums // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  /// post
  // 検索
  router.post("/search", async (req: any, res: any) => {
    try {
      logger.debug("search: search started");
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
      // 検索ワード
      const searchWd: any = req.body.search ?? "";
      // データ無し
      if (searchWd == "") {
        // エラー
        throw new Error("search: no necessary data");
      }
      // 検索商品名
      const searchedProductInfos = await selectAsset("product", ["*productname"], [[sanitizeHtml(searchWd)]]);
      // 商品ID・価格修正作業
      if (searchedProductInfos.length > 0) {
        // 商品価格修正
        for (const product of searchedProductInfos) {
          // 商品NO
          product.padid = product.id.toString().padStart(4, "0");
          // 登録数カウント
          const pdResult: any = await selectAsset("variants", ["productgid", "usable"], [[product.productgid], [1]]);
          // バリアント
          product.variants = pdResult;
        }
      } else if (searchedProductInfos.length > 1) {
        // 重複エラー
        throw new Error("category: duplicate product error");
      }
      // カテゴリ
      const allCategories: any = await regetCategory();
      // 商品
      const allproducts: any = await regetProduct();
      // カート数キャッシュ
      const tmpCartNum: number = await regetCartNum(loggedIn, req);
      // 1秒ウェイト
      await setTimeout(1000);
      logger.debug("search: search completed");
      // カテゴリ画面表示
      res.render("category.ejs", {
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
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // いいね登録
  router.post("/goodon", async (req: any, _: any) => {
    try {
      logger.trace("goodon: good reg started");
      logger.trace(req.body);
      // 受け取り商品ID
      // 商品ID
      const productId: any = req.body.id ?? "";
      // データ無し
      if (productId == "") {
        // エラー
        throw new Error("goodon: no necessary data");
      }
      // いいね登録
      await insertData("favorite", ["product_id", "user_id", "usable"], [Number(sanitizeHtml(productId)), undefined, 1]);
      logger.trace("goodon: good reg completed");

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // いいね削除
  router.post("/goodoff", async (req: any, _: any) => {
    try {
      logger.trace("goodoff: goodoff started");
      logger.trace(req.body);
      // 商品ID
      const productId: any = req.body.id ?? "";
      // データ無し
      if (productId == "") {
        // エラー
        throw new Error("goodoff: no necessary data");
      }
      // いいね登録
      await insertData("favorite", ["product_id", "usable"], [sanitizeHtml(productId), 0]);
      logger.trace("goodoff: goodoff completed");

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  return router;
};