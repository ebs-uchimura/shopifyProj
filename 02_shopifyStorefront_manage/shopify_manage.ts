/**
 * shopify_manage.ts
 **
 * function：Shopify 管理画面 API アプリ
 **/

"use strict";

/// 定数
// 名前空間 
import { myVariable, myConst, myDevConst } from "./consts/globalvariables";
import { isAdminAuthenticated } from "./modules/passportModule";
import globals from "./consts/globalenv";
// 可変要素
let globalAppName: string; // アプリ名
let globalLogLevel: string; // ログレベル
let globalDefaultUrl: string; // デフォルトURL

/// モジュール
import * as path from "node:path"; // パス設定用
import { copyFile } from "node:fs/promises"; // fs(promise)
import passport from "passport"; // ログイン用
import { setTimeout } from "node:timers/promises"; // 待機用
import fileUpload from "express-fileupload"; // ファイルアップロード用
import helmet from "helmet"; // cors対策
import sanitizeHtml from "sanitize-html"; // sanitizer
import cookieParser from "cookie-parser"; // クッキー用
import express from "express"; // express用
import * as adminPassportStrategy from "passport-local"; // 管理者ログイン用
import * as session from "express-session"; // セッション用
import mysqlSession from "express-mysql-session"; // セッションDB設定用
import Logger from "./class/Logger"; // ロガー用

// 開発モード
if (myVariable.DEV_FLG) {
  globalAppName = myDevConst.APP_NAME; // アプリ名
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myDevConst.DEFAULT_URL; // 基本URL
  // 本番モード
} else {
  globalAppName = myConst.APP_NAME; // アプリ名
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  globalDefaultUrl = myConst.DEFAULT_URL; // 基本URL

}
// MYSQL読込
import { countAssets, selectAsset, selectJoinAsset, updateData, insertData } from "./modules/mysqlModule"; // DB用
// Shopify読込
import { getProductData, getCategoryData } from "./modules/shopifyAdminModule";
// express設定
const MySQLStore: any = mysqlSession(session.default);
// ロガー設定
const logger: Logger = new Logger(myVariable.COMPANY_NAME, globalAppName, globalLogLevel);
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
  checkExpirationInterval: 900000,
  expiration: 86400000,
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
  connectionLimit: 2,
});

/// express設定
const app: any = express();
// 通常設定
app.set("views", path.join(__dirname, "views"));
// ejsテンプレート使用
app.set("view engine", "ejs");
// 事前設定読込
app.locals.pluralize = require("pluralize");
// json設定
app.use(express.json());
// body設定
app.use(
  express.urlencoded({
    extended: true, // フォーム受信可
  })
);
// ファイルアップロード
app.use(fileUpload());
// クッキー使用
app.use(cookieParser());
// publicフォルダ設定
app.use(express.static(path.join(__dirname, "public")));
// セッション設定
app.use(session.default({
  secret: globalSecretString,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
}));
// パスポート認証
app.use(passport.authenticate("session"));
// ヘルメット使用
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com", "code.jquery.com", "ajax.googleapis.com", "cdn.jsdelivr.net", "unpkg.com"],
      "img-src": ["'self'", "code.jquery.com", "cdn.shopify.com", "data: image:"],
      "connect-src": ["'self'", "unpkg.com", "compass-linq.myshopify.com"]
    },
  },
}));

// パスポート設定(管理者)
passport.use("adminLocal", new adminPassportStrategy.Strategy({
  usernameField: "usermail", // 管理者メール
  passwordField: "password" // 管理者パスワード
}, async function (usermail: string, password: string, cb: any) {
  // 該当管理者抽出
  const targetAdmin: any = await selectAsset("admin", ["adminmail", "usable"], [[usermail], [1]]);
  // 登録なし
  if (targetAdmin.length == 0) {
    // 登録なしエラー
    throw new Error("passport: no admin user");
  }
  // 認証チャレンジ
  if (password === targetAdmin[0].password) {
    // 認証成功
    logger.debug("login success");
    return cb(null, { id: targetAdmin[0].id, role: "admin" });
  } else {
    // 認証失敗
    logger.error("login fail");
  }
}));

