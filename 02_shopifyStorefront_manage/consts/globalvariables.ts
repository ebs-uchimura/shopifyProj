
/**
 * globalvariables.ts
 **
 * function：global variables
**/

/** variable */
export namespace myVariable {
  export const DEV_FLG: boolean = false;
  export const COMPANY_NAME: string = 'LinQuest';
  export const ING_ROOT_PATH: string = 'compasslinq';
  export const ERROR_MESSAGE: string = 'カートが空です';
  export const PAGENUM: number = 20;
}
/** my const */
export namespace myConst {
  export const APP_NAME: string = 'CompassLinqManage';
  export const DEFAULT_URL: string = 'https://manage.compass-linq.com';
  export const LOG_LEVEL: string = 'all';
}

/** my dev const */
export namespace myDevConst {
  export const APP_NAME: string = 'CompassLinqManage';
  export const DEFAULT_URL: string = 'https://manage.suijinclub.com';
  export const LOG_LEVEL: string = 'all';
}

/** shopify const */
export namespace myShopifyConst {
  export const APP_NAME: string = 'ShopifyEcServer';
  export const API_VERSION: string = '2026-01';
  export const STOREDOMAIN_URL: string = 'https://compass-linq.myshopify.com';
}

/* my mail */
export namespace myMail {
  export const MAIL_FROM: string = "suijin@ebisu-do.jp";
  export const MAIL_MEMBER_TITLE: string = "会員登録用URLのご送付";
  export const MAIL_PASS_TITLE: string = "パスワード変更用URLのご送付";
}

/* my dev mail */
export namespace myDevMail {
  export const MAIL_FROM: string = "dev@ebisu-do.jp";
  export const MAIL_MEMBER_TITLE: string = "【検証用】会員登録用URLのご送付";
  export const MAIL_PASS_TITLE: string = "【検証用】パスワード変更用URLのご送付";
}
