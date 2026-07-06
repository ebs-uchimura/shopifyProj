/**
 * memberroutes.ts
 *
 * route：会員ルーティング用
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
import NodeCache from "node-cache"; // キャッシュ用
import Logger from "../class/Logger"; // ログ用
import Crypto from "../class/Crypto0616"; // 暗号化用
// モジュール読込
import { selectAsset, selectJoinAsset, updateData, insertData } from "../modules/mysqlModule";
import { regetCartNum } from "../modules/regetModule";
// Shopify読込
import { createCartWithItem, getAllCart } from "../modules/shopifyConsumerModule";
// 認証読込
import { isAuthenticated } from "../modules/passportModule";
// 変数定義
const globalLogLevel: string = myDevConst.LOG_LEVEL; // ログレベル
const globalAppName: string = myDevConst.APP_NAME!; // アプリ名
const globalDefaultUrl: string = myDevConst.DEFAULT_URL; // 基本URL
// ロガー設定
const logger: Logger = new Logger(myDevConst.COMPANY_NAME, globalAppName, globalLogLevel);
// キャッシュ設定
const cacheMaker: NodeCache = new NodeCache();
// 暗号化用
const FIXED_PEPEER: string = globals.CRYPTO_PEPPER!;
// 暗号化設定
const cryptoMaker: Crypto = new Crypto(logger, null, FIXED_PEPEER);

// 会員ルータ
export const memberRouter = () => {
  // ルータ
  const router: any = Router();

  /// get
  // 買い物かご
  router.get("/cart", async (req: any, res: any) => {
    try {
      logger.debug("member: cart started");
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // エラーメッセージ
      let tmpErrMessage: string;
      // 買い物かご
      let tmpUserCart: any;
      // バリアント
      let tmpUserVariant: any;
      // ボトル名入れ
      let tmpBottlePrinting: any;
      // グラス名入れ
      let tmpGlassPrinting: any;
      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error("cart: no session");
      }
      // エラークエリ
      const errorMsg: any = req.query.error;
      // エラーありならエラーメッセージ表示
      if (errorMsg == "1") {
        tmpErrMessage = myDevConst.ERROR_MESSAGE;
      } else {
        tmpErrMessage = "";
      }
      console.log(!req.session.key);
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        // セッション追加
        req.session.key = randomkey;
      }
      // セッションID
      const sessionId: any = req.session.key;
      // データ無し
      if (!sessionId) {
        // エラー
        throw new Error("cart: no session id");
      }
      // カート
      tmpUserCart = await selectJoinAsset("tmpcart", "product", "product_id", ["session", "usable"], [[sessionId], [1]], ["usable"], [[1]], ["tmpcart.price", "tmpcart.amount", "product.id", "product.productname", "product.imagepath1"]);
      // ボトル名入れ
      tmpBottlePrinting = await selectJoinAsset("tmpcart", "printing", "bottleprinting_id", ["session", "usable"], [[sessionId], [1]], ["usable"], [[1]], ["printing.font_id", "printing.name"]);
      // グラス名入れ
      tmpGlassPrinting = await selectJoinAsset("tmpcart", "printing", "glassprinting_id", ["session", "usable"], [[sessionId], [1]], ["usable"], [[1]], ["printing.font_id", "printing.name"]);

      // フォント一覧
      const fontIds: any = await selectAsset("font", ["usable"], [[1]]);
      // フォント名一覧
      const fontNames: string[] = fontIds.map((font: any) => font.fontname);
      // カート数
      const myCartNums: any = regetCartNum(false, req);
      // 0.5秒待機
      await setTimeout(500);
      logger.debug("member: cart completed");
      // 買い物かご
      res.render("my/cart.ejs", {
        root: globalDefaultUrl, // ルートURL
        cartitems: tmpUserCart, // カート
        bottle: tmpBottlePrinting, // ボトル名入れ
        glass: tmpGlassPrinting, // グラス名入れ
        login: false, // ログイン
        cartno: myCartNums, // 注文数
        fonts: fontNames.reverse(), // フォント一覧
        message: tmpErrMessage, // メッセージ
      });

    } catch (e) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // マイページ
  router.get("/mypage", isAuthenticated, async (req: any, res: any) => {
    try {
      logger.debug("member: mypage started");
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
      // カート数
      const myCartNums: any = regetCartNum(loggedIn, req);
      // 0.5秒待機
      await setTimeout(500);

      // マイページ表示
      res.render("my/mypage.ejs", {
        root: globalDefaultUrl, // ルートURL
        myorders: [],
        myAddress: "",
        login: true,
        cartno: myCartNums // カート数
      });
      logger.debug("member: mypage completed");

    } catch (e) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  /// post
  // 買い物かごイン
  router.post("/cart", async (req: any, res: any) => {
    try {
      logger.debug("member: cart reg started");
      // セッション追加
      logger.trace(req.session);
      // 最終ID
      let finalId: any;
      // 最終バリアントID
      let finalVariantId: any;
      // 商品価格
      let pdPrice: number = 0;
      // ボトル名入れID
      let bottlePrintingId: any = null;
      // グラス名入れID
      let glassPrintingId: any = null;
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        // セッション追加
        req.session.key = randomkey;
      }
      // 商品ID
      const productId: any = req.body.pid ?? "";
      // 数量
      const buyingNum: any = req.body.num ?? "";
      // ボトル名入れフォント
      const pdBottleFont: any = req.body.bottlefont ?? "";
      // ボトル名入れ文字列
      const pdBottlePrinting: any = req.body.bottleprinting ?? "";
      // グラス名入れフォント
      const pdGlassFont: any = req.body.glassfont ?? "";
      // グラス名入れ文字列
      const pdGlassPrinting: any = req.body.glassprinting ?? "";
      // 単独バリアントID
      const productVariantId: any = req.body.variantid ?? "";
      // 複数バリアントID
      const productVariantIds: any = req.body.variantids ?? "";

      if (productVariantIds) {
        finalVariantId = productVariantIds;
      } else {
        finalVariantId = productVariantId;
      }
      // データ無し
      if (buyingNum == "" || productId == "") {
        // エラー
        throw new Error("regcart: no necessary data");
      }
      // 商品ID
      const pdNumId: number = Number(sanitizeHtml(productId));
      // 数量
      const buyingAmount: number = Number(sanitizeHtml(buyingNum));

      // 商品バリアント
      const pdVariant = await selectAsset("variants", ["id", "usable"], [[Number(finalVariantId)], [1]]);
      // 結果無し
      if (pdVariant.length > 0) {
        // 商品価格
        pdPrice = Number(pdVariant[0].price);
      } else {
        throw new Error("regcart: not num");
      }
      // ボトル名入れ有り
      if (pdBottleFont != "" && pdBottlePrinting != "") {
        // ボトル名入れ登録
        bottlePrintingId = await insertData("printing", ["font_id", "paperid", "name", "usable"], [Number(sanitizeHtml(pdBottleFont)), 1, sanitizeHtml(pdBottlePrinting), 1]);
        logger.debug(`regcart: bottle printingID:${bottlePrintingId} reg started`);
      }
      // グラス名入れ有り
      if (pdGlassFont != "" && pdGlassPrinting != "") {
        // グラス名入れ登録
        glassPrintingId = await insertData("printing", ["font_id", "paperid", "name", "usable"], [Number(sanitizeHtml(pdGlassFont)), 2, sanitizeHtml(pdGlassPrinting), 1]);
        logger.debug(`regcart: glass printingID:${glassPrintingId} reg started`);
      }
      // セッションID
      const sessionId: any = req.session.key;
      // セッションIDなし
      if (!sessionId) {
        throw new Error("regcart: no session id");
      }
      // カート
      const tmpSessionCart = await selectAsset("tmpcart", ["product_id", "variant_id", "session", "usable"], [[pdNumId], [sanitizeHtml(productVariantId)], [sessionId], [1]]);
      // 空なら追加
      if (tmpSessionCart.length == 0) {
        // カート登録
        finalId = await insertData("tmpcart", ["product_id", "variant_id", "session", "bottleprinting_id", "glassprinting_id", "price", "amount", "usable"], [pdNumId, productVariantId, sessionId, bottlePrintingId, glassPrintingId, pdPrice, buyingAmount, 1]);
      } else {
        // 数量設定
        const fixedAmout: number = tmpSessionCart[0].amount + buyingAmount;
        // カート更新
        finalId = await updateData("tmpcart", ["product_id", "variant_id", "session", "usable"], [pdNumId, sanitizeHtml(productVariantId), sessionId, 1], ["price", "amount"], [pdPrice, fixedAmout]);
      }
      logger.debug("member: cart reg completed");
      // 2.5秒待機
      await setTimeout(2500);
      // ショッピングカート表示
      res.redirect("/my/cart");

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // 購入
  router.post("/buy", async (req: any, res: any) => {
    try {
      logger.debug("member: buy reg started");
      logger.trace(req.session);
      logger.trace(req.body);
      // shopify送付用
      let shopifyCart: any[] = [];
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        req.session.key = randomkey;
      }
      // 数量
      const buyingNum: any = req.body.amouts;
      // 商品ID
      const productId: any = req.body.pid;
      // null判定
      if (buyingNum.length == 0 || productId.length == 0) {
        throw new Error("buy: not number error");
      }
      // 商品IDを数値化
      let pidList: number[] = productId.map((pid: any) => {
        return Number(pid);
      })
      // 数量を数値化
      let numList: number[] = buyingNum.map((num: any) => {
        return Number(num);
      })
      // 合計数量
      const totalAmount: number = numList.reduce((accumulator: any, currentValue: any) => {
        return accumulator + currentValue;
      }, 0);
      // 合計が0
      if (totalAmount == 0) {
        logger.debug("member: total is 0");
        // ショッピングカート表示
        res.redirect("/my/cart?error=1");
      } else {
        // 商品バリアントID
        const pdVariantIds = await selectAsset("product", ["id", "display", "usable"], [pidList, [1], [1]], undefined, "id", ["variantid"]);
        // 成功
        if (pdVariantIds.length > 0) {
          // 数量
          for (let i = 0; i < pdVariantIds.length; i++) {
            // バリアントID
            const variantID: string = "gid://shopify/ProductVariant/" + pdVariantIds[i].variantid;
            // shopify送付用
            shopifyCart.push({
              merchandiseId: variantID,
              quantity: numList[i],
            });
          }
          // カートイン
          const createdCart: any = await createCartWithItem(shopifyCart);
          // カートID
          const cartId = createdCart.cartCreate.cart.id;
          // カートIDなし
          if (!cartId) {
            throw new Error("buy: cart creation error");
          }
          // セッションID
          const sessionId: any = req.session.key;
          // カートの中身
          const cartStatus = await getAllCart(cartId);
          // カート削除
          await updateData("tmpcart", ["session", "usable"], [sessionId, 1], ["usable"], [0]);
          // cache
          cacheMaker.set("checkoutUrl", cartStatus.cart.checkoutUrl);

        } else {
          // エラー
          throw new Error("buy: invalid variant id error");
        }
        // チェックアウトURL
        const tmpCheckout = cacheMaker.get("checkoutUrl") ?? "";
        // 1.5秒待機
        await setTimeout(1500);
        // 商品ページ表示
        res.send(JSON.stringify({ url: tmpCheckout }));
        logger.debug("member: buy completed");
      }

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // 買い物かごアウト
  router.post("/cartdel", async (req: any, res: any) => {
    try {
      logger.debug("member: cart delete started");
      logger.trace(req.session);
      logger.trace(req.body);
      // セッションID
      const sessionId: any = req.session.key;
      // 商品ID
      const productId: any = req.body.pid ?? "";
      // null判定
      if (productId == "") {
        throw new Error("cartdel: no necessary data");
      }
      // カート削除
      await updateData("tmpcart", ["product_id", "session", "usable"], [sanitizeHtml(productId), sessionId, 1], ["usable"], [0]);

      // 0.5秒待機
      await setTimeout(500);
      logger.debug("member: cartdel completed");
      // トップぺージリダイレクト
      res.redirect("/");

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // レビュー登録
  router.post("/review", async (req: any, res: any) => {
    try {
      logger.debug("member: review reg started");
      logger.trace(req.session);
      logger.trace(req.body);

      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error("review: no session");
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        // セッション設定
        req.session.key = randomkey;
      }
      // 商品ID
      const productId: any = req.body.pid ?? "";
      // レビュー☆数
      const stars: any = req.body.rating ?? "";
      // レビュワー名
      const reviewername: any = req.body.reviewername ?? "";
      // レビュー内容
      const comment: any = req.body.comment ?? "";
      // データ無し
      if (productId == "" || stars == "" || reviewername == "" || comment == "") {
        // エラー
        throw new Error("review: no necessary data");
      }
      // レビュー登録
      await insertData("review", ["product_id", "reviewername", "stars", "content", "display", "usable"], [sanitizeHtml(productId), sanitizeHtml(reviewername), sanitizeHtml(stars), sanitizeHtml(comment), 0, 1]);
      logger.debug("member: review reg completed");
      // トップぺージリダイレクト
      res.redirect(`/product/${productId}`);

    } catch (e: unknown) {
      logger.error(e);
      // 500番エラー
      res.render("error/error.ejs", {
        title: "500エラー", // タイトル
        message: "500 Internal Server Error"
      });
    }
  });

  // アカウント詳細
  router.post("/checkaddress", isAuthenticated, async (req: any, res: any) => {
    try {
      logger.debug("member: checkaddress started");
      logger.trace(req.session);
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        // セッション設定
        req.session.key = randomkey;
      }
      // カート数キャッシュ
      const tmpCartNum: number = await regetCartNum(false, req);
      // 0.5秒待機
      await setTimeout(500);
      logger.debug("member: checkaddress completed");
      // マイページ表示
      res.render("my/mypage.ejs", {
        myorders: [],
        myAddress: [],
        login: true,
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

  // ログアウト
  router.post("/logout", isAuthenticated, async (req: any, res: any) => {
    try {
      logger.debug("member: logout started");
      logger.trace(req.session);;
      // セッションなし
      if (!req.session.passport) {
        // エラー
        throw new Error("logout: no session");
      }
      // メール
      req.logout(async (_: any) => {
        logger.debug("member: logout completed");
        // 0.5秒待機
        await setTimeout(500);
        // トップぺージリダイレクト
        res.redirect("/");
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

  return router;
};