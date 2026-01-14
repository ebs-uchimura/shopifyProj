/**
 * cart.js
 * function： cart operation
 **/

'use strict';

// root url
let globalRootUrl;

$(function () {
  // load
  console.log('loaded');

  // logout 
  $('#logout').on('click', (e) => {
    console.log('logout clicked');
    // avoid double click
    e.preventDefault();
    // set to local storage
    ajaxAccess('my/logout', {});
  });
});

// get global root
const getGlobalRoot = (url) => {
  // set global mode
  globalRootUrl = url;
}

// post request
const ajaxAccess = (url, json, flg) => {
  // syncronize
  let defer = $.Deferred();
  // ajax
  $.ajax(globalRootUrl + '/' + url, {
    type: 'post', // POST
    data: JSON.stringify(json), // data
    dataType: 'json', // data type
    cache: false, // cahce
    async: true, // async
    timeout: 10000,
    contentType: 'application/json',
    crossDomain: true,
    xhrFields: {
      withCredentials: true
    }

  })
    // finished
    .done((data) => {
      window.location.href = data.url;
      defer.resolve(data);
    })
    // error
    .fail((e,er,err) => {
      if (flg) {
        window.location.reload();
      } else {
        console.log(err);
      }
    });
  // return promise
  return defer.promise();
};
