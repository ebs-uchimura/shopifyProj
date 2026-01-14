/**
 * cart.js
 * function： cart operation
 **/

'use strict';

// root url
let globalRootUrl;

$(function () {
  // counter
  let globalCounterArray = new Array(100).fill(1);
  // load
  console.log('loaded');

  // delete 
  // delete buttons
  const deletebuttons = document.querySelectorAll('.deletebtn');
  // minus click
  deletebuttons.forEach((button) => {
    // minus click
    button.addEventListener('click', (e) => {
      console.log('delete clicked');
      // avoid double click
      e.preventDefault();
      /// target index
      const index = button.getAttribute('data-index');
      // price
      const tmpDelete = $(`#pid${index}`).val();
      // set to local storage
      ajaxAccess('my/cartdel', { 
        pid: tmpDelete,
      }, true);
    });
  });

  // minus buttons
  const minusbuttons = document.querySelectorAll('.minusbutton');
  // minus click
  minusbuttons.forEach((button) => {
    // minus click
    button.addEventListener('click', (e) => {
      console.log('minus clicked');
      // avoid double click
      e.preventDefault();
      // total
      let totalPrice = 0;
      // gross
      let grossPrice = 0;
      // price
      const pdPrice = $('.tmptotal');
      // target index
      const index = button.getAttribute('data-index');
      // amount over 0
      if (globalCounterArray[index] > 0) {
        // decrement amount
        globalCounterArray[index]--;
        // price
        const tmpPrice = $(`#price${index}`).val();
        // update num
        $(`#num${index}`).val(globalCounterArray[index]);
        // calc total
        totalPrice = tmpPrice * globalCounterArray[index];
        // show total
        $(`#tmptotal${index}`).val(totalPrice);
        // show total
        $(`#total${index}`).html(totalPrice.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }));
      }
      // calculate total
      for (let i=0;i<pdPrice.length; i++) {
        grossPrice += Number(pdPrice[i].value);
      }
      // show gross
      $('#grossprice').html(grossPrice.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }));
    });
  });

  // plus buttons
  const plusbuttons = document.querySelectorAll('.plusbutton');
  // plus click
  plusbuttons.forEach((button) => {
    // plus click
    button.addEventListener('click', (e) => {
      console.log('plus clicked');
      // avoid double click
      e.preventDefault();
      // total
      let totalPrice = 0;
      // gross
      let grossPrice = 0;
      // price
      const pdPrice = $('.tmptotal');
      // target index
      const index = button.getAttribute('data-index');
      // amount over 0
      if (globalCounterArray[index] > -1) {
        // increment amount
        globalCounterArray[index]++;
        // price
        const tmpPrice = $(`#price${index}`).val();
        // update num
        $(`#num${index}`).val(globalCounterArray[index]);
        // calc total
        totalPrice = tmpPrice * globalCounterArray[index];
        // show total
        $(`#tmptotal${index}`).val(totalPrice);
        // show total
        $(`#total${index}`).html(totalPrice.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }));
      }
      // calculate total
      for (let i=0;i<pdPrice.length; i++) {
        grossPrice += Number(pdPrice[i].value);
      }
      // show gross
      $('#grossprice').html(grossPrice.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }));
    });
  });

  // buybutton
  $('#buybutton').on('click', (e) => {
    console.log('buy clicked');
    // avoid double click
    e.preventDefault();
    let pidArray = [];
    let amountArray = [];
    // productid
    const pids = $('.productid');
    // amouts
    const amounts = $('.numarea');
    // gross
    const gross = $('#grossprice').html();

    // calculate total
    for (let i=0;i<pids.length; i++) {
      pidArray.push(pids[i].value);
      amountArray.push(amounts[i].value);
    }
    // set to local storage
    ajaxAccess('my/buy', { 
      pid: pidArray,
      amouts: amountArray,
      gross: gross,
    });
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
      console.log(data);
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
