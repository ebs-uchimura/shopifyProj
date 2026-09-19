/**
 * globalinfo.ts
 **
 * function：global variables
**/

/** my const */
export namespace myDev {
  export const LOCAL_DEV_FLG: boolean = false;
  export const DEV_FLG: boolean = false;
  export const COMPANY_NAME: string = 'LinQuest';
  export const ERROR_MESSAGE: string = 'カートが空です';
}

/** shopify const */
export namespace myShopifyConst {
  export const APP_NAME: string = 'ShopifyEcServer';
  export const API_VERSION: string = '2025-04';
  export const STOREDOMAIN_URL: string = 'https://compass-linq.myshopify.com';
}