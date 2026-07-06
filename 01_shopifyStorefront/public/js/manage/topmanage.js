/**
 * topmanage.js
 * function： top management
 **/

'use strict';

$(document).ready(function () {
  // when check on
  $('.showpath').change(function () {
    console.log('checked');
    // checked
    const chk_status = $(this).prop("checked");
    // switch on checkbox
    if (chk_status) {
      // check on
      $(this).next().addClass('display-none');
      $(this).next().next().removeClass('display-none');
    } else {
      // check off
      $(this).next().removeClass('display-none');
      $(this).next().next().addClass('display-none');
    }
  });

});