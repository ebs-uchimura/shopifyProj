/**
 * loginvalidation.js
 * function： login form validation
 **/

'use strict';

// 会員登録フォームの送信イベントを取得
document.getElementById("authform").addEventListener("submit", function(e) {
  console.log(e);
  // 各入力フィールドの値を取得
  const usermail = document.getElementById("usermail").value ?? null;
  const password = document.getElementById("password").value ?? null;

  // 未入力の場合はエラー
  if (!usermail) {
    alert("メールを正しく入力してください。");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

  // 未入力、または8文字未満の場合はエラー
  if (!password || password.length < 8) {
    alert("パスワードを正しく入力してください。");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

  // メールアドレス以外はエラー
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!usermail || !usermail.match(emailRegex)) {
    alert("メールの形式が不正です。");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

  // ダブルクリック回避
  preventdefault(e);
});