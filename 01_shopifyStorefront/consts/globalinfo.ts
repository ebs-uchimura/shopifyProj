/**
 * globalinfo.ts
 **
 * function：global variables
**/

/** my const */
export namespace myDevConst {
  export const COMPANY_NAME: string = 'LinQuest';
  export const ERROR_MESSAGE: string = 'カートが空です';
  export const APP_NAME: string = 'CompassLinq';
  export const DEFAULT_URL: string = 'https://compass-linq.com';
  export const DEFAULT_MANAGE_URL: string = DEFAULT_URL + '/manage';
  export const LOG_LEVEL: string = 'trace';
}

/** shopify const */
export namespace myShopifyConst {
  export const APP_NAME: string = 'ShopifyEcServer';
  export const API_VERSION: string = '2025-07';
  export const STOREDOMAIN_URL: string = 'https://compass-linq.myshopify.com';
}

/* mail */
export namespace myDevMail {
  export const MAIL_FROM: string = "suijin@ebisu-do.jp";
  export const MAIL_MEMBER_TITLE: string = "会員登録用URLのご送付";
  export const MAIL_PASS_TITLE: string = "パスワード変更用URLのご送付";
}
