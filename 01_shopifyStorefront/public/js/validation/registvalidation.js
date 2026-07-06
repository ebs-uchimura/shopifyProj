/**
 * registvalidation.js
 * function： registration form validation
 **/

'use strict';

$(function () {
  // 会員登録フォームの送信イベントを取得
  $('#registForm').submit(function (e) {
    // 各入力フィールドの値を取得
    const firstname = $("#firstname").val() ?? null;
    const lastname = $("#lastname").val() ?? null;
    const usermail = $("#usermail").val() ?? null;
    const reusermail = $("#reusermail").val() ?? null;
    const telephone = $("#telephone").val() ?? null;
    const checkbox2 = $("#checkbox2").val() ?? null;

    // 未入力、または10文字を超える場合はエラー
    if (!firstname || firstname.length > 10) {
      alert("姓を正しく入力してください。");
      e.preventDefault(); // フォームの送信をキャンセル
      return;
    }

    // 未入力、または10文字を超える場合はエラー
    if (!lastname || lastname.length > 10) {
      alert("名を正しく入力してください。");
      e.preventDefault(); // フォームの送信をキャンセル
      return;
    }

    // 電話番号形式以外はエラー
    const phoneRegex = /^0[-\d]{9,12}$/;
    if (!telephone || !telephone.match(phoneRegex)) {
      alert("電話番号を正しく入力してください。");
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
    if (!reusermail || !reusermail.match(emailRegex)) {
      alert("メールの形式が正しくありません。（再入力）");
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
    if (!checkbox2) {
      if (!checkbox2.prop("checked")) {
        alert("利用規約に同意してください。");
        e.preventDefault();
        return;
      }
    }
    // ダブルクリック回避
    preventdefault(e);
  });
});