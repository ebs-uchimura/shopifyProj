/**
 * categoryvalidation.js
 * function： category form validation
 **/

'use strict';

$(function () {
  // 会員登録フォームの送信イベントを取得
  $('.cartForm').submit(function (e) {
    // ボトル名入れDOM
    var targetBottleChild = $(this).find('.bottleprinting');
    // グラス名入れDOM
    var targetGlassChild = $(this).find('.glassprinting');
    // ボトル名入れDOMあり
    if (targetBottleChild.length > 0) {
      // ボトル名入れ
      if (targetBottleChild.val() == '') {
        alert("ボトル名入れを正しく入力してください。");
        e.preventDefault();
        return;
      }
    }
    // グラス名入れDOMあり
    if (targetGlassChild.length > 0) {
      // グラス名入れ
      if (targetGlassChild.val() == '') {
        alert("グラス名入れを正しく入力してください。");
        e.preventDefault();
        return;
      }
    }
    // ダブルクリック回避
    preventdefault(e);
  });
});