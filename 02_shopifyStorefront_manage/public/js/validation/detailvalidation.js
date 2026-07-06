/**
 * detailvalidation.js
 * function： detail form validation
 **/

'use strict';

// windowロード時
window.addEventListener('DOMContentLoaded', function () {
  // カートフォーム
  const cartformDom = document.getElementById("cartForm");
  // カートフォームの送信イベントを取得
  cartformDom.addEventListener("submit", (e) => {
    // 名入れフィールドのDOMを取得
    const printmailDom = document.getElementById("printing");
    // 各入力フィールドの値を取得
    const printing = printmailDom.value ?? null;
    // 未入力の場合はエラー
    if (printmailDom.length) {
      // 未入力の場合はエラー
      if (!printing) {
        alert("名入れを正しく入力してください。");
        e.preventDefault(); // フォームの送信をキャンセル
        return;
      }
    }
    // ダブルクリック回避
    preventdefault(e);
  });
});