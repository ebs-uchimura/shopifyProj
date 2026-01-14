/**
 * validation.js
 * function： form validation
 **/

'use strict';

// 会員登録フォームの送信イベントを取得
document.getElementById("accountform").addEventListener("submit", function(e) {
  console.log(e);
  // 各入力フィールドの値を取得
  const firstname = document.getElementById("firstname").value ?? null;
  const lastname = document.getElementById("lastname").value ?? null;
  const usermail = document.getElementById("usermail").value ?? null;
  const reusermail = document.getElementById("re-usermail").value ?? null;
  const telephone = document.getElementById("telephone").value ?? null;
  const checkbox2 = document.getElementById('checkbox2').checked ?? null;

  // 未入力、または10文字を超える場合はエラー
  if (!firstname || firstname.length > 10) {
    alert("名前を正しく入力してください。");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

   // 未入力、または10文字を超える場合はエラー
  if (!lastname || lastname.length > 10) {
    alert("名前を正しく入力してください。");
    e.preventDefault(); // フォームの送信をキャンセル
    return;
  }

  // 電話番号以外はエラー
  const phoneRegex = /^0[-\d]{9,12}$/;
  if (!telephone || !telephone.match(phoneRegex)) {
    alert("電話番号を正しく入力してください。");
    e.preventDefault();
    return;
  }

  // メールアドレス以外はエラー
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!usermail || !usermail.match(emailRegex)) {
    alert("メールの形式が正しくありません。");
    e.preventDefault();
    return;
  }

  // メールアドレス以外はエラー
  if (!reusermail || !reusermail.match(emailRegex)) {
    alert("メールの形式が正しくありません。");
    e.preventDefault();
    return;
  }

  // メールアドレス不一致
  if (usermail != reusermail) {
    alert("メールが一致しません。");
    e.preventDefault();
    return;
  }

  // 利用規約不同意
  if(!checkbox2){
    alert("利用規約に同意してください。");
    e.preventDefault();
    return;
  }

  // ダブルクリック回避
  preventdefault(e);
});