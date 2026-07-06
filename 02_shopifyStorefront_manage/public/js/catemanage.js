/**
 * catemanage.js
 * function： category management
 **/

'use strict';

// isMobile
let isMobile = /iPhone|Android/i.test(navigator.userAgent);
// counter
let globalCounter = 1;
// check limit
const checkMax = 3;

// window loaded
window.addEventListener('DOMContentLoaded', function () {
  // except for moible terminal
  if (!isMobile) {
    const myfunc = document.getElementById("checksAll");
    const myForm = document.getElementById("cateform");
    const numareaClasses = document.getElementsByClassName('display');
    const delareaClasses = document.getElementsByClassName('delete');
    const checks = document.querySelectorAll(".display");

    // checkall
    myfunc.onclick = function () {
      console.log("checked");
      for (const check of checks) {
        myfunc.checked == true ? check.checked = true : check.checked = false;
      }
    };

    // check count
    function checkCount() {
      let checkCount = 0;
      Array.from(numareaClasses).forEach(checkBox => {
        if (checkBox.checked) {
          checkCount++;
        }
      });
      if (checkCount == 0) {
        alert('掲載対象を最低一つは選択してください');
        return false;
      } else {
        return true;
      }
    }
    // delete count
    function deleteCount() {
      let deleteCount = 0;
      Array.from(delareaClasses).forEach(checkBox => {
        if (checkBox.checked) {
          deleteCount++;
        }
      });
      // show message
      if (deleteCount > 0) {
        if (window.confirm(`${deleteCount}個削除します。よろしいですか？`)) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    }

    // on submit
    myForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const result = checkCount();
      const delresult = deleteCount();
      if (result && delresult) {
        myForm.submit();
      } else {
        alert('更新エラーです');
      }
    });
  }
});