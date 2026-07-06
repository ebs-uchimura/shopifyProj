/**
 * detailvalidation.js
 * function： detail form validation
 **/

'use strict';

// bottle flg
let globalBottleFlg;
// glass flg
let globalGlassFlg;

// get global mode
const getGlobalFlgs = (flg1, flg2) => {
  // set global mode
  globalBottleFlg = flg1;
  // set global mode
  globalGlassFlg = flg2;
}

$(function () {
  // 会員登録フォームの送信イベントを取得
  $('#cartForm').submit(function (e) {
    // ボトル名入れDOMを取得
    const bottlePrintDom = $("#bottleprinting");
    // グラス名入れDOMを取得
    const glassPrintDom = $("#glassprinting");
    // ボトル名入れフィールドの値を取得
    const bottlePrinting = $("#bottleprinting").val() ?? null;
    // グラス名入れフィールドの値を取得
    const glassPrinting = $("#glassprinting").val() ?? null;
    // バリエーションチェック
    const variantExists = $('[name="variant"]').length;
    // バリエーションチェック
    const variantChecked = $('[name="variant"]:checked').length;
    // チェック無し
    if (variantChecked == 0 && variantExists > 0) {
      alert("ラジオボタンを選択してください。");
      e.preventDefault(); // フォームの送信をキャンセル
      return;
    }
    // 未入力の場合はエラー
    if (bottlePrintDom.length && globalBottleFlg) {
      // 未入力の場合はエラー
      if (!bottlePrinting) {
        alert("ボトル名入れを正しく入力してください。");
        e.preventDefault(); // フォームの送信をキャンセル
        return;
      }
    }
    // 未入力の場合はエラー
    if (glassPrintDom.length && globalGlassFlg) {
      // 未入力の場合はエラー
      if (!glassPrinting) {
        alert("グラス名入れを正しく入力してください。");
        e.preventDefault(); // フォームの送信をキャンセル
        return;
      }
    }
    // ダブルクリック回避
    preventdefault(e);
  });
});