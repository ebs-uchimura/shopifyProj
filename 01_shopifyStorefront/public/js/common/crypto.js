/**
 * crypto.js
 * function： cryption
 **/

'use strict';

// windowロード時
$(function () {
  // パスワード入力完了時
  $('#password').on('blur', async function () {
    console.log("blured");
    // 入力値取得
    var input1 = $('#password').val();
    // ハッシュ化
    const hashedPasswd = await async_digestMessage(input1);
    console.log(hashedPasswd);
    // ハッシュパスワードセット
    $('#hashedpassword').val(hashedPasswd);
  });

  // ハッシュ生成
  function async_digestMessage(message) {
    return CryptoJS.MD5(message).toString();
  }
});
