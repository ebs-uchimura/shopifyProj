/**
 * modal.js
 *
 * function： LP画面用
 **/

'use strict';

(function ($) {
  // 要素
  const popupBoxClass = '.popup-box',
    popupBoxInnerClass = '.popup-box__inner',
    popupBoxCloseClass = '.popup-box__close',
    popupBoxOpenClass = '.js-popup-box-open',
    dataOpenName = 'popup-box-open-id',
    dataOpenedName = 'popup-box-id',
    speed = 400;

  // クリックイベントの判定
  const clickEventType = window.ontouchstart !== null ? 'click' : 'touchend';

  $(function () {
    $(document).on(clickEventType, popupBoxOpenClass, openBox);

    $(document).on(clickEventType, popupBoxClass, hideBox);

    $(document).on(clickEventType, popupBoxCloseClass, hideBox);

    // 子要素の伝播をストップ
    $(document).on(clickEventType, popupBoxInnerClass, function (event) {
      event.stopPropagation();
    });

    $('.modal_pop').hide();
    $('.show_pop').on('click', function (e) {
      e.preventDefault();
      $('.modal_pop').fadeIn();
    });
    $('.js-modal-close').on('click', function (e) {
      e.preventDefault();
      $('.popup-box').fadeOut();
    });
    $('#address_enter').on('click', function (e) {
      $('.popup-box').fadeOut();
    });
  });

  // ボックスの非表示関数
  const hideBox = function () {
    $(popupBoxClass).fadeOut(speed);
  };

  // ボックスの表示関数
  const openBox = function () {
    var popupId = $(this).data(dataOpenName);
    $("[data-" + dataOpenedName + '="' + popupId + '"]').fadeIn(speed);
  };
})(window.jQuery);