// ユーザ情報をセッションへ保存
passport.serializeUser((user: any, done: any) => {
  done(null, user);
});
// IDからユーザ情報を取得
passport.deserializeUser(async (user: any, done: any) => {
  // 該当ユーザ抽出
  const targetUser: any = await selectAsset(user.role, ["id", "usable"], [[user.id], [1]]);
  done(null, targetUser);
});

/// get
// 管理画面トップ
app.get("/", isAdminAuthenticated, (req: any, res: any) => {
  try {
    logger.info("manage: top connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("top: no session");
    }
    // 管理画面表示
    res.render("manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinq管理画面", // タイトル
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// 管理者ログイン画面
app.get("/login", async (_: any, res: any) => {
  try {
    logger.debug("manage: login connected");
    // 管理者ログイン
    res.render("login_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinq管理者ログイン", // タイトル
      message: "",
    });

  } catch (e) {
    logger.error(e);
  }
});

// 新規管理者登録画面
app.get("/managereg", async (_: any, res: any) => {
  try {
    logger.debug("manage: managereg connected");
    // 新規登録画面
    res.render("registration_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinq管理者登録", // タイトル
      message: ""
    });

  } catch (e) {
    logger.error(e);
  }
});

// トップ画像登録画面
app.get("/top", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: topimage connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("top: no session");
    }
    // 全トップ画像
    const allImages: any = await selectAsset("topimg", ["usable"], [[1]]);
    // トップ画像登録画面
    res.render("top_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinqTop画像管理", // タイトル
      history: allImages, // 全トップ画像URL
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// 商品管理画面
app.get("/product", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: product connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("product: no session");
    }
    // 全商品
    const manProducts: any = await selectJoinAsset("product", "variants", ["usable"], [[1]], ["usable"], [[1]], "productgid", "productgid", undefined, undefined, undefined, ["product.id", "product.productname", "product.bottleprinting", "product.glassprinting", "product.recommend", "product.latest", "product.pdorder", "product.display", "variants.variantname", "variants.price"]);
    // 0.5秒ウェイト
    await setTimeout(500);
    logger.info("manage: product completed");
    // 商品管理画面
    res.render("product_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinq商品管理", // タイトル
      data: manProducts, // 商品
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// カテゴリ管理画面
app.get("/category", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: category connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("category: no session");
    }
    // 全カテゴリ
    const manCategories: any = await selectAsset("category", ["usable"], [[1]]);
    // 0.5秒ウェイト
    await setTimeout(500);
    logger.info("manage: category completed");
    // カテゴリ管理画面
    res.render("category_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinqカテゴリ管理", // タイトル
      data: manCategories.reverse(), // カテゴリ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// 名入れ管理画面
app.get("/printing", async (req: any, res: any) => {
  try {
    logger.debug("manage: printing connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("printing: no session");
    }
    // ボトル名入れ
    const bottolePrintings: any = await selectJoinAsset("tmpcart", "printing", ["usable"], [[0, 1]], ["usable"], [[1]], "bottleprinting_id", "id", undefined, "id", "tmpcart", ["tmpcart.id", "user_id", "product_id", "variant_id", "name", "tmpcart.updated_at"]);
    // グラス名入れ
    const glassPrintings: any = await selectJoinAsset("tmpcart", "printing", ["usable"], [[0, 1]], ["usable"], [[1]], "glassprinting_id", "id", undefined, "id", "tmpcart", ["tmpcart.id", "user_id", "product_id", "variant_id", "name", "tmpcart.updated_at"]);
    // 名入れ無しなら次へ
    if (bottolePrintings.length == 0 && glassPrintings.length == 0) {
      logger.trace("no printing");
      throw new Error("printing: no printing");
    }
    // 日時変換
    for (const bottle of bottolePrintings) {
      // フォーマット済み
      const bottoleTime = new Date(bottle.updated_at).toLocaleString('ja-JP', { hour12: false });
      // 再格納
      bottle.updated_at = bottoleTime;
    }
    // 日時変換
    for (const glass of glassPrintings) {
      // フォーマット済み
      const glassTime = new Date(glass.updated_at).toLocaleString('ja-JP', { hour12: false });
      // 再格納
      glass.updated_at = glassTime;
    }
    // 0.5秒ウェイト
    await setTimeout(500);
    // 名入れ画面
    res.render("printing_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinq名入れ管理", // タイトル
      bottle: bottolePrintings, // ボトル名入れ
      glass: glassPrintings, // グラス名入れ
    });

  } catch (e) {
    logger.error(e);
  }
});

// レビュー管理画面
app.get("/review", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: review connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("review: no session");
    }
    // 全レビュー
    const manReviews: any = await selectJoinAsset("review", "product", ["usable"], [[1]], ["usable"], [[1]], "product_id", "id", undefined, "id", "review", ["review.id", "product_id", "productname", "content", "stars", "review.display"]);
    // 0.5秒ウェイト
    await setTimeout(500);
    logger.info("manage: review completed");
    // レビュー管理画面
    res.render("review_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinqレビュー管理", // タイトル
      data: manReviews, // レビュー
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// ニュース登録画面
app.get("/newsreg", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: newsreg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("newsreg: no session");
    }
    // ニュース登録画面
    res.render("newsreg_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinqニュース登録", // タイトル
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// ニュース管理画面
app.get("/news", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: newsedit connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("newsedit: no session");
    }
    // 全ニュース
    const manNews: any = await selectAsset("news", ["usable"], [[1]]);
    // 0.5秒ウェイト
    await setTimeout(500);
    logger.info("manage: newsedit completed");
    // ニュース管理画面
    res.render("news_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "compassLinqニュース編集", // タイトル
      data: manNews, // ニュース
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// いいね管理画面
app.get("/good", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: good connected");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("good: no session");
    }
    // いいね
    let goodInfos: any = [];
    // プロミス
    let promises: any = [];
    // タイトル
    const tmpTitle: string = "compassLinqいいね管理";
    // 全いいね
    const manFavorites: any = await selectJoinAsset("favorite", "product", ["usable"], [[1]], ["usable"], [[1]], "product_id", "id", undefined, "id", "product", ["product.id", "productname"]);
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
        promises.push(countAssets("favorite", ["product_id", "usable"], [[favpd.id], [1]]));
      }
      // いいね数
      const countResult: any = await Promise.all(promises);
      // 0.5秒ウェイト
      await setTimeout(500);
      logger.info("manage: good completed");
      // いいね管理画面表示
      res.render("good_manage.ejs", {
        root: globalDefaultUrl, // ルートURL
        title: tmpTitle, // タイトル
        count: countResult, // いいね数
        infos: goodInfos, // いいね
      });
    } else {
      logger.info("manage: no good");
      // いいね管理画面表示
      res.render("good_manage.ejs", {
        root: globalDefaultUrl, // ルートURL
        title: tmpTitle, // タイトル
        count: [], // いいね数
        infos: [], // いいね
      });
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

/// post
// ログイン
app.post("/login", passport.authenticate("adminLocal", {
  successReturnToOrRedirect: "/",
  failureRedirect: "/login",
  failureMessage: true,
}));

// 初期化
app.post("/init", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: init posted");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("init: no session");
    }
    // カテゴリデータ
    const categoryData: any = await getCategoryData(250);
    // 商品データ
    const productData: any = await getProductData(250);

    // データあり
    if (categoryData.gids.length > 0 && productData.length > 0) {
      // カテゴリデータ登録/更新
      for await (const [i, data] of Object.entries(categoryData.gids)) {
        // 対象GID
        const cID = typeof data === "string" ? data : String(data);
        // 対象データ数
        const categoryCnt: number = await countAssets("category", ["categorygid", "usable"], [[cID], [0, 1]]);
        // 登録なし
        if (categoryCnt == 0) {
          // カテゴリ登録
          await insertData("category", ["categorygid", "categoryname", "display", "usable"], [cID, categoryData.names[i], 1, 1]);
        } else {
          // カテゴリ更新
          await updateData("category", ["categorygid", "usable"], [cID, 1], ["categoryname", "usable"], [categoryData.names[i], 1]);
        }
      }

      // 商品データ登録
      for await (const [j, _] of Object.entries(productData)) {
        // 取得データ
        const pdGid: string = productData[j].id; // 商品ID
        const pdName: string = productData[j].title; // 商品名
        const pdStock: number = productData[j].totalInventory; // 在庫数
        const pdDetail: string = productData[j].description; // 商品詳細
        const pdHtmlDetail: string = productData[j].descriptionHtml; // 商品詳細(HTML)
        const pdImgPath1: string = productData[j].images.nodes[0] ? productData[j].images.nodes[0].url : ""; // 商品画像URL1
        const pdImgPath2: string = productData[j].images.nodes[1] ? productData[j].images.nodes[1].url : ""; // 商品画像URL2
        const pdImgPath3: string = productData[j].images.nodes[2] ? productData[j].images.nodes[2].url : ""; // 商品画像URL3
        const pdImgPath4: string = productData[j].images.nodes[3] ? productData[j].images.nodes[3].url : ""; // 商品画像URL4
        const pdImgPath5: string = productData[j].images.nodes[4] ? productData[j].images.nodes[4].url : ""; // 商品画像URL5
        const pdImgPath6: string = productData[j].images.nodes[5] ? productData[j].images.nodes[5].url : ""; // 商品画像URL6
        const pdCategory: string = productData[j].category.name; // カテゴリ名
        // 商品登録数カウント
        const pdCount: number = await countAssets("product", ["productgid", "usable"], [[pdGid], [1]]);
        // 登録なし
        if (pdCount == 0) {
          // 全カテゴリ
          const tmpCategories: any = await selectAsset("category", ["categoryname", "usable"], [[pdCategory], [1]]);
          // 重複有
          if (tmpCategories.length > 1) {
            // エラー
            throw new Error("insertData: duplicate insert error");
          }
          // 重複有
          if (tmpCategories[0]) {
            // 商品登録
            await insertData("product", ["category_id", "productgid", "productname", "stock", "detailhtml", "description", "imagepath1", "imagepath2", "imagepath3", "imagepath4", "imagepath5", "imagepath6", "display", "usable"], [tmpCategories[0].id, pdGid, pdName, pdStock, pdHtmlDetail, pdDetail, pdImgPath1, pdImgPath2, pdImgPath3, pdImgPath4, pdImgPath5, pdImgPath6, 1, 1]);
          }

        } else {
          // 商品更新
          await updateData("product", ["productgid", "usable"], [pdGid, 1], ["productname", "stock", "detailhtml", "description", "imagepath1", "imagepath2", "imagepath3", "imagepath4", "imagepath5", "imagepath6", "display"], [pdName, pdStock, pdHtmlDetail, pdDetail, pdImgPath1, pdImgPath2, pdImgPath3, pdImgPath4, pdImgPath5, pdImgPath6, 1]);
        }
        // バリアント収集
        for await (const variant of productData[j].variants.nodes) {
          // バリアント名
          const tmpNames: string = variant.title;
          // 価格
          const tmpPrice: number = Math.floor(Number(variant.price.amount));
          // 全バリアント無効化
          const variantCount: number = await countAssets("variants", ["variantid", "productgid", "usable"], [variant.id, pdGid, 1]);
          // 登録無しなら登録
          if (variantCount == 0) {
            // バリアント登録
            await insertData("variants", ["variantid", "productgid", "variantname", "price", "stock", "usable"], [variant.id, pdGid, tmpNames, tmpPrice, variant.quantityAvailable, 1]);
            // ある場合更新
          } else {
            // バリアント更新
            await updateData("variants", ["variantid", "productgid", "usable"], [variant.id, pdGid, 1], ["variantname", "price", "stock"], [tmpNames, tmpPrice, variant.quantityAvailable, 1]);
          }
        }
        // 0.5秒ウェイト
        await setTimeout(500);
        logger.info("manage: init completed");
      }
    } else {
      logger.info("manage: no shopify data");
    }
    // 完了画面
    res.render("complete_manage.ejs", {
      root: globalDefaultUrl, // ルートURL
      title: "完了", // タイトル
      message: "初期化が完了しました。", // メッセージ
      redirect: `${globalDefaultUrl}/`,
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// 新規管理者登録
app.post("/managereg", async (req: any, res: any) => {
  try {
    logger.debug("manage: managereg mode");
    // 管理者名
    const adminName: any = req.body.adminname ?? null;
    // 管理者メール
    const adminMail: any = req.body.adminmail ?? null;
    // パスワード
    const hashedPassword: any = req.body.hashedpassword ?? null;
    // データ無し
    if (!adminName || !adminMail || !hashedPassword) {
      // エラー
      throw new Error("managereg: no necessary data");
    }
    // 対象データ数
    const adminCnt: number = await countAssets("admin", ["adminmail", "usable"], [[sanitizeHtml(adminMail)], [1]]);
    // 登録なし
    if (adminCnt != 0) {
      // エラー
      throw new Error("managereg: manager already exists");
    }
    // 登録
    await insertData("admin", ["adminname", "adminmail", "password", "usable"], [sanitizeHtml(adminName), sanitizeHtml(adminMail), sanitizeHtml(hashedPassword), 1]);
    logger.debug("manage: managereg completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: globalDefaultUrl,
      title: "完了",
      message: "管理者登録が完了しました。",
    });

  } catch (e: unknown) {
    logger.error(e);
    // 新規管理者登録
    res.render("registration_manage.ejs", {
      title: "新規管理者登録", // タイトル
      message: "すでに登録されています。別のメールアドレスで登録して下さい。" // メッセージ
    });
  }
});

// トップ画像登録画面
app.post("/topimage", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: topimagereg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("topimage: no session");
    }
    // ファイルアップロードあり
    if (req.files) {
      logger.debug("topimage: file exists");
      const reqFile1: any = req.files.file1 ?? null;
      const reqFile2: any = req.files.file2 ?? null;
      const reqFile3: any = req.files.file3 ?? null;
      // ファイル1あり
      if (reqFile1) {
        // 画像名1
        const reqFileName1: string = sanitizeHtml(req.body.imagename1);
        // 画像1保存
        await savImageFile(reqFile1, reqFileName1, "top", "1");
        logger.debug("topimage: file1 registered");
      }
      // ファイル2あり
      if (reqFile2) {
        // 画像名2
        const reqFileName2: string = sanitizeHtml(req.body.imagename2);
        // 画像2保存
        await savImageFile(reqFile2, reqFileName2, "top", "2");
        logger.debug("topimage: file2 registered");
      }
      // ファイル3あり
      if (reqFile3) {
        // 画像名3
        const reqFileName3: string = sanitizeHtml(req.body.imagename3);
        // 画像3保存
        await savImageFile(reqFile3, reqFileName3, "top", "3");
        logger.debug("topimage: file3 registered");
      }
    }
    logger.debug("manage: topimage completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/top`,
      title: "完了",
      message: "管理者登録が完了しました。",
    });
  } catch (e: unknown) {
    logger.error(e);
  }
});

// トップ画像選択画面
app.post("/regimage", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: regimage mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("regimage: no session");
    }
    // 受信データ
    const allPdIds: any = req.body.id ?? null; // 全ID
    // 履歴表示
    const displayChkIdxes: any = req.body.display ?? null;
    // 配列なら処理
    if (Array.isArray(allPdIds)) {
      // 商品データ登録
      for await (const [i, _] of Object.entries(allPdIds)) {
        // 商品ID
        const pdId: number = Number(allPdIds[i]);
        // 表示ID
        const tmpDisplayId: number = extractChecked(displayChkIdxes, pdId);
        // 商品更新
        await updateData("topimg", ["id", "usable"], [pdId, 1], ["display"], [tmpDisplayId]);
      }
    }

    logger.debug("manage: regimage completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/top`,
      title: "完了",
      message: "トップ画像選択が完了しました。",
    });
  } catch (e: unknown) {
    logger.error(e);
  }
});

