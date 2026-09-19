/**
 * crypto.js
 * function： cryption
 **/

'use strict';

// windowロード時
window.addEventListener('load', function () {

  // パスワード入力完了時
  document.getElementById('password').addEventListener('blur', async function (e) {
    // 入力値取得
    var input1 = document.getElementById('password').value;
    // ハッシュ化
    const hashedPasswd = await async_digestMessage(input1);
    // ハッシュパスワードセット
    document.getElementById('hashedpassword').value = hashedPasswd;
  });

  // ハッシュ生成
  function async_digestMessage(message) {
    return CryptoJS.MD5(message).toString();
  }
});
