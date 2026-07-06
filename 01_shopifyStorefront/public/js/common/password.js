/**
 * password.js
 * function： password visible/invisible
 **/

'use strict';

$(function () {
  // visible buttons
  const visiblebuttons = document.querySelectorAll('.visible');
  // visible click
  visiblebuttons.forEach((button) => {
    // visible click
    button.addEventListener('click', (e) => {
      // avoid double click
      e.preventDefault();
      // this element
      const $this = $(e.currentTarget);
      // target type
      const inputType = $this.prev().attr("type");
      // if password
      if (inputType == "password") {
        // change to text
        $this.prev().attr("type","text");
        $this.children('i').removeClass('fa-eye');
        $this.children('i').addClass('fa-eye-slash');
      } else {
        // change to password
        $this.prev().attr("type","password");
        $this.children('i').addClass('fa-eye');
        $this.children('i').removeClass('fa-eye-slash');
      }

    });
  });
});