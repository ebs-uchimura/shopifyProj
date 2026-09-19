/**
 * child.js
 * function： review operation
 **/

'use strict';

function starColor(starNum) {
    $(".star-rating label").removeClass("fill");
  for (let i = 1; i <= starNum; i++) {
    $(`#star${i} + label`).addClass("fill");
  }
}

function starValue(starRadioNum) {
    $(".star-rating").removeClass("fillradio");
  for (let j = 1; j <= starRadioNum; j++) {
    $(`#star${j}`).addClass("fillradio");
  }
}

$(".star-rating").on('click mouseenter', function () {
  const starRadioNum = $(this).val();
  starValue(starRadioNum); 
});

$(".star-rating").on('mouseleave', function () {
  const starRadioNum = $(".star-rating input:checked").val();
  starValue(starRadioNum);
});

$(".star-rating label").on('click mouseenter', function () {
  const starNum = $(this).attr('data-label-num');
  starColor(starNum); 
});

$(".star-rating label").on('mouseleave', function () {
  const starNum = $(".star-rating input:checked").val();
  starColor(starNum);
});
