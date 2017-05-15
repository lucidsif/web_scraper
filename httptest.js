var promiseRetry = require('promise-retry');
var random_ua = require('random-ua');
var Bottleneck = require("bottleneck");
var limiter = new Bottleneck(1, 2000);
var Promise = require('bluebird');
var jsonfile = Promise.promisifyAll(require('jsonfile'));
var fse = Promise.promisifyAll(require('fs-extra'));
var cheerio = require('cheerio');
var rp = require('request-promise');
//json
var file = '/Users/Sif/Documents/scoutfix/webscraper/estimatedata/data.json';


var serviceNum = 1550;

var estimateObj;
var maxServiceNum = 12791;

//parsedjsonfile
var parsedJSON;
//if estimate was found in parsedjsonfile
var foundEstimate = false;
//new est object
var appendedEstimateObj;


function scrapeEstimates() {
    console.log('estimate ' + serviceNum + ' is being scraped');
    if (serviceNum > maxServiceNum) {
        var done = "all estimates have been scraped, serviceNum is: " + serviceNum;
        console.log(done);
        return;
    }
    var dataURL = {
        url: 'https://www.openbay.com/api/v2/estimate?vehicle_sha=257&zipcode=11436&&services[]=' + serviceNum,
        headers: {
            'User-Agent': random_ua.generate()
        },
        proxy: "http://us-ca.proxymesh.com:31280"
    };

    return promiseRetry(function (retry, number) {
        if (number > 1) {
            console.log('attempt number', number);
        }
        //throttle all year requests
        return limiter.schedule(rp, dataURL)
            .catch(retry);
    }, options = {retries: 3})
        .then(function (stringdata) {
            //console.log(stringdata);
            var oneQuote = stringdata;
            //replace : with "
            oneQuote = oneQuote.replace(/:/g, '"');
            //replace = with "
            var twoQuote = oneQuote.replace(/=/g, '"');
            // replace > with : & 1 space
            var colon = twoQuote.replace(/>/g, ': ');
            //quote nil
            var stringifyNil = colon.replace(/nil/g, '"nil"');
            //remove redundant quotes
            var delDoubleQuotes = stringifyNil.replace(/""/g, '"');
            // replace characters for service 765
            var delPoorParsedQuotes = delDoubleQuotes.replace(/service"  A" oil change 1" tire rotation 4"/g, 'service: A= oil change 1= tire rotation 4=');
            //remove escape characters in the middle of strings
            var removeEscape = delPoorParsedQuotes.replace(/ \\"/g, ' ');
            //remove escape characters at end of string
            var removeEndEscape = removeEscape.replace(/\\/g, '');
            //include numbered items in quotes
            var includeNumbers = removeEndEscape.replace(/" 1./g, ' 1.');

            return includeNumbers;
        })
        .then(function (cleanestimatesjson) {
            console.log(cleanestimatesjson);
            //var trimObj = JSON.parse(cleanestimatesjson);
            //estimateObj = trimObj.estimates[0];
            //console.log(estimateObj);
            //return estimateObj;
        })
       // .then(function (obj) {
       //     console.log(obj);
       // })
        .catch(function (err) {
            console.log(err);
        })
}

scrapeEstimates();



/*
console.log(obj.zipcodes[0].vehicles[0].estimates);
console.log(estimateObj);
*/
/*
var newObj;
newObj = obj.zipcodes[0].vehicles[0].estimates.push(test2);
console.log(newObj);



// parses veloster remix data properly
/*
rp(options)
    .then(function(stringdata){
        reqCounter++;
        console.log("req count is " + reqCounter);
        //console.log(stringdata);
        var oneQuote = stringdata;
        //replace : with "
        oneQuote = oneQuote.replace(/:/g,'"');
        //replace = with "
        var twoQuote = oneQuote.replace(/=/g, '"');
        // replace > with : & 1 space
        var colon = twoQuote.replace(/>/g, ': ');
        //remove escaped double quotes
        var removedRemixQuote = colon.replace(/"RE"/g, '"RE')
        return removedRemixQuote;
    })
    .then(function(cleantrimjson){
        console.log(cleantrimjson);
        var trimArr = JSON.parse(cleantrimjson);
        console.log(trimArr[4]);
        return trimArr
    })
    .catch(function(err){
        console.log(err)
    })
*/




//promise retry
/*
promiseRetry(function (retry, number) {
    console.log('attempt number', number);
    return rp(options)
        .catch(retry);
})
    .then(function(data){
        {
            options2 = {
                url: 'https://www.openbay.com/api/v2/vehicles/makes',
                proxy: 'http://fr.proxymesh.com:31280'
            }
            console.log(data);
            return promiseRetry(function (retry, number){
                console.log('attempt number', number);
                return rp(options2)
                    .catch(retry);
            })
        }
    })
    .then(function(data2){
        console.log("models for bmw: " + data2);
    })
    .catch(function(err){
        console.log(err);
    })
   */
/*
rp(options)
    .then(function(objdata){
        var objectified = JSON.parse(objdata);
        console.log(objectified);
    })
   /* .then(function(rawmodeldata) {
        console.log("rawmodeldata:" + rawmodeldata);
        var rawModelArr = [];
        var csvModelArr = [];

        rawModelArr = rawmodeldata;
        //delimit items in array by commas
        rawModelArr = rawModelArr.split(',');
        //for each item item in the array, find and remove quotation marks
        rawModelArr.forEach(function(i){
            csvModelArr.push(i.replace(/['"]+|/g, ''));
        });
        return csvModelArr;

    })
    .then(function(csvmodelsarr){
        var bracketlessModelsArr = [];
        var cleanModelsArr = [];
        //for each item in the array, find and remove brackets
        csvmodelsarr.forEach(function(i){
            bracketlessModelsArr.push(i.replace(/\[|\]/g,''));
        });
        //for each item in the array, remove spaces
        bracketlessModelsArr.forEach(function(i){
            cleanModelsArr.push(i.trim());
        });
        return cleanModelsArr;
    })
    //reduce the array of models
    .reduce(function(results, modelItem) {
        // create newModelobj for each model
        newModelObj = {modelname: modelItem};
        console.log("model name being processed: " + newModelObj.modelname);
        })
    .catch(function(err){
        console.log(err);
    });
*/
/*
//Models REST API Response Data Cleaner
rp(options)
    .then(function(rawmodeldata) {
        console.log("rawmodeldata:" + rawmodeldata);
        var rawModelArr = [];
        var csvModelArr = [];

        rawModelArr = rawmodeldata;
        //delimit items in array by commas
        rawModelArr = rawModelArr.split(',');
        //for each item item in the array, find and remove quotation marks
        rawModelArr.forEach(function(i){
            csvModelArr.push(i.replace(/['"]+|/g, ''));
        });
        return csvModelArr;

    })
    .then(function(csvmodelsarr){
        var bracketlessModelsArr = [];
        var cleanModelsArr = [];
        //for each item in the array, find and remove brackets
        csvmodelsarr.forEach(function(i){
            bracketlessModelsArr.push(i.replace(/\[|\]/g,''));
        });
        //for each item in the array, remove spaces
        bracketlessModelsArr.forEach(function(i){
            cleanModelsArr.push(i.trim());
        });
        return cleanModelsArr;
    })
    //reduce the array of models
    .reduce(function(results, modelItem) {
        // create newModelobj for each model
        newModelObj = {modelname: modelItem};
        console.log("model name being processed: " + newModelObj.modelname);
        })
    .catch(function(err){
        console.log(err);
    });
*/


/*
'http://api.trove.nla.gov.au/result?key=6k6oagt6ott4ohno&zone=book&q-year1-date=2000&l-advformat=Thesis&l-australian=y&q-term2=&q-term3=&q-term0=&q-field1=title%3A&q-type2=all&q-field0=&q-term1=&q-type3=all&q-field3=subject%3A&q-type0=all&q-field2=creator%3A&q-type1=all&l-availability=y%2Ff&q=+date%3A[2000+TO+2014]&q-year2-date=2014&n=1
*/
/*
var newMakeObj = {makename: "BMW"};
var newYearObj = {year: 2008};
var yearsURL = {url: 'https://www.openbay.com/api/v2/vehicles/' + newMakeObj.makename + '/years'};
var modelsURL = {url: 'https://www.openbay.com/api/v2/vehicles/' + newYearObj.year + '/' + newMakeObj.makename};
    */