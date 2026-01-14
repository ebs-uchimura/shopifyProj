/**
 * memberroutes.ts
 *
 * route：会員ルーティング用
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
let globalLogLevel: string; // ログレベル
let globalDefaultUrl: string; // デフォルトURL

// モジュール定義
import * as path from 'node:path'; // path用
import { setTimeout } from 'node:timers/promises'; // 待機用
import { Router } from 'express'; // express用
import sanitizeHtml from 'sanitize-html'; // サニタイザ
import { config as dotenv } from 'dotenv'; // 秘匿環境変数用
import NodeCache from "node-cache"; // キャッシュ用
import Logger from '../class/Logger'; // ログ用
import Crypto from '../class/Crypto0616'; // 暗号化用

// モジュール読込
import { selectAsset, selectJoinAsset, updateData, insertData } from '../modules/mysqlModule';
import { regetCartNum } from '../modules/regetModule';
// Shopify読込
import { createCartWithItem, getAllCart, accessTokenCreate, associateWithCart } from '../modules/shopifyModule';
// 認証読込
import { isAuthenticated } from '../modules/passportModule';

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalEnvfileName = '../.localenv'; // 環境変数
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  globalDefaultUrl = myLocalDevConst.DEFAULT_URL; // 基本URL
  // 開発モード
} if (myDev.DEV_FLG) {
  globalEnvfileName = '../.devenv'; // 環境変数
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  globalDefaultUrl = myDevConst.DEFAULT_URL; // 基本URL
  // 本番モード
} else {
  globalEnvfileName = '../.env'; // 環境変数
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  globalAppName = myConst.APP_NAME!; // アプリ名
  globalDefaultUrl = myConst.DEFAULT_URL; // 基本URL
}
// 環境変数設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// ロガー設定
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// キャッシュ設定
const cacheMaker: NodeCache = new NodeCache();
// 暗号化用
const FIXED_PEPEER: string = process.env.CRYPTO_PEPPER!;
// 暗号化設定
const cryptoMaker: Crypto = new Crypto(logger, null, FIXED_PEPEER);

// 会員ルータ
export const memberRouter = () => {
  // ルータ
  const router: any = Router();

  /// get
  // 買い物かご
  router.get('/cart', async (req: any, res: any) => {
    try {
      logger.debug('member: cart started');
      logger.trace(req.session);
      // ログイン状態
      let loggedIn: boolean;
      // エラーメッセージ
      let tmpErrMessage: string;
      // 買い物かご
      let tmpUserCart: any;
      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error('cart: no session');
      }
      // エラークエリ
      const errorMsg: any = req.query.error;
      // エラーありならエラーメッセージ表示
      if (errorMsg == '1') {
        tmpErrMessage = myDev.ERROR_MESSAGE;
      } else {
        tmpErrMessage = '';
      }
      // ログイン済み
      if (req.session.passport) {
        // ログイン
        loggedIn = true;
        // ユーザID
        const userId: number = Number(req.session.passport.user.id);
        // データ無し
        if (req.session.passport.user.role != 'user') {
          // エラー
          throw new Error('cart: not num');
        }
        // カート
        tmpUserCart = await selectJoinAsset('tmpcart', 'product', ['user_id', 'usable'], [[userId], [1]], ['usable'], [[1]]);
      } else {
        // ログインなし
        loggedIn = false;
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
          throw new Error('cart: no session id');
        }
        // カート
        tmpUserCart = await selectJoinAsset('tmpcart', 'product', ['session', 'usable'], [[sessionId], [1]], ['usable'], [[1]]);
      }
      // カート数
      const myCartNums: any = regetCartNum(loggedIn, req);
      await setTimeout(500);
      logger.debug('member: cart completed');
      // 買い物かご
      res.render('my/cart', {
        root: globalDefaultUrl, // ルートURL
        cartitems: tmpUserCart, // カート
        login: loggedIn, // ログイン
        cartno: myCartNums, // 注文数
        message: tmpErrMessage, // メッセージ
      });

    } catch (e) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'DBエラー',
        message: 'DB抽出エラー'
      });
    }
  });

  // マイページ
  router.get('/mypage', isAuthenticated, async (req: any, res: any) => {
    try {
      logger.debug('member: mypage started');
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
      // 注文履歴
      /*
      const orderHistory: any = [
        {
          id: '#0000',
          processedAt: '2025年03月18日',
          financialStatus: 'PAID',
          fulfillmentStatus: 'FULFILLED',
          totalPrice: '¥3,500',
        },
      */

      // カート数
      const myCartNums: any = regetCartNum(loggedIn, req);
      await setTimeout(500);

      // マイページ表示
      res.render('my/mypage', {
        root: globalDefaultUrl, // ルートURL
        myorders: [],
        myAddress: '',
        login: true,
        cartno: myCartNums // カート数
      });
      logger.debug('member: mypage completed');

    } catch (e) {
      logger.error(e);
    }
  });

  /// post
  // 買い物かごイン
  router.post('/cart', async (req: any, res: any) => {
    try {
      logger.debug('member: cart reg started');
      // セッション追加
      logger.trace(req.session);
      logger.trace(req.body);
      // 最終ID
      let finalId: any;
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
      // 商品ID
      const productId: any = req.body.pid ?? '';
      // 数量
      const buyingNum: any = req.body.num ?? '';
      // データ無し
      if (buyingNum == '' || productId == '') {
        // エラー
        throw new Error('regcart: no necessary data');
      }
      // 商品ID
      const pdNumId: number = Number(productId);
      // 数量
      const buyingAmount: number = Number(buyingNum);
      // 商品バリアント
      const pdVariant = await selectAsset('product', ['id', 'display', 'usable'], [[pdNumId], [1], [1]]);
      // 商品価格
      const pdPrice: number = Number(pdVariant[0].pricerange);
      // 合計額
      // 成功
      if (pdVariant.length > 0) {
        // ログイン済み
        if (loggedIn) {
          // ユーザID
          const userId: number = Number(req.session.passport.user.id);
          // ユーザ判定
          if (req.session.passport.user.role != 'user') {
            throw new Error('regcart: not num');
          }
          // カート
          const tmpUserCart = await selectAsset('tmpcart', ['product_id', 'user_id', 'usable'], [[pdNumId], [userId], [1]]);
          // 空なら追加
          if (tmpUserCart.length == 0) {
            // カート登録
            finalId = await insertData('tmpcart', ['product_id', 'user_id', 'session', 'price', 'amount', 'usable'], [productId, userId, '', pdPrice, buyingAmount, 1]);
          } else {
            // 数量設定
            const fixedAmout: number = tmpUserCart[0].amount + buyingAmount;
            // カート更新
            finalId = await updateData('tmpcart', ['product_id', 'user_id', 'usable'], [pdNumId, userId, 1], ['price', 'amount'], [pdPrice, fixedAmout]);
          }

        } else {
          // セッションID
          const sessionId: any = req.session.key;
          // セッションIDなし
          if (!sessionId) {
            throw new Error('regcart: no session id');
          }
          // カート
          const tmpSessionCart = await selectAsset('tmpcart', ['product_id', 'session', 'usable'], [[pdNumId], [sessionId], [1]]);
          // 空なら追加
          if (tmpSessionCart.length == 0) {
            // カート登録
            finalId = await insertData('tmpcart', ['product_id', 'user_id', 'session', 'price', 'amount', 'usable'], [pdNumId, 0, sessionId, pdPrice, buyingAmount, 1]);
          } else {
            // 数量設定
            const fixedAmout: number = tmpSessionCart[0].amount + buyingAmount;
            // カート更新
            finalId = await updateData('tmpcart', ['product_id', 'user_id', 'usable'], [pdNumId, 0, 1], ['price', 'amount'], [pdPrice, fixedAmout]);
          }
        }
        // 名入れ文字列
        const pdPrinting: any = sanitizeHtml(req.body.printing);
        // 名入れ有り
        if (pdPrinting != '') {
          // 名入れ登録
          await updateData('tmpcart', ['id', 'usable'], [finalId, 1], ['printing'], [pdPrinting]);
        }
      } else {
        // エラー
        throw new Error('regcart: invalid variant id error');
      }
      logger.debug('member: cart reg completed');
      await setTimeout(2500);
      // ショッピングカート表示
      res.redirect('/my/cart');

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'エラー',
        message: 'バリアントIDエラー'
      });
    }
  });

  // 購入
  router.post('/buy', async (req: any, res: any) => {
    try {
      logger.debug('member: buy reg started');
      logger.trace(req.session);
      logger.trace(req.body);
      // ログイン状態
      let loggedIn: boolean;
      // 国際電話番号
      let internationalPhoneNumber: string = '';
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // shopify送付用
      let shopifyCart: any[] = [];
      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error('buy: no session');
      }
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
        throw new Error('buy: not number error');
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
        logger.debug('member: total is 0');
        // ショッピングカート表示
        res.redirect('/my/cart?error=1');
      } else {
        // 商品バリアントID
        const pdVariantIds = await selectAsset('product', ['id', 'display', 'usable'], [pidList, [1], [1]], undefined, 'id', ['variantid']);
        // 成功
        if (pdVariantIds.length > 0) {
          // 数量
          for (let i = 0; i < pdVariantIds.length; i++) {
            // バリアントID
            const variantID: string = 'gid://shopify/ProductVariant/' + pdVariantIds[i].variantid;
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
            throw new Error('buy: cart creation error');
          }
          // ログイン済み
          if (loggedIn) {
            // ユーザID
            const userId: number = Number(req.session.passport.user.id);
            // ユーザ判定
            if (req.session.passport.user.role != 'user') {
              throw new Error('buy: not num');
            }
            // 対象ユーザ
            const targetUser: any = await selectAsset('user', ['id', 'usable'], [[userId], [1]]);
            // 空なら追加
            if (targetUser.length == 0) {
              throw new Error('buy: no user');
            }
            // Shopifyアクセストークン作成
            const accessToken: any = await accessTokenCreate(targetUser[0].mail, targetUser[0].password);
            // 国際電話対応
            if (targetUser[0].telephone.substring(0, 1) === '0') {
              internationalPhoneNumber = '+81' + targetUser[0].telephone.substring(1);
            } else {
              internationalPhoneNumber = targetUser[0].telephone;
            }
            // Shopifyアクセストークン
            const finalAccessToken: string = accessToken.customerAccessTokenCreate.customerAccessToken.accessToken;
            // 購入者情報
            const buyerIdentity: any = {
              customerAccessToken: finalAccessToken,
              email: targetUser[0].mail,
              phone: internationalPhoneNumber,
            }
            // カート・ユーザ紐づけ
            const associatedStatus: any = await associateWithCart(buyerIdentity, cartId);
            // Shopifyアクセストークン
            const associatedCheckoutUrl: string = associatedStatus.cartBuyerIdentityUpdate.cart.checkoutUrl;
            console.log(associatedCheckoutUrl);
            // カート削除
            await updateData('tmpcart', ['user_id', 'usable'], [userId, 1], ['usable'], [0]);
            // cache
            cacheMaker.set('checkoutUrl', associatedCheckoutUrl);

            // ゲスト購入
          } else {
            // セッションID
            const sessionId: any = req.session.key;
            // カートの中身
            const cartStatus = await getAllCart(cartId);
            // カート削除
            await updateData('tmpcart', ['session', 'usable'], [sessionId, 1], ['usable'], [0]);
            // cache
            cacheMaker.set('checkoutUrl', cartStatus.cart.checkoutUrl);
          }

        } else {
          // エラー
          throw new Error('buy: invalid variant id error');
        }
        // チェックアウトURL
        const tmpCheckout = cacheMaker.get('checkoutUrl') ?? '';
        await setTimeout(1500);
        // 商品ページ表示
        res.send(JSON.stringify({ url: tmpCheckout }));
        logger.debug('member: buy completed');
      }

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'エラー',
        message: 'バリアントIDエラー'
      });
    }
  });

  // 買い物かごアウト
  router.post('/cartdel', async (req: any, res: any) => {
    try {
      logger.debug('member: cart delete started');
      logger.trace(req.session);
      logger.trace(req.body);
      // ログイン状態
      let loggedIn: boolean;
      // セッション判定
      if (req.session.passport) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error('cartdel: no session');
      }
      // セッションID
      const sessionId: any = req.session.key;
      // 商品ID
      const productId: any = sanitizeHtml(req.body.pid);
      // null判定
      if (productId == '') {
        throw new Error('cartdel: no necessary data');
      }
      // ログイン済み
      if (loggedIn) {
        // ユーザID
        const userId: number = Number(req.session.passport.user.id);
        // ユーザ判定
        if (req.session.passport.user.role != 'user') {
          throw new Error('cartdel: not num');
        }
        // カート削除
        await updateData('tmpcart', ['product_id', 'user_id', 'usable'], [productId, userId, 1], ['usable'], [0]);
      } else {
        // カート削除
        await updateData('tmpcart', ['product_id', 'session', 'usable'], [productId, sessionId, 1], ['usable'], [0]);
      }
      await setTimeout(500);
      logger.debug('member: cartdel completed');
      // 買い物かご
      res.redirect('/');

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('error/error', {
        title: 'エラー',
        message: 'バリアントIDエラー'
      });
    }
  });

  // レビュー登録
  router.post('/review', async (req: any, res: any) => {
    try {
      logger.debug('member: review reg started');
      logger.trace(req.session);
      logger.trace(req.body);

      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error('review: no session');
      }
      // キー登録
      if (!req.session.key) {
        // ランダムキー
        const randomkey: string = await cryptoMaker.random(10);
        req.session.key = randomkey;
      }
      // 商品ID
      const productId: any = sanitizeHtml(req.body.pid);
      // レビュー☆数
      const stars: any = sanitizeHtml(req.body.rating);
      // レビュワー名
      const reviewername: any = sanitizeHtml(req.body.reviewername);
      // レビュー内容
      const comment: any = sanitizeHtml(req.body.comment);
      // データ無し
      if (productId == '' || stars == '' || reviewername == '' || comment == '') {
        // エラー
        throw new Error('review: no necessary data');
      }
      // レビュー登録
      await insertData('review', ['product_id', 'reviewername', 'stars', 'content', 'display', 'usable'], [productId, reviewername, stars, comment, 0, 1]);
      logger.debug('member: review reg completed');
      res.redirect('/');

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // アカウント詳細
  router.post('/checkaddress', isAuthenticated, async (req: any, res: any) => {
    try {
      logger.debug('member: checkaddress started');
      logger.trace(req.session);
      logger.trace(req.body);

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
      // 注文履歴
      /*
      const orderHistory: any = [
        {
          id: '#0000',
          processedAt: '2025年03月18日',
          financialStatus: 'PAID',
          fulfillmentStatus: 'FULFILLED',
          totalPrice: '¥3,500',
        },
        {
          id: '#0001',
          processedAt: '2025年05月21日',
          financialStatus: 'PENDING',
          fulfillmentStatus: 'IN_PROGRESS',
          totalPrice: '¥9,500',
        }];
      // 住所
      const customerInfo: any = [{
        zip: '890-0073',
        address1: 'Usuki',
        address2: '2-23-3',
        city: 'Kagoshima',
        firstName: 'Usuki',
        lastName: 'Kenta',
        phone: '099-259-5511'
      }];
      */
      // カート数キャッシュ
      const tmpCartNum: number = await regetCartNum(loggedIn, req);
      await setTimeout(500);
      logger.debug('member: checkaddress completed');
      // マイページ表示
      res.render('my/mypage', {
        myorders: [],
        myAddress: [],
        login: true,
        cartno: tmpCartNum // カート数
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  // ログアウト
  router.post('/logout', isAuthenticated, async (req: any, res: any) => {
    try {
      logger.debug('member: logout started');
      logger.trace(req.session);
      logger.trace(req.body);

      // セッションなし
      if (!req.session) {
        // エラー
        throw new Error('logout: no session');
      }
      // メール
      req.logout(async (_: any) => {
        logger.debug('member: logout completed');
        await setTimeout(500);
        res.redirect('/');
      });

    } catch (e: unknown) {
      logger.error(e);
    }
  });

  return router;
};