/**
 * shopifyModule.ts
 *
 * module：Shopify用
 **/

'use strict';

/// 定数
// 名前空間
import { myDev, myShopifyConst } from '../consts/globalinfo';
import { myConst } from '../consts/globalvariables';
import { myDevConst } from '../consts/globalvariablesdev';
import { myLocalDevConst } from '../consts/globalvariableslocal';

/// 初期設定
// 可変要素
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let shopifyStoredomain: string; // Shopifyストアドメイン
let shopifyApiVersion: string; // ShopifyAPIバージョン
let globalLogLevel: string; // ログレベル

// モジュール
import * as path from 'node:path'; // パス設定用
import { config as dotenv } from 'dotenv'; // 秘匿環境変数
import { createStorefrontApiClient } from '@shopify/storefront-api-client'; // shopify用
import Logger from '../class/Logger'; // ロガー

// グローバル変数
shopifyStoredomain = myShopifyConst.STOREDOMAIN_URL;
shopifyApiVersion = myShopifyConst.API_VERSION;

// ローカルモード
if (myDev.LOCAL_DEV_FLG) {
  globalEnvfileName = '../.localenv';
  globalAppName = myLocalDevConst.APP_NAME;
  globalLogLevel = myLocalDevConst.LOG_LEVEL!;
  // 開発モード
} else if (myDev.DEV_FLG) {
  globalEnvfileName = '../.devenv';
  globalAppName = myDevConst.APP_NAME;
  globalLogLevel = myDevConst.LOG_LEVEL!;
  // 本番モード
} else {
  globalEnvfileName = '../.env';
  globalAppName = myConst.APP_NAME;
  globalLogLevel = myConst.LOG_LEVEL!;
}

// 環境変数
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// ロガー
const logger: Logger = new Logger(myDev.COMPANY_NAME, globalAppName, globalLogLevel);
// Shopify設定
const shopifyClient: any = createStorefrontApiClient({
  storeDomain: shopifyStoredomain, // 店舗ドメイン
  apiVersion: shopifyApiVersion, // APIバージョン
  publicAccessToken: process.env.SHOPIFY_ACCESS_TOKEN, // アクセストークン
});

// Shopify商品取得
export const getProductData = async (num: number): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('getProductData mode');
      // 商品クエリ
      const productQuery: string = `{
        products (
          first: ${num},
        ) {
          nodes {
            id
            title
            totalInventory
            availableForSale
            description
            descriptionHtml
            featuredImage {
              url
            }
            category {
              name
            }
            priceRange {
              maxVariantPrice {
                amount
              }
              minVariantPrice {
                amount
              }
            }
          }
        }
      }`;
      // 商品取得
      const { data } = await shopifyClient.request(productQuery);
      // 結果返し
      resolve(data.products.nodes);

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('getProductData error');
    }
  });
};

// Shopifyカテゴリ取得
export const getCategoryData = async (num: number): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('getCategoryData mode');
      // カテゴリクエリ
      const categoryQuery: string = `{
        products(first: ${num}) {
          nodes {
            category {
              id
              name
            }
          }
        }
      }`;
      // カテゴリ取得
      const { data } = await shopifyClient.request(categoryQuery);
      // ID重複削除
      const uniqueGids = data.products.nodes.map((dt: any) => dt.category.id);
      // カテゴリ名重複削除
      const uniqueData = data.products.nodes.map((dt: any) => dt.category.name);
      // 取得カテゴリ返し
      resolve({
        gids: removeDuplicatesWithFilter(uniqueGids),
        names: removeDuplicatesWithFilter(uniqueData),
      });

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('getCategoryData error');
    }
  });
};

// 顧客作成
export const createCustomer = async (firstname: string, lastname: string, email: string, phone: string, pass: string, magazine: boolean): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 顧客作成クエリ
      const createCustomerQuery: string = `mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer {
            firstName
            lastName
            email
            phone
            acceptsMarketing
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }`;
      // 変数
      const variable = {
        variables: {
          input: {
            firstName: firstname,
            lastName: lastname,
            email: email,
            phone: phone,
            password: pass,
            acceptsMarketing: magazine
          }
        }
      };
      // 顧客作成結果取得
      const { data } = await shopifyClient.request(createCustomerQuery, variable);
      // 結果返し
      resolve(data);

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('createCustomer error');
    }
  });
};

// アクセストークン作成
export const accessTokenCreate = async (email: string, password: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // アクセストークン作成
      const loginWithEmailQuery: string = `mutation SignInWithEmailAndPassword(
        $email: String!, 
        $password: String!,
      ) {
          customerAccessTokenCreate(input: { 
              email: $email, 
              password: $password,
          }) {
              customerAccessToken {
                  accessToken
                  expiresAt
              }
              customerUserErrors {
                  code
                  message
              }
          }
      }`;
      // 変数
      const variable = {
        variables: {
          email: email,
          password: password,
        }
      };
      // アクセストークン取得
      const { data } = await shopifyClient.request(loginWithEmailQuery, variable);
      // 結果返し
      resolve(data);

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('accessTokenCreate error');
    }
  });
};

