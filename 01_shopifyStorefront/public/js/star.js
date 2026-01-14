/**
 * star.js
 * function： review operation
 **/

'use strict';

// チャート作成用
const makeChartJs = (arr = "0, 0, 0, 0, 0") => {
  console.log(arr.split(","));
  // CanvasDOM
  let ctxDom;
  // 初期値以外
  if (arr != "0, 0, 0, 0, 0") {
    // dom
  const ctx = document.getElementById('myChart');

  if (ctx) {
    ctxDom = ctx.getContext('2d');
  

  const data = {
    labels: ['★★★★★', '★★★★☆', '★★★☆☆', '★★☆☆☆', '★☆☆☆☆'],
    datasets: [
      {
        label: '',
        data: arr.split(","),
        backgroundColor: '#e40014'
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        border: {
          display: false
        },
        ticks: {
          callback: function (value, index, values) {
            return '';
          }
        },
        grid: {
          display: false
        }
      },

      y: {
        ticks: {
          color: '#e40014',
          font: {
            size: 12
          },
          beginAtZero: true
        },
        border: {
          display: false
        },
        grid: {
          display: false
        }
      }
    }
  };
  // チャート
  new Chart(ctxDom, {
    type: 'bar',
    data: data,
    options: options
  });
  }
  }
}
