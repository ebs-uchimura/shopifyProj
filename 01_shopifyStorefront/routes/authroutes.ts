/**
 * authroutes.ts
 *
 * route：認証関係ルーティング用
**/

'use strict';

/// 定数
// 名前空間
import { myDev } from '../consts/globalinfo';
import { myConst, myMail } from '../consts/globalvariables';
import { myDevConst, myDevMail } from '../consts/globalvariablesdev';
import { myLocalDevConst, myLocalDevMail } from '../consts/globalvariableslocal';
// 可変要素
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let globalSenderMail: string; // 送信元アドレス
let globalMailTitle: string; // メールタイトル
let globalBaseUrl: string; // 基準URL
let globalLogLevel: string; // ログレベル

/// モジュール定義
import * as path from 'node:path'; // path
import { existsSync } from 'node:fs'; // fs
import { readFile } from 'node:fs/promises'; // fs(promise)
import { Router } from 'express'; // express
import sanitizeHtml from 'sanitize-html'; // サニタイザ
import passport from 'passport'; // ログイン用
import { config as dotenv } from 'dotenv'; // 環境変数
import Logger from '../class/Logger'; // ロガー用
import NodeMailer from '../class/NodeMailer0620'; // メール送付用
import Crypto from '../class/Crypto0616'; // 暗号化用
import { countAssets, selectAsset, updateData, insertData } from '../modules/mysqlModule'; // MYSQL読込
// Shopify読込
import { createCustomer } from '../modules/shopifyModule';

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalEnvfileName = '../.localenv'; // 環境変数ファイル
  globalAppName = myLocalDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myLocalDevConst.LOG_LEVEL; // ログレベル
  globalBaseUrl = myLocalDevConst.DEFAULT_URL; // 基本URL
  globalSenderMail = myLocalDevMail.MAIL_FROM; // 送付元
  globalMailTitle = myLocalDevMail.MAIL_MEMBER_TITLE; // メールタイトル
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalEnvfileName = '../.devenv'; // 環境変数ファイル
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  globalBaseUrl = myDevConst.DEFAULT_URL; // 基本URL
  globalSenderMail = myDevMail.MAIL_FROM; // 送付元
  globalMailTitle = myDevMail.MAIL_MEMBER_TITLE; // メールタイトル
  // 本番モード
} else {
  globalEnvfileName = '../.env'; // 環境変数ファイル
  globalAppName = myConst.APP_NAME!; // アプリ名
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  globalBaseUrl = myConst.DEFAULT_URL; // 基本URL
  globalSenderMail = myMail.MAIL_FROM; // 送付元
  globalMailTitle = myMail.MAIL_MEMBER_TITLE; // メールタイトル
}
// 環境変数設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });

/// モジュール設定
// ロガー
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// 暗号化用
const FIXED_PEPEER: string = process.env.CRYPTO_PEPPER!;
// 暗号化設定
const cryptoMaker: Crypto = new Crypto(logger, null, FIXED_PEPEER);
// ホスト名
const mailerHostname: string = process.env.NODEMAILER_HOST!;
// ポート番号
const mailerPortnumber: number = Number(process.env.NODEMAILER_PORT);
// ホスト名
const mailerUsername: string = process.env.NODEMAILER_USERNAME!;
// ホスト名
const mailerHostpassword: string = process.env.NODEMAILER_PASSWORD!;
// メーラ設定
const nodemailMaker: NodeMailer = new NodeMailer(logger, mailerHostname, mailerPortnumber, mailerUsername, mailerHostpassword);