// カテゴリアップデート
app.post("/category", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: category mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("category: no session");
    }
    // 受信データ
    const allCtIds: any = req.body.id ?? null; // ID
    const engNames: any = req.body.englishname ?? null; // 英語名
    const contexts: any = req.body.context ?? null; // コンテンツ
    const chkIndexes: any = req.body.display ?? null; // 掲載
    const rankings: any = req.body.ranking ?? null; // ランキング
    // 配列なら処理
    if (Array.isArray(allCtIds) && Array.isArray(engNames) && Array.isArray(contexts) && Array.isArray(rankings)) {
      // カテゴリデータ登録
      for await (const [i, _] of Object.entries(allCtIds)) {
        // 取得データ
        const ctId: number = Number(allCtIds[i]); // カテゴリID
        const englishName: string = engNames[i]; // 英語名
        const context: string = contexts[i]; // 説明文
        const rank: any = rankings[i] ?? 0; // ランキング
        // 掲載対象
        const tmpCheckId: number = extractChecked(chkIndexes, ctId);
        // カテゴリ更新
        await updateData("category", ["id", "usable"], [ctId, 1], ["englishname", "context", "imagepath", "ranking", "display", "usable"], [englishName, context, "", rank, tmpCheckId, 1]);
      }
    }
    // 0.5秒ウェイト
    await setTimeout(500);
    logger.info("manage: category completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/category`,
      title: "完了", // タイトル
      message: "カテゴリ更新が完了しました。", // メッセージ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// カテゴリ画像アップデート
app.post("/cateimg", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: cateimg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("cateimg: no session");
    }
    // ファイルフラグ
    let fileUpFlg: boolean = false;
    // ファイル無し
    if (!req.files || Object.keys(req.files).length === 0) {
      fileUpFlg = false;
    } else {
      fileUpFlg = true;
    }
    // ファイルアップロードあり
    if (fileUpFlg) {
      logger.debug("cateimg: file exists");
      // 登録
      for (const [key, value] of Object.entries(req.files)) {
        // カテゴリID
        const tmpId: any = key.split('file')[1] ?? undefined;
        // 画像保存
        await savImageFile(value, "", "category", key, tmpId);
        logger.trace("cateimg: file registered");
      }
    }

    logger.info("manage: category completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/category`,
      title: "完了", // タイトル
      message: "カテゴリ更新が完了しました。", // メッセージ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// 商品アップデート
app.post("/product", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: productreg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("productreg: no session");
    }
    // 受信データ
    const allPdIds: any = req.body.id ?? null; // 全ID
    const pdorder: any = req.body.pdorder ?? null; // 表示順
    const recomChkIdxes: any = req.body.recommend ?? null; // おすすめ
    const latestChkIdxes: any = req.body.latest ?? null; // 新商品
    const bottolePrintingChkIdxes: any = req.body.bottleprinting ?? null; // ボトル名入れ
    const glassPrintingChkIdxes: any = req.body.glassprinting ?? null; // グラス名入れ
    const displayChkIdxes: any = req.body.display ?? null; // 掲載
    const rankings: any = req.body.ranking ?? null; // ランキング
    // 配列なら処理
    if (Array.isArray(allPdIds) && Array.isArray(pdorder) && Array.isArray(rankings)) {
      // 商品データ登録
      for await (const [i, _] of Object.entries(allPdIds)) {
        // 取得データ
        const order: number = Number(pdorder[i]); // 表示順
        const pdId: number = Number(allPdIds[i]); // 商品ID
        const rank: number = Number(rankings[i]); // ランキング
        // 数値のみ
        const tmpRecommendId: number = extractChecked(recomChkIdxes, pdId);
        const tmpLatestId: number = extractChecked(latestChkIdxes, pdId);
        const tmpDisplayId: number = extractChecked(displayChkIdxes, pdId);
        const tmpBottlePrintingId: number = extractChecked(bottolePrintingChkIdxes, pdId);
        const tmpGlassPrintingId: number = extractChecked(glassPrintingChkIdxes, pdId);
        // 商品更新
        await updateData("product", ["id", "usable"], [pdId, 1], ["bottleprinting", "glassprinting", "recommend", "latest", "display", "ranking", "pdorder"], [tmpBottlePrintingId, tmpGlassPrintingId, tmpRecommendId, tmpLatestId, tmpDisplayId, rank, order]);
      }
      // 2秒ウェイト
      await setTimeout(2000);
    }
    logger.info("manage: productreg completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/product`, // ルートURL
      title: "完了", // タイトル
      message: "商品更新が完了しました。", // メッセージ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// レビュー
app.post("/review", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: reviewreg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("review: no session");
    }
    // 受信データ
    const allRevIds: any = req.body.id ?? null; // レビュー
    const chkIdxes: any = req.body.check ?? null; // インデックス
    // 配列なら処理
    if (Array.isArray(allRevIds)) {
      // レビューインデックス
      for await (const [i, _] of Object.entries(allRevIds)) {
        // 取得データ
        const revId: number = Number(allRevIds[i]); // レビューID
        // 追加対象
        const tmpCheckId: number = extractChecked(chkIdxes, revId);
        // レビュー追加
        await updateData("review", ["id", "usable"], [revId, 1], ["display"], [tmpCheckId]);
      }
      // 0.5秒ウェイト
      await setTimeout(500);
    }
    logger.info("manage: reviewreg completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/review`, // ルートURL
      title: "完了", // タイトル
      message: "レビュー登録が完了しました。", // メッセージ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// ニュースアップデート
app.post("/editnews", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: editnews mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("editnews: no session");
    }
    // 受信データ
    const reqIds: any = req.body.id ?? null; // ID
    const reqDates: any = req.body.date ?? null; // 日付
    const reqTitles: any = req.body.title ?? null; // タイトル
    const reqContexts: any = req.body.context ?? null; // ニュース
    const reqImageUrls: any = req.body.image ?? null; // 画像url
    const checkedIndex: any = req.body.check ?? null; // 掲載
    const delIndexes: any = req.body.delete ?? null; // 削除
    // 配列なら処理
    if (Array.isArray(reqIds) && Array.isArray(reqDates) && Array.isArray(reqTitles) && Array.isArray(reqContexts) && Array.isArray(reqImageUrls)) {
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
        await updateData("news", ["id", "usable"], [tmpId, 1], ["title", "context", "date", "imageurl", "display", "usable"], [title, context, date, imageUrl, tmpCheckId, tmpDelId]);
      }
      // 0.5秒ウェイト
      await setTimeout(500);
    }
    logger.info("manage: editnews completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/news`, // ルートURL
      title: "完了", // タイトル
      message: "ニュース編集が完了しました。", // メッセージ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// ニュース登録
app.post("/registnews", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: newsreg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("newsreg: no session");
    }
    // 受信データ
    const reqTitles: any = req.body.title ?? null; // タイトル
    const reqContexts: any = req.body.context ?? null; // ニュース内容
    const reqDates: any = req.body.date ?? null; // 日付
    // 画像名
    const reqFileName: string = req.body.imagename ?? null;
    // ニュース登録
    const insertedId: any = await insertData("news", ["title", "context", "date", "display", "usable"], [sanitizeHtml(reqTitles), sanitizeHtml(reqContexts), sanitizeHtml(reqDates), 0, 1]);
    // 0.5秒ウェイト
    await setTimeout(500);
    // ファイルアップロードあり
    if (req.files) {
      logger.debug("newsreg: a file exists");
      const reqFile: any = req.files.file ?? null;
      // ファイルあり
      if (reqFile) {
        // 画像保存
        await savImageFile(reqFile, sanitizeHtml(reqFileName), "news", undefined, insertedId);
        logger.debug("newsreg: file registered");
      }
    } else {
      logger.debug("newsreg: no file exists");
    }
    logger.info("manage: newsreg completed");
    // 完了画面
    res.render("complete_manage.ejs", {
      redirect: `${globalDefaultUrl}/news`, // ルートURL
      title: "完了", // タイトル
      message: "ニュース登録が完了しました", // メッセージ
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// 登録画像削除
app.post("/deletetopimg", isAdminAuthenticated, async (req: any, res: any) => {
  try {
    logger.info("manage: deletetopimg mode");
    logger.trace(req.session);
    // ログインなし
    if (req.session.passport.user.role != "admin") {
      // エラー
      throw new Error("category: no session");
    }
    // 登録画像無効化
    await updateData("topimg", ["id", "usable"], [req.body.id, 1], ["display", "usable"], [0, 0]);
    logger.info("manage: deletetopimg completed");
    // 完了
    res.send();

  } catch (e: unknown) {
    logger.error(e);
  }
});

// エラーハンドラ
app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction,
  ) => {
    logger.error(err);
    res.send("error");
  }
);

// 待機
app.listen(globals.LISTEN_PORT, () => {
  logger.info(
    `GMO card app listening at ${globalDefaultUrl}:${globals.LISTEN_PORT}`
  );
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

// 画像保存
const savImageFile = async (file: any, imagename: string, mode: string, index?: any, assetid?: any): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.trace("savImageFile: started");
      // ファイル名
      if (file.name) {
        // ローカルパス
        const tmpLocalPath: string = path.join(__dirname, "public", "images", mode);
        // リモートパス
        const tmpRemotePath: string = path.join(__dirname, "..", myVariable.ING_ROOT_PATH, "public", "images", mode);
        // 拡張子
        const tmpExtension: string = path.parse(file.name).ext;
        // インデックス
        const fixedIndex: string = index ?? "1";
        // 一時ファイル名
        const tmpFileName: string = `${new Date()
          .toISOString()
          .replace(/[^\d]/g, "")
          .slice(0, 14)}-${fixedIndex}${tmpExtension}`;
        // ローカル保存パス
        const localSaveFilePath: string = path.join(tmpLocalPath, tmpFileName);
        // リモート保存パス
        const remoteSaveFilePath: string = path.join(tmpRemotePath, tmpFileName);
        // 他モード禁止
        if (mode != "top" && mode != "news" && mode != "category") {
          // 登録なしエラー
          throw new Error("savImageFile: no mode");
        }
        // 画像ファイル保存
        file.mv(localSaveFilePath, async (err: any) => {
          if (err) {
            logger.error(err);
          } else {
            logger.trace('savCategoryFile: copying files...');
            // 画像ファイルコピー
            await copyFile(localSaveFilePath, remoteSaveFilePath);
            // モード切替
            if (mode == "top") {
              logger.trace('savCategoryFile: top mode');
              // 画像ファイル登録
              await insertData("topimg", ["topimgname", "originalimgurl", "topimgurl", "terminal", "display", "usable"], [imagename, file.name, tmpFileName, 1, 1, 1]);
              logger.trace(`savTopFile: insertDB ${tmpFileName} completed`);

            } else if (mode == "news") {
              logger.trace('savCategoryFile: news mode');
              // 画像ファイル登録
              await updateData("news", ["id", "usable"], [assetid, 1], ["imageurl"], [tmpFileName]);
              logger.trace(`savNewsFile: updateDB ${tmpFileName} completed`);

            } else if (mode == "category") {
              logger.trace('savCategoryFile: category mode');
              // 画像ファイル登録
              await updateData("category", ["id", "usable"], [assetid, 1], ["imagepath"], [tmpFileName]);
              logger.trace(`savCategoryFile: updateDB ${tmpFileName} completed`);
            }
          }
        });
      } else {
        logger.trace("savImageFile: the same file exists");
      }
      resolve();

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
}