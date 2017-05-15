var promiseRetry = require('promise-retry');
var random_ua = require('random-ua');
var Bottleneck = require("bottleneck");
var limiter = new Bottleneck(1, 2000);
var rp = require('request-promise');
var Promise = require('bluebird');
var jsonfile = Promise.promisifyAll(require('jsonfile'));
var fse = Promise.promisifyAll(require('fs-extra'));
var winston = Promise.promisifyAll(require('winston'));
winston.add(winston.transports.File, { filename: 'estimates.log' });

//json
var file = '/Users/Sif/Documents/scoutfix/webscraper/estimatedata/data.json';
jsonfile.spaces = 2;

var serviceNum = 12790;

var estimateObj;
var maxServiceNum = 13000;

//parsedjsonfile
var parsedJSON;
//if estimate was found in parsedjsonfile
var foundEstimate = false;
//new est object
var appendedEstimateObj;


function scrapeEstimates() {
    console.log('estimate ' + serviceNum + ' is being scraped');
    if(serviceNum > maxServiceNum){
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

    return promiseRetry(function (retry, number){
        if(number > 1) {
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
            var trimObj = JSON.parse(cleanestimatesjson);
            estimateObj = trimObj.estimates[0];
            return estimateObj;
        })
        .catch(function(err){
            if(err instanceof SyntaxError){
                winston.logAsync('info', 'JSON parse error at serviceNum: ' + serviceNum).then(function(logged){
                    serviceNum++
                    return scrapeEstimates(serviceNum);
                })
            }
        })
        .then(function (parseJSONfilehere) {
            return jsonfile.readFileAsync(file).then(function(object){
                parsedJSON = object;
                return searchEstimates();
            })
        })
        .then(function(estimatessearched){
            return appendEstimateDecision();
        })
        .then(function(returnedobj){
            if(foundEstimate === false) {
                return jsonfile.writeFileAsync(file, returnedobj).then(function (newobj) {
                    console.log('json file overwritten with estimate: ' + serviceNum);
                })
                    .then(function(shit){
                        if(serviceNum % 20 === 0 && serviceNum > 100) {
                            return fse.copyAsync('estimatedata/data.json', 'estimatedata/data' + serviceNum + '.json').then(function (err) {
                                console.log(err);
                                serviceNum++;
                                return scrapeEstimates(serviceNum);
                            })
                        }
                        else {
                            serviceNum++;
                            return scrapeEstimates(serviceNum);
                        }
                    })
            }
            else if(foundEstimate === true){
                foundEstimate = false;
                console.log('estimate was found, skipping rewrite and recursing');
                serviceNum++;
                return scrapeEstimates(serviceNum);
            }
        })
        .catch(function (err) {
            if(err.statusCode === 500){
                winston.logAsync('info', "network error " + err).then(function(logged){
                    serviceNum++;
                    return scrapeEstimates(serviceNum);
                })
            }
            return winston.logAsync('info', "unk error + " + err);
        })
}

function searchEstimates(){
    for(var i = 0; i < parsedJSON.zipcodes[0].vehicles[0].estimates.length; i++){
        if(parsedJSON.zipcodes[0].vehicles[0].estimates[i].service_id === serviceNum){
            console.log('estimate: ' + serviceNum + ' was found in json file');
            foundEstimate = true;
            return;
        }
    }
    return foundEstimate;
}

function appendEstimateDecision(){
    if(foundEstimate === false) {
        parsedJSON.zipcodes[0].vehicles[0].estimates.push(estimateObj);
        appendedEstimateObj = parsedJSON;
        console.log('estimate was not found, appending and returning estimateObj');
        return appendedEstimateObj;
    }
    else if (foundEstimate === true){
        console.log('estimate was found, skipping append');
        return foundEstimate;
    }
}

//main function to start script
scrapeEstimates();