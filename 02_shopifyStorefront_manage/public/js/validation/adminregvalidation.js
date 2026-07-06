/**
 * adminregvalidation.js
 * function： adminregvalidation form validation
 **/

'use strict';

// windowロード時
window.addEventListener('DOMContentLoaded', function () {
  // 会員登録フォーム
  const regformDom = document.getElementById("registForm");
  // 会員登録フォームの送信イベントを取得
  regformDom.addEventListener("submit", (e) => {
    // 各入力フィールドのDOMを取得
    const adminnameDom = document.getElementById("adminname");
    const adminmailDom = document.getElementById("adminmail");
    const passwordDom = document.getElementById("password");
    // 各入力フィールドの値を取得
    const adminname = adminnameDom.value ?? null;
    const adminmail = adminmailDom.value ?? null;
    const password = passwordDom.value ?? null;

    // 名前あり
    if (adminnameDom.length) {
      // 未入力の場合はエラー
      if (!adminname) {
        alert("名前を正しく入力してください。");
        e.preventDefault();
        return;
      }
    }

    // メールあり
    if (adminmailDom.length) {
      // メールアドレス形式はエラー
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!adminmail || !adminmail.match(emailRegex)) {
        alert("メールの形式が正しくありません。");
        e.preventDefault();
        return;
      }

      // メールアドレス形式はエラー（再入力）
      if (!adminmail || !adminmail.match(emailRegex)) {
        alert("メールの形式が正しくありません。（再入力）");
        e.preventDefault();
        return;
      }
    }

    // パスワードあり
    if (passwordDom.length) {
      // 未入力の場合はエラー
      if (!password) {
        alert("パスワードを正しく入力してください。");
        e.preventDefault();
        return;
      }
    }
  });
});