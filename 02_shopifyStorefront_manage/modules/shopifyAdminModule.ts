/**
 * shopifyModule.ts
 *
 * module：Shopify用
 **/

'use strict';

/// 定数
// 名前空間
import { myVariable, myDevConst, myShopifyConst } from '../consts/globalvariables';
import globals from '../consts/globalenv';

/// 初期設定
// 可変要素
let globalAppName: string = myDevConst.APP_NAME; // アプリ名
let shopifyStoredomain: string = myShopifyConst.STOREDOMAIN_URL; // Shopifyストアドメイン
let shopifyApiVersion: string = myShopifyConst.API_VERSION; // ShopifyAPIバージョン
let globalLogLevel: string = myDevConst.LOG_LEVEL!; // ログレベル

// モジュール
import { createStorefrontApiClient } from '@shopify/storefront-api-client'; // shopify用
import Logger from '../class/Logger'; // ロガー
// ロガー
const logger: Logger = new Logger(myVariable.COMPANY_NAME, globalAppName, globalLogLevel);
// Shopify設定
const shopifyClient: any = createStorefrontApiClient({
  storeDomain: shopifyStoredomain, // 店舗ドメイン
  apiVersion: shopifyApiVersion, // APIバージョン
  publicAccessToken: globals.SHOPIFY_ACCESS_TOKEN, // アクセストークン
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
            images(first: 6) {
              nodes {
                url
              }
            } 
            category {
              name
            }
            variants(first: 3) {
              nodes {
                id
                title
                price {
                  amount
                }
                quantityAvailable
              }
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

// 重複削除
const removeDuplicatesWithFilter = (arr: any[]): any[] => {
  return arr.filter((element, index) => {
    return arr.indexOf(element) === index;
  });
};