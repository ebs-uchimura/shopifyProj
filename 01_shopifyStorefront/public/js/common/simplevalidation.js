/**
 * simple validation.js
 * function： simple password validation
 **/

'use strict';

// 会員登録フォームの送信イベントを取得
document.getElementById("authform").addEventListener("submit", function(e) {
  console.log(e);
  // 各入力フィールドの値を取得
  const password = document.getElementById("password").value ?? null;
  const confirm = document.getElementById("confirm").value ?? null;

  // 未入力、または8文字未満の場合はエラー
  if (!password) {
    alert("パスワードを正しく入力してください。");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

  // 未入力、または8文字未満の場合はエラー
  if (password.length < 8) {
    alert("パスワードが8文字未満です");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

  // 二つのパスワードフィールドの値が一致しない場合はエラー
  if (password !== confirm) {
    alert("入力されたパスワードが一致しません。");
    e.preventDefault();
    return;
  }

  // ダブルクリック回避
  preventdefault(e);
});