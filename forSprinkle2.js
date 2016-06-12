var request = require("request");
var cheerio = require("cheerio");

const hours = 60*60*1000;
var downCounter = 0;                    // Main Counter of Motor ON
var accRain = 0.0;                      // Raining accumulation <= 14
var rainAverage;                        // average of 4 rain station
var sunriseHour = 6;                    // for comparison of sunrise time
var sunriseMinute = 0;                  // 
var sunsetHour = 18;                    // for comparison of sunset time
var sunsetMinute = 0;                   // 
var highTemp = 250;                     // Highest Temperature of the day *10

// var rain24 = function() {
//     var uri = "http://www.cwb.gov.tw/V7/observe/rainfall/Rain_Hr/4.htm";
//     request({url: uri, method: "GET"}, function(error, response, body) {
//         if (error || !body) {
//             console.log(error);
//             return;
//         }
//         if (response.statusCode == 200) {
//             var $ = cheerio.load(body); // 用 cheerio 解析 html 資料
//             var rain = $('font', 'tbody').map(function(i, el) {
//                 return $(this).text();
//             }).get();   // www.npmjs.com/package/cheerio 的sample code
//             rainAverage = 0;
//             for (var i=24; i<106; i=i+27) {
//                 if (!isNaN(rain[i])) rainAverage += parseFloat(rain[i]);
//             }
//             rainAverage = Math.round(rainAverage*30) / 100; // 20% higher than average
//             if (rainAverage > 14) rainAverage = 14;         // maximum setting for rainAverage = 1 week
//             if (rainAverage > accRain) accRain = rainAverage;
//         // console.log(  rain[24],rain[51],rain[78],rain[105], rainAverage, accRain  );
//         }
//     });
// };
// rain24();

var sun24 = function() {
    var uri = "http://www.cwb.gov.tw/V7/forecast/taiwan/Hsinchu_City.htm";
    request({url: uri, method: "GET"}, function(error, response, body) {
        if (error || !body) {
            console.log(error);
            return;
        }
        if (response.statusCode == 200) {
            var $ = cheerio.load(body); // 用 cheerio 解析 html 資料
            // 有3個table, 最高溫在1st個table
            var sun = $("table.FcstBoxTable01"); 
            var tt = sun.eq(0).map(function(i, el) {
                return $(this).text();
            }).get().join(' ');         // 不加空白或逗號，輸出會連載一起
            tt = tt.split(' ~ ');       // 切開成Array
            highTemp = parseInt(tt[1].slice(0,2), 10); // 當日最高溫切出來
            if ( (highTemp < 12) || isNaN(highTemp) ) highTemp = 12;
            if (highTemp >36) highTemp = 36;
            highTemp = highTemp * 10;
            if (highTemp > 360) highTemp = 360; // 120~360 Second
            if (highTemp < 120) highTemp = 120;
        console.log(highTemp);
            
            // 日出和日落在3rd個table
            tt = sun.eq(2).map(function(i, el) {
                return $(this).text();
            }).get().join(' '); 
            tt = tt.split('新竹\n\t');  // 切開成Array
            tt = tt[1].split('\n\t');   // 切開成Array
            sunriseHour = parseInt(tt[0].substring(0,2), 10);
            sunriseMinute = parseInt(tt[0].substring(3,5), 10);
            sunsetHour = parseInt(tt[1].substring(0,2), 10);
            sunsetMinute = parseInt(tt[1].substring(3,5), 10);
        console.log(sunriseHour, sunriseMinute, sunsetHour, sunsetMinute);
        }
    });
};
sun24();

// var pm25 = function() {
//     // var website = "http://taqm.epa.gov.tw/taqm/tw/Pm25Index.aspx";
//     var uri = "http://www.cwb.gov.tw/V7/observe/rainfall/Rain_Hr/4.htm";
//     request({url: uri, method: "GET"}, function(error, response, body) {
//         if (error || !body) {
//             console.log(error)
//             return;
//         }
//         if (response.statusCode == 200) {
//         // 爬完網頁後要做的事情
//             console.log(body);
//             var $ = cheerio.load(body); // 用 cheerio 解析 html 資料
//             var result = [];
//             var titles = $("area.jTip");
//             for (var i = 0; i < titles.length; i++) {
//                 result.push(titles.eq(i).attr('jtitle'));
//             }
            
//             fs.writeFile("result.json", result, function() {
//                 var varTime = new Date();
//                 for (var j = 0; j < result.length; j++) {
//                     var data = JSON.parse(result[j]);
//                     if(data.SiteName=='前鎮'){
//                         console.log(data.SiteName + ', PM2.5: '+ data.PM25 +' (' + varTime.toLocaleTimeString() + ')');
//                     }
//                 }
//             });
//         }
//     });
// };

// request({
//     method: 'GET',
//     url: 'https://github.com/showcases'
// }, function(err, response, body) {
//     if (err) return console.error(err);

//     // Tell Cherrio to load the HTML
//     var $ = cheerio.load(body);
//     $('li.collection-card').each(function() {
//             var href = $('a.collection-card-image', this).attr('href');
//             if (href.lastIndexOf('/') > 0) {
//                 console.log($('h3', this).text());
//             }
//     });
// });

