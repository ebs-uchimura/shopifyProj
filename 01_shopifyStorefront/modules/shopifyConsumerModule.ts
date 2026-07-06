/**
 * shopifyModule.ts
 *
 * module：Shopify用
 **/

'use strict';

/// 定数
// 名前空間
import { myDevConst, myShopifyConst } from '../consts/globalinfo';
import globals from '../consts/globalenv';
// モジュール
import { createStorefrontApiClient } from '@shopify/storefront-api-client'; // shopify用
import Logger from '../class/Logger'; // ロガー

// グローバル変数
const shopifyStoredomain: string = myShopifyConst.STOREDOMAIN_URL;
const shopifyApiVersion: string = myShopifyConst.API_VERSION;
const globalAppName: string = myDevConst.APP_NAME;
const globalLogLevel: string = myDevConst.LOG_LEVEL!;
// ロガー
const logger: Logger = new Logger(myDevConst.COMPANY_NAME, globalAppName, globalLogLevel);
// Shopify設定
const shopifyClient: any = createStorefrontApiClient({
  storeDomain: shopifyStoredomain, // 店舗ドメイン
  apiVersion: shopifyApiVersion, // APIバージョン
  publicAccessToken: globals.SHOPIFY_ACCESS_TOKEN, // アクセストークン
});

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