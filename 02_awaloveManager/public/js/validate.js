/**
 * validate.js
 *
 * function： LP画面用
 **/

'use strict';

(function ($) {

  $(function () {
    
    // 標準エラーメッセージの変更
    $.extend($.validator.messages, {
      email: '*正しいメールアドレスの形式で入力して下さい',
      number: '*半角数字を入力してください',
      required: '*入力必須です',
    });

    // ルール定義（注文）
    const orderRules = {
      userid: {
        number: true,
        required: true,
      },
      address: {
        required: true,
      },
      telephone: {
        required: true,
      },
      mailaddress: {
        email: true,
        required: true,
      },
      productid: {
        number: true,
        required: true,
      },
    };

    // ルール定義（ユーザ）
    const userRules = {
      userid: {
        number: true,
        required: true,
      },
      username: {
        required: true,
      },
      pref: {
        required: true,
      },
      city: {
        required: true,
      },
      street: {
        required: true,
      },
      mailaddress: {
        email: true,
        required: true,
      },
      productid: {
        number: true,
        required: true,
      },
    };

    // 注文
    $('.orderform').validate({
      rules: orderRules,
    });
    // ユーザ
    $('.userform').validate({
      rules: userRules,
    });

    // エラー処理
    $('form').validate({
      // エラーメッセージ出力箇所調整
      errorPlacement: function (error, element) {
        // ラジオボタンなら親要素に
        if (element.is(':radio')) {
          error.appendTo(element.parent());

          // それ以外なら後に
        } else {
          error.insertAfter(element);
        }
      },
    });
  });
})(window.jQuery);
