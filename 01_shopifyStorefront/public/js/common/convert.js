/**
 * convert.js
 *
 * function： convert category name
 **/

'use strict';

$(function () {
  // convert table
  const convertTable = { 'ワイン': 'WINE', '赤ワイン': 'RED WINE', '白ワイン': 'WHITE WINE', 'スパークリングワイン': 'SPARKLING', 'ウィスキー': 'WHISKY', 'オリシャン': 'ORICIAN', 'オリジナルグラス': 'ORIGINAL GLASS' };
  // url convert table
  const urlConvertTable = { 'ワイン': '', '赤ワイン': 'RED WINE', '白ワイン': 'WHITE WINE', 'スパークリングワイン': 'SPARKLING', 'ウィスキー': 'WHISKY', 'オリシャン': 'ORICIAN', 'オリジナルグラス': 'ORIGINAL GLASS' };

  // load
  $(window).on('load', function () {
    // convert to english
    const convertToEnglish = function (word) {
      // return english category
      return convertTable[word];
    }
    // convert to english
    $('.category-standard').each(function (index, element) {
      const targetString = element.innerHTML.trim();
      const convertedString = convertToEnglish(targetString);
      element.innerHTML = convertedString;
    });
  });
});