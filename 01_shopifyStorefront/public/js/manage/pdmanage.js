/**
 * pdmanage.js
 * function： product management
 **/

'use strict';

// isMobile
let isMobile = /iPhone|Android/i.test(navigator.userAgent);
// limitflg
let limitflg1 = false;
let limitflg2 = false;
// counter
let globalCounter = 1;
// check limit
const checkMax = 3;

window.onload = function () {
  // except for moible terminal
  if (!isMobile) {
    const pdformDom = document.getElementById("pdform");
    // num area doms
    const numareaClasses1 = document.getElementsByClassName('checkbox1');
    const numareaClasses2 = document.getElementsByClassName('checkbox2');
    const checkall = document.getElementById("checksAll");
    const checks = document.querySelectorAll(".checkbox");

    checkall.addEventListener('click', () => {
      for (const check of checks) {
        checkall.checked == true ? check.checked = true : check.checked = false;
      }
    });

    // check count
    function checkCount1() {
      let checkCount = 0;
      Array.from(numareaClasses1).forEach(checkBox => {
        if (checkBox.checked) {
          checkCount++;
        }
      });
      if (checkCount == 0) {
        limitflg1 = true;
        return false;
      }
      if (checkCount > checkMax) {
        limitflg2 = true;
        return false;
      } else {
        return true;
      }
    }
    
    // check count
    function checkCount2() {
      let checkCount = 0;
      Array.from(numareaClasses2).forEach(checkBox => {
        if (checkBox.checked) {
          checkCount++;
        }
      });
      if (checkCount == 0) {
        limitflg1 = true;
        return false;
      }
      if (checkCount > checkMax) {
        limitflg2 = true;
        return false;
      } else {
        return true;
      }
    }

    pdformDom.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("clicked");
      const result1 = checkCount1();
      const result2 = checkCount2();
      if (result1 && result2) {
        pdformDom.submit();
      } else {
        if (limitflg1) {
          alert('おススメ・新商品を最低一つは選択してください');
        } else if (limitflg2) {
          alert('最大3つまで');
        }
      }
    });
  }
}