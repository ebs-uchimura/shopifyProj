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

// window loaded
window.addEventListener('DOMContentLoaded', function () {
  // except for moible terminal
  if (!isMobile) {
    const pdformDom = document.getElementById("pdform");
    // num area doms
    const recommendClasses = document.getElementsByClassName('recommend');
    const latestClasses = document.getElementsByClassName('latest');
    const checkall1 = document.getElementById("checksAll1");
    const checkall2 = document.getElementById("checksAll2");
    const checkall3 = document.getElementById("checksAll3");
    const displayChecks = document.querySelectorAll(".display");
    const bottleprintingChecks = document.querySelectorAll(".bottleprinting");
    const glassprintingChecks = document.querySelectorAll(".glassprinting");

    checkall1.addEventListener('click', () => {
      for (const check of displayChecks) {
        checkall1.checked == true ? check.checked = true : check.checked = false;
      }
    });

    checkall2.addEventListener('click', () => {
      for (const check of bottleprintingChecks) {
        checkall2.checked == true ? check.checked = true : check.checked = false;
      }
    });

    checkall3.addEventListener('click', () => {
      for (const check of glassprintingChecks) {
        checkall3.checked == true ? check.checked = true : check.checked = false;
      }
    });

    // check count
    function checkCount1() {
      let checkCount = 0;
      Array.from(recommendClasses).forEach(checkBox => {
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
      Array.from(latestClasses).forEach(checkBox => {
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
});