// 注文履歴取得
export const getOrderHistory = async (customerAccessToken: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 注文履歴クエリ
      const cartHistoryQuery: string = `{
        customer(customerAccessToken: "${customerAccessToken}") {
          orders(first: 250) {
            edges {
              node {
                id
                name
                statusUrl
                orderNumber
                canceledAt
                processedAt
                financialStatus
                fulfillmentStatus 
                totalPriceV2 {
                  amount
                }
              }
            }
          }
        }
      }`;
      // 注文履歴取得
      const { data } = await shopifyClient.request(cartHistoryQuery);
      // 結果返し
      resolve(data);

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('getHistoryData error');
    }
  });
};

// Shopifyカート作成
export const createCartWithItem = async (
  cartLines: any[]
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // カート作成
      const cartCreateQuery: string = `mutation createCart($cartInput: CartInput) {
        cartCreate(input: $cartInput) {
          cart {
            id
            createdAt
            updatedAt
            lines(first: 10) {
              edges {
                node {
                  id
                  merchandise {
                    ... on ProductVariant {
                      id
                    }
                  }
                }
              }
            }
            buyerIdentity {
              deliveryAddressPreferences {
                __typename
              }
              preferences {
                delivery {
                  deliveryMethod
                }
              }
            }
            attributes {
              key
              value
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
              totalDutyAmount {
                amount
                currencyCode
              }
            }
          }
        }
      }
      `;
      // 変数
      const variable = {
        variables: {
          cartInput: {
            lines: cartLines,
          },
        },
      };
      // カート取得
      const { data } = await shopifyClient.request(cartCreateQuery, variable);
      // 結果返し
      resolve(data);

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      // 拒否
      reject('createCartWithItem error');
    }
  });
};

// Shopifyカート追加
export const addToCart = async (cartId: string, merchandiseId: string, quantity: number): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // カート追加クエリ
      const addCartQuery: string = `
        mutation addItemToCart($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart {
              id
              totalQuantity
            }
          }
        }
      `;
      // 変数
      const variable = {
        variables: {
          cartId,
          lines: [
            {
              merchandiseId: merchandiseId,
              quantity,
            },
          ],
        },
      };
      // カート情報取得
      const { data } = await shopifyClient.request(addCartQuery, variable);
      // 結果返し
      resolve(data);

    } catch (e) {
      // エラー
      logger.error(e);
      // 拒否
      reject('addToCart error');
    }
  });
};

// 顧客情報取得
export const getCustomerInfo = async (customerAccessToken: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 顧客情報クエリ
      const customerInfoQuery: string = `{
        customer(customerAccessToken: "${customerAccessToken}") {
          addresses(first: 250) {
            nodes {
              address1
            }
          }
        }
      }`;
      // 顧客情報取得
      const { data } = await shopifyClient.request(customerInfoQuery);
      // 結果返し
      resolve(data);

    } catch (e) {
      // エラー
      logger.error(e);
      // 拒否
      reject('getCustomerInfo error');
    }
  });
};

// Shopifyカート取得
export const getAllCart = async (cartId: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Shopifyカートクエリ
      const getCartQuery: string = `
        query getCartLines($cartId: ID!, $cursor: String) {
          cart(id: $cartId) {
            id
            checkoutUrl
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100, after: $cursor) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      product {
                        id
                        title
                        images(first:1) {
                          edges {
                            node {
                              src
                            }
                          }
                        }
                      }
                      price {
                        amount
                      }
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `;
      // 変数
      const variable = {
        variables: {
          cartId,
        },
      };
      // Shopifyカート取得
      const { data } = await shopifyClient.request(getCartQuery, variable);
      // 結果返し
      resolve(data);

    } catch (e) {
      // エラー
      logger.error(e);
      // 拒否
      reject('getAllCart error');
    }
  });
};

// カート・ユーザ紐づけ
export const associateWithCart = async (buyerIdentity: any, cartId: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // associate query
      const loginWithTokenQuery: string = `mutation cartBuyerIdentityUpdate($buyerIdentity: CartBuyerIdentityInput!, $cartId: ID!) {
        cartBuyerIdentityUpdate(buyerIdentity: $buyerIdentity, cartId: $cartId) {
          cart {
            checkoutUrl
          }
        }
      }`;
      // variable
      const variable = {
        variables: {
          buyerIdentity: buyerIdentity,
          cartId: cartId
        }
      }
      // get asociated data
      const { data } = await shopifyClient.request(loginWithTokenQuery, variable);
      // resolve
      resolve(data);

    } catch (e) {
      // error
      reject('getAllCustomer error');
    }
  });
};

// 重複削除
const removeDuplicatesWithFilter = (arr: any[]): any[] => {
  return arr.filter((element, index) => {
    return arr.indexOf(element) === index;
  });
};