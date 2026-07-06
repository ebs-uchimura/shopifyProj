/**
 * password.js
 * function： password visible/invisible
 **/

'use strict';

// window loaded
window.addEventListener('DOMContentLoaded', function () {
  // visible buttons
  const visiblebuttons = document.querySelectorAll('.visible');
  // visible click
  visiblebuttons.forEach((button) => {
    // visible click
    button.addEventListener('click', (e) => {
      // avoid double click
      e.preventDefault();
      // this element
      const thisDom = e.currentTarget
      // target type
      const inputType = thisDom.previousElementSibling.getAttribute("type");
      // change to text
      thisDom.previousElementSibling.setAttribute("type", "text");
      // if password
      if (inputType == "password") {
        // childs
        Array.from(thisDom.children).map(child => {
          // tag is i
          if (child.tagName === 'i') {
            child.classList.remove("fa-eye");
            child.classList.add("fa-eye-slash'");
          }
        });
      } else {
        // childs
        Array.from(thisDom.children).map(child => {
          // tag is i
          if (child.tagName === 'i') {
            child.classList.add("fa-eye");
            child.classList.remove("fa-eye-slash'");
          }
        });
      }
    });
  });
});