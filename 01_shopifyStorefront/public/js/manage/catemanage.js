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

window.onload = function () {
  // except for moible terminal
  if (!isMobile) {
    const cateformDom = document.getElementById("cateform");
    const numareaClasses = document.getElementsByClassName('checkbox');
    const delareaClasses = document.getElementsByClassName('delete');
    // checkall
    const checkall = document.getElementById("checksAll");
    const checks = document.querySelectorAll(".checkbox");

    checkall.addEventListener('click', () => {
      for (const check of checks) {
        checkall.checked == true ? check.checked = true : check.checked = false;
      }
    });

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

    cateformDom.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("clicked");
      const result = checkCount();
      const delresult = deleteCount();
      console.log(result);
      console.log(delresult);
      if (result && delresult) {
        cateformDom.submit();
      } else {
        alert('更新エラーです');
      }
    });
  }
}