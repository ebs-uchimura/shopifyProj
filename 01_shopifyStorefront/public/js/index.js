/**
 * index.js
 * function： main operation
 **/

'use strict';

// product id
let globalProductId = '';
// mode
let globalDevMode;
// root url
let globalRootUrl;

$(function () {
  // load
  console.log('loading finished');
  // isMobile
  let isMobile = /iPhone|Android/i.test(navigator.userAgent);
  // counter
  let globalCounter = 1;

  // toggle
  const toggleClasses = () => {
    // toggle hamburger
    $('.hamburger')[0].classList.toggle("open");
    // toggle menu
    $('.menu')[0].classList.toggle("open");
  }
  // hamburger
  $('.hamburger').on('click', (e) => {
    // avoid double click
    e.preventDefault();
    // toggle
    toggleClasses();
  });
  // open
  $(".openbtn4").click((e) => {
    // avoid double click
    e.preventDefault();
    // this element
    const $this = $(e.currentTarget);
    // activate
    $this.toggleClass("active");
  });
  // set product id
  globalProductId = $('#pid').html();
  // search-box
  $('#search-input').blur(function() {
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
    // display-none
    $this.next().removeClass('display-none');
    $this.addClass('display-none');
    // product id
    const productId = $this.children('span').html();
    console.log(productId);
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
    console.log(productId);
    // set to local storage
    ajaxAccess('goodon', { id: String(productId) });
  });

  // terminal
  if (!isMobile) {
    // PC only
    // onclick
    for (let i = 1; i < 17; i++) {
      // poparea
      $(`.quick${i}`).on('click', (e) => {
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
  }

  // click others
  $(document).click(function (event) {
    if (
      !$(event.target).closest('.view-btn').length &&
      !$(event.target).closest('.pop').length
    ) {
      // hide menu
      $('.pop').addClass('display-none');
    }
  });

});

// get global mode
const getGlobalMode = (mode) => {
  // set global mode
  globalDevMode = mode;
}

// get global root
const getGlobalRoot = (url) => {
  // set global mode
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
