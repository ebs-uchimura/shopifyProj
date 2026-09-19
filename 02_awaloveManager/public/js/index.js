/**
 * index.js
 *
 * function： LP画面用
 **/

'use strict';

// default url
const DEF_URL = 'https://manage.suijinclub.com';

// jQuery
(function ($) {
  
  $(function () {
    // update alert
    $('#update_button').click(function () {
      // show confirm dialog
      if (window.confirm('更新します。よろしいですか?')) {
        // yes
        return true;

      } else {
        // no
        return false;
      }
    });

    // register alert
    $('#register_button').click(function () {
      // show confirm dialog
      if (window.confirm('登録します。よろしいですか?')) {
        // yes
        return true;

      } else {
        // no
        return false;
      }
    });

    // * search
    // product id search
    $('#productidsearch').on('click', function (event) {
      // reset default form
      event.preventDefault();
      // delete all
      $('#multipleproducts').children().remove();
      // product name
      const productname = $('#productname').val();
      // header
      const headerArray = ['選択', 'ID', '商品名'];

      // send search request
      postSearch(
        '#multipleproducts', // result table id
        '/productid_search', // post url
        { productname: productname }, // post data
        headerArray, // header
        '#productid', // input box
        'productselects' // button class
      );
    });

    // product button operation
    $(document).on('click', '.productselects', function () {
      // selected radio button
      const val = $(this).val();
      // enter input box
      $('#productid').val(val);
      // close box
      $('.popup-box').fadeOut();
    });

    // user check
    $('.user_btn').on('click', function () {
      // no search word
      if (!$('#searchwd').val()) {
        return false;

      } else {
        // do check
        checkData('/check_user', '#user_form');
      }
    });

    // order check
    $('.order_btn').on('click', function () {
      // no search word
      if (!$('#searchwd').val()) {
        return false;

      } else {
        // do check
        checkData('/check_order', '#order_form');
      }
    });

    // clear
    $('.clear_btn').on('click', function () {
      // clear box
      $('#searchwd').val('');
      // clear check
      $('#radio01-1').prop('checked', true);
    });
  });
    
  const logout = function () {
    $.get('https://logout@manage.suijinclub.com/').always(function() {
      location.href = 'https://manage.suijinclub.com/';
    });
  }

  // check data
  const checkData = function (url, id) {
    // search word
    const searchwd = $('#searchwd').val();
    // selected mode
    const mode = $('input[name="radio01"]:checked').val();

    // post request
    $.ajax({
      type: 'GET', // get
      url: url, // url
      data: { searchwd: searchwd, mode: mode }, // data
    })
      .done(function (a) {
        // submit form
        $(id).submit();
      })
      
      .fail(function () {
        // show no data message
        $('#search_result').html('一致するデータがありません。');
        return false;
      });
  };

  // post search request
  const postSearch = function (id, url, data, head, inputid, inputclass) {
    // delete all
    $(id).children().remove();
    // post request
    $.ajax({
      type: 'POST', // post
      url: url, // url
      data: data, // data
      dataType: 'json', // data type
    })
      .done(function (response) {

        // multiple
        if (response.flg) {
          // add tr
          $(id).append('<tr>');
          // append header
          head.forEach(function (val) {
            $(id).append(`<th>${val}</th>`);
          });
          // add endof tr
          $(id).append('</tr>');

          // add content
          response.data.forEach(function (val2) {
            // add tr
            $(id).append('<tr>');
            // contentd
            const content = Object.values(val2);
            // add each rows
            $(id).append(
              `<td><button type='button' class='${inputclass}' value='${content[0]}'>選択</button></td>`
            );
            // add each rows
            content.forEach(function (cnt) {
              $(id).append(`<td>&emsp;${cnt}</td>`);
            });
            // add endof tr
            $(id).append('</tr>');
          });

          // single
        } else {
          // enter id
          $(inputid).val(response.data);
          // close box
          $('.popup-box').fadeOut();
        }
      })
      .fail(function (_, d, e) {
        // show error
        alert(e);
      });
  };
})(window.jQuery);
