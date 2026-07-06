/**
 * index.js
 * function： main operation
 **/

'use strict';

// product id
let globalProductId = '';
// root url
let globalRootUrl;

$(function () {
  // load
  console.log('loading finished');
  // counter
  let globalCounter = 1;

  // hamburger
  $('#nav-toggle').on('click', function () {
    $('body').toggleClass('open');
  });

  // set product id
  globalProductId = $('#pid').html();
  // search-box
  $('#search-input').blur(function () {
    // send form
    $('#search-form').submit();
  });

  // plusbutton
  $('.plusbutton').on('click', (e) => {
    // avoid double click
    e.preventDefault();
    // imcrement counter
    globalCounter++;
    // show num
    $('.numarea').val(globalCounter);
  });

  // minusbutton
  $('.minusbutton').on('click', (e) => {
    // avoid double click
    e.preventDefault();
    // over 0
    if (globalCounter > 1) {
      // decrement counter
      globalCounter--;
      // show num
      $('.numarea').val(globalCounter);
    }
  });

  // hearton
  $('.hearton').on('click', (e) => {
    // avoid double click
    e.preventDefault();
    // this element
    const $this = $(e.currentTarget);
    $this.next().removeClass('display-none');
    $this.addClass('display-none');
    // product id
    const productId = $this.children('span').html();
    // set to local storage
    ajaxAccess('goodoff', { id: String(productId) });
  });

  // heartoff
  $('.heartoff').on('click', (e) => {
    // avoid double click
    e.preventDefault();
    // this element
    const $this = $(e.currentTarget);
    // display-none
    $this.prev().removeClass('display-none');
    $this.addClass('display-none');
    // product id
    const productId = $this.children('span').html();
    // set to local storage
    ajaxAccess('goodon', { id: String(productId) });
  });

  // onclick
  for (let i = 1; i < 17; i++) {
    // poparea
    $(`.cart${i}`).on('click', (e) => {
      // avoid double click
      e.preventDefault();
      // init counter
      globalCounter = 1;
      // target html elem
      const targetElement = $('.numarea')[i - 1];
      // reset element
      targetElement.value = globalCounter;
      // display-none
      $(`.poparea${i}`).removeClass('display-none');
    });
  }
  // onclick
  for (let j = 1; j < 17; j++) {
    // poparea
    $(`.poparea${j} .batsu`).on('click', (e) => {
      // avoid double click
      e.preventDefault();
      // display-none
      $(`.poparea${j}`).addClass('display-none');
    });
  }

  // onclick
  for (let k = 1; k < 17; k++) {
    // 会員登録フォームの送信イベントを取得
    $(`.form${k}`).submit((e) => {
      // 自分自身
      const $this = $(e.currentTarget);
      // ボトル名入れDOMを取得
      const bottlePrintDom = $this.find('.bottleprinting');
      // グラス名入れDOMを取得
      const glassPrintDom = $this.find('.glassprinting');
      // ボトル名入れフィールドの値を取得
      const bottlePrinting = $this.find('.bottleprinting').val() ?? null;
      // グラス名入れフィールドの値を取得
      const glassPrinting = $this.find(".glassprinting").val() ?? null;
      // 未入力の場合はエラー
      if (bottlePrintDom.length) {
        // 未入力の場合はエラー
        if (!bottlePrinting) {
          alert("ボトル名入れを正しく入力してください。");
          e.preventDefault(); // フォームの送信をキャンセル
          return;
        }
      }
      // 未入力の場合はエラー
      if (glassPrintDom.length) {
        // 未入力の場合はエラー
        if (!glassPrinting) {
          alert("グラス名入れを正しく入力してください。");
          e.preventDefault(); // フォームの送信をキャンセル
          return;
        }
      }
    });
  }

  // click others
  /*
  $(document).click(function (event) {
    if (
      !$(event.target).closest('.view-btn').length &&
      !$(event.target).closest('.pop').length
    ) {
      console.log("close");
      // hide menu
      $('.pop').addClass('display-none');
    }
  });
  */
});

// get global url
const getGlobalRoot = (url) => {
  // set global url
  globalRootUrl = url;
}

// post request
const ajaxAccess = (url, json) => {
  // syncronize
  let defer = $.Deferred();
  // ajax
  $.ajax(globalRootUrl + '/' + url, {
    type: 'post', // POST
    data: json, // data
    dataType: 'json', // data type
    cache: false, // no cahce
    async: true // async
  })
    // finished
    .done((data) => {
      defer.resolve(data);
    })
    // error
    .fail(() => {

    });
  // return promise
  return defer.promise();
};
