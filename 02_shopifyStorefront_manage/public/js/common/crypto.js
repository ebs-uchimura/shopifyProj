/**
 * crypto.js
 * function： cryption
 **/

'use strict';

// windowロード時
window.addEventListener('DOMContentLoaded', function () {
  // パスワードDOM
  const passwdDom = document.getElementById("password");
  // 要素からフォーカスが外れた時の処理
  passwdDom.addEventListener('blur', async () => {
    // 入力値取得
    var input1 = passwdDom.value;
    console.log(input1);
    // ハッシュ化
    const hashedPasswd = await async_digestMessage(input1);
    // ハッシュパスワードセット
    document.getElementById("hashedpassword").value = hashedPasswd;
  });

  // ハッシュ生成
  const async_digestMessage = async (message) => {
    return CryptoJS.MD5(message).toString();
  }
});
