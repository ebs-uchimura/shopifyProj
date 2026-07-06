/**
 * topmanage.js
 * function： topimage management
 **/

'use strict';

// limitflg
let limitflg1 = false;
let limitflg2 = false;
// check limit
const checkMax = 3;

// window loaded
window.addEventListener('DOMContentLoaded', function () {
  // form DOM
  const shopformDom = document.getElementById("topimgselform");
  // delete button DOM
  const deleteButtonDoms = document.getElementsByClassName("delete");
  // num display doms
  const displayClasses = document.getElementsByClassName('display');
  // check count
  function checkCount() {
    let checkCount = 0;
    Array.from(displayClasses).forEach(checkBox => {
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
  shopformDom.addEventListener("submit", function (e) {
    e.preventDefault();
    const result1 = checkCount();
    if (result1) {
      pdformDom.submit();
    } else {
      if (limitflg1) {
        alert('表示画像を最低一つは選択してください');
      } else if (limitflg2) {
        alert('最大3つまでです。');
      }
    }
  });
  // clicked delete button
  for (const node of deleteButtonDoms) {
    node.addEventListener("click", () => {
      ajaxAccess("https://manage.compass-linq.com/deletetopimg", { id: node.id });
    })
  }
});


// post ajax request
const ajaxAccess = (url, json) => {
  axios.post(url, json)
    .then(function (_) {
      alert("画像を削除しました。");
      location.reload();
    })
    .catch(function (error) {
      console.log(error);
    });
};
