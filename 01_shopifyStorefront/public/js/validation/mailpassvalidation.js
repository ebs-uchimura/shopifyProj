/**
 * mailpassvalidation.js
 * function： mail and password validation
 **/

'use strict';

$(function () {


  // 会員登録フォームの送信イベントを取得
  $('#authform').submit(function (e) {
    // 各入力フィールドのDOMを取得
    const usermailDom = $("#usermail");
    const passwordDom = $("#password");
    const confirmDom = $("#confirm");
    // 各入力フィールドの値を取得
    const usermail = $("#usermail").val() ?? null;
    const password = $("#password").val() ?? null;
    const confirm = $("#confirm").val() ?? null;

    // メールあり
    if (usermailDom.length) {
      // 未入力の場合はエラー
      if (!usermail) {
        alert("メールが空欄です。");
        e.preventDefault();
        return;
      }

      // メールアドレス形式はエラー
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!usermail || !usermail.match(emailRegex)) {
        alert("メールの形式が正しくありません。");
        e.preventDefault();
        return;
      }

      // メールアドレス形式はエラー（再入力）
      if (!usermail || !usermail.match(emailRegex)) {
        alert("メールの形式が正しくありません。（再入力）");
        e.preventDefault();
        return;
      }
    }

    // パスワードあり
    if (passwordDom.length) {
      // 未入力の場合はエラー
      if (!password) {
        alert("パスワードが空欄です。");
        e.preventDefault();
        return;
      }

      // 8文字未満の場合はエラー
      if (password.length < 8) {
        alert("パスワードが8文字未満です。");
        e.preventDefault();
        return;
      }
    }

    // 確認パスワードあり
    if (confirmDom.length) {
      // パスワード確認ボックスあり
      if (confirm) {
        // 二つのパスワードフィールドの値が一致しない場合はエラー
        if (password !== confirm) {
          alert("入力されたパスワードが一致しません。");
          e.preventDefault();
          return;
        }
      }
    }
    // ダブルクリック回避
    preventdefault(e);
  });
});