// 認証ルータ
export const authRouter = () => {
  // ルータ
  const router: any = Router();

  /// get
  // ログイン画面
  router.get('/login', async (req: any, res: any) => {
    try {
      logger.debug('auth: login mode');
      // フラグ
      const flg: boolean = req.query.flg == 1;
      console.log(flg);
      // ログイン
      res.render('auth/login', {
        message: '',
        flg: flg,
      });

    } catch (e) {
      logger.error(e);
      // レンダリングエラー
      res.render('error/error', {
        title: 'エラー', // タイトル
        message: 'レンダリングエラー', // メッセージ
      });
    }
  });

  // パスワード再設定画面
  router.get('/forgot', async (_: any, res: any) => {
    try {
      logger.debug('auth: forgot mode');
      // パスワード再設定
      res.render('auth/forgot', {
        message: ''
      });

    } catch (e) {
      logger.error(e);
      // レンダリングエラー
      res.render('error/error', {
        title: 'エラー', // タイトル
        message: 'レンダリングエラー', // メッセージ
      });
    }
  });

  // 新規会員登録画面
  router.get('/memberreg', async (_: any, res: any) => {
    try {
      logger.debug('auth: memberreg mode');
      // 新規登録
      res.render('auth/account', {
        message: ''
      });

    } catch (e) {
      logger.error(e);
    }
  });

  // 新規会員登録認証画面
  router.get('/member/:id', async (req: any, res: any) => {
    try {
      logger.debug('auth: member started');
      // 検出用文字列
      const tmpSecretkey: any = sanitizeHtml(req.params.id);
      // データ無し
      if (tmpSecretkey == '') {
        throw new Error('member: no key data');
      }
      // 該当ユーザ抽出
      const targetUser: any = await selectAsset('user', ['token', 'usable'], [[tmpSecretkey], [1]], 1, 'id', ['id', 'mail'], true, true);
      // 登録なし
      if (targetUser.length == 0) {
        throw new Error('member: no user data');
      }
      // ランダム文字列
      const randomString: string = await cryptoMaker.random(10);
      // 会員更新
      await updateData('user', ['id', 'usable'], [targetUser[0].id, 1], ['token', 'membertoken'], [tmpSecretkey, randomString]);
      logger.debug('auth: member completed');
      // ページ表示
      res.render('auth/password', {
        title: 'パスワード設定', // ページタイトル
        mail: targetUser[0].mail, // メール
        key: randomString, // ランダムキー
        message: '',
      });

    } catch (e: unknown) {
      logger.error(e);
      // エラー
      res.render('error/error', {
        title: 'エラー',
        message: '有効期限切れエラー' // タイトル
      });
    }
  });

  // パスワード再発行認証
  router.get('/password/:id', async (req: any, res: any) => {
    try {
      logger.debug('auth: password started');
      // 検出用文字列
      const tmpSecretkey: any = sanitizeHtml(req.params.id);
      // データ無し
      if (tmpSecretkey == '') {
        throw new Error('password: no necessary data');
      }
      // サニタイズ処理
      const sanitizedTmpSecretkey: any = sanitizeHtml(tmpSecretkey) ?? '';
      // 該当ユーザ抽出
      const targetUser: any = await selectAsset('user', ['passtoken', 'usable'], [[sanitizedTmpSecretkey], [1]], 1, 'id', ['id', 'mail'], true, true);
      // 登録なし
      if (targetUser.length == 0) {
        throw new Error('password: no user data');
      }
      // ランダム文字列
      const randomString: string = await cryptoMaker.random(10);
      // パス更新
      await updateData('user', ['id', 'usable'], [targetUser[0].id, 1], ['passtoken'], [randomString]);
      logger.debug('auth: password completed');
      // ページ表示
      res.render('auth/password', {
        title: '会員登録確認', // ページタイトル
        mail: targetUser[0].mail, // メール
        key: randomString, // ランダムキー
      });

    } catch (e: unknown) {
      logger.error(e);
      // エラー
      res.render('error/404', {
        title: 'エラー',
        message: '有効期限切れエラー' // タイトル
      });
    }
  });

  /// post
  // ログイン
  router.post('/login', passport.authenticate('userLocal', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/auth/login?flg=0',
    failureMessage: true
  }));

  // ログイン
  router.post('/cartlogin', passport.authenticate('userLocal', {
    successReturnToOrRedirect: '/my/cart',
    failureRedirect: '/auth/login?flg=1',
    failureMessage: true
  }));

  // 新規会員登録
  router.post('/memberreg', async (req: any, res: any) => {
    try {
      logger.debug('auth: member reg started');
      /// 受信データ
      // 国際電話番号
      let internationalPhoneNumber: string = '';
      // ユーザ名(姓)
      const firstName: any = sanitizeHtml(req.body.firstname);
      // ユーザ名(名)
      const lastName: any = sanitizeHtml(req.body.lastname);
      // ユーザ名かな(姓)
      const firstnameRuby: any = sanitizeHtml(req.body.firstnameruby);
      // ユーザ名かな(名)
      const lastnameRuby: any = sanitizeHtml(req.body.lastnameruby);
      // メール
      const userMail: any = sanitizeHtml(req.body.usermail);
      // 電話番号
      const telephone: any = sanitizeHtml(req.body.telephone);
      // メール配信希望
      const magazineChk: any = sanitizeHtml(req.body.magazine);
      // データ無し
      if (firstName == '' || lastName == '' || userMail == '' || telephone == '') {
        // エラー
        throw new Error('memberreg: no necessary data');
      }
      // 国際電話対応
      if (telephone.substr(0, 1) === '0') {
        internationalPhoneNumber = '+81' + telephone.substr(1);
      }
      // 対象データ数
      const userCnt: number = await countAssets('user', ['mail', 'usable'], [[userMail], [1]]);

      // 登録なし
      if (userCnt == 0) {
        // ランダム文字列
        const randomString: string = await cryptoMaker.random(10);
        // 配信希望
        const magazineChkNum: number = magazineChk == 'on' ? 1 : 0;
        // 登録
        await insertData('user', ['firstname', 'firstnameruby', 'lastname', 'lastnameruby', 'telephone', 'mail', 'password', 'magazine', 'token', 'membertoken', 'passtoken', 'usable'], [firstName, firstnameRuby, lastName, lastnameRuby, internationalPhoneNumber, userMail, null, magazineChkNum, randomString, '', '', 1]);
        // ファイル読み込み
        const filePath: string = path.join(__dirname, '../', 'public', 'text', 'membermail.txt');
        // テキスト読込
        const textString: any = await readFile(filePath, { encoding: 'utf8' });
        // 会員登録URL
        const memberUrl: string = globalBaseUrl + '/auth/member/' + randomString;
        // メール送信
        await nodemailMaker.sendMail(userMail, globalSenderMail, globalMailTitle, textString.replace('member_url', memberUrl));
        logger.debug('auth: sendMail completed');
        // 認証メール送付
        res.render('complete', {
          title: '完了',
          message: 'ご登録のメール宛てに認証URLをお送りしました。クリックして手続きを完了させて下さい。',
          login: false,
          url: globalBaseUrl,
        });

      } else {
        throw new Error('memberreg: user already exists');
      };

    } catch (e: unknown) {
      logger.error(e);
      // 新規登録
      res.render('auth/account', {
        message: 'すでに登録されています。別のメールアドレスで登録して下さい。' // メッセージ
      });
    }
  });

  // 会員登録時パスワード登録
  router.post('/memberpass', async (req: any, res: any) => {
    try {
      logger.debug('auth: member pass reg started');
      // メール
      const userMail: any = sanitizeHtml(req.body.usermail);
      // メールキー
      const memberkey: any = sanitizeHtml(req.body.userkey);
      // ハッシュパス
      const hashedpassword: any = sanitizeHtml(req.body.hashedpassword);
      // データ無し
      if (memberkey == '' || userMail == '' || hashedpassword == '') {
        // エラー
        throw new Error('memberpass: no user data');
      }
      // 該当ユーザ抽出
      const targetUser: any = await selectAsset('user', ['mail', 'membertoken', 'usable'], [[userMail], [memberkey], [1]], 1, 'id', undefined, true);
      // 登録なし
      if (targetUser.length == 0) {
        throw new Error('memberpass: no necessary data');
      }
      // 会員更新
      await updateData('user', ['id', 'usable'], [targetUser[0].id, 1], ['password'], [hashedpassword]);
      // ユーザ作成
      await createCustomer(targetUser[0].firstname, targetUser[0].lastname, targetUser[0].mail, targetUser[0].telephone, hashedpassword, !!targetUser[0].magazine)
      logger.debug('auth: member pass reg completed');
      // ページ表示
      res.render('complete', {
        message: '完了しました！トップページに戻ります。',
        url: globalBaseUrl,
      });

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('auth/password', {
        message: 'すでに登録されています' // メッセージ
      });
    }
  });

  // パスワード再発行
  router.post('/republish', async (req: any, res: any) => {
    try {
      logger.debug('auth: pass republish started');
      // ランダム文字列
      const randomString: string = await cryptoMaker.random(10);
      // 受信データ
      const userMail: any = sanitizeHtml(req.body.usermail);
      // データ無し
      if (userMail == '') {
        // エラー
        throw new Error('republish: no necessary data');
      }
      // 対象データ数
      const categoryCnt: number = await countAssets('user', ['mail', 'usable'], [[userMail], [1]]);
      // 登録あり
      if (categoryCnt > 0) {
        // ファイル読み込み
        const filePath: string = path.join(__dirname, '../', 'public', 'text', 'passwordmail.txt');
        // ファイルなしエラー
        if (!existsSync(filePath)) {
          // エラー
          throw new Error('republish: no password file');
        }
        // テキスト読込
        const textString: any = await readFile(filePath, { encoding: 'utf8' });
        // パス更新
        await updateData('user', ['mail', 'usable'], [userMail, 1], ['passtoken'], [randomString]);
        // パスワード再発行URL
        const passwordrUrl: string = globalBaseUrl + '/auth/password/' + randomString;
        // メール送信
        await nodemailMaker.sendMail(userMail, globalSenderMail, globalMailTitle, textString.replace('password_url', passwordrUrl));
        logger.debug('auth: nodemailMaker completed');
        // 認証メール送付
        res.render('complete', {
          message: 'ご登録のメール宛てに再発行用URLをお送りしました。クリックして手続きを完了させて下さい。',
          url: globalBaseUrl,
        });

      } else {
        throw new Error('republish: user does not exists');
      };

    } catch (e: unknown) {
      logger.error(e);
      // 認証エラー
      res.render('auth/forgot', {
        title: 'エラー', // タイトル
        message: 'すでに登録されています', // メッセージ
      });
    }
  });

  return router;
};