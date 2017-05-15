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
var file = '/Users/Sif/Documents/scoutfix/webscraper/data/data.json';
jsonfile.spaces = 2;

var options = {
    url: 'https://www.openbay.com/api/v2/vehicles/makes',
    headers: {
        'User-Agent': random_ua.generate()
    },
    proxy: "http://us-ca.proxymesh.com:31280"
};


                                    ///Global variables
//Make Variables
var newMakeObj;
var obj; //obj is the first parsed object form the json file
var makeAppendedObj;
//Year Variables
var newYearObj;
var makeIndex;
var yearCreatedAndAppendedObject;
var yearCreatedAndAppended = false;
var yearFound = false;
var yearAppendedObj;
//Model Variables
var newModelObj;
var yearIndex;
var modelCreatedAndAppendedObject;
var modelCreatedAndAppended = false;
var modelFound = false;
var modelAppendedObj;
//Engine Variables
var newEngineObj;
var modelIndex;
var engineCreatedAndAppendedObject;
var engineCreatedAndAppended = false;
var engineFound = false;
var engineAppendedObj;
//Trim Variables
var newTrimObj;
var engineIndex;
var trimCreatedAndAppendedObject;
var trimCreatedAndAppended = false;
var trimFound = false;
var trimAppendedObj;

var start = new Date();
var reqCounter = 0;

rp(options)
        .then(function(rawdata) {
            reqCounter++;
            var rawMakeArr = [];
            var csvMakeArr = [];

            rawMakeArr = rawdata;
            //split the string by commas and return an array
            rawMakeArr = rawMakeArr.split(',');
            //for each item item in the array, find and remove quotation marks
            rawMakeArr.forEach(function(i){
                csvMakeArr.push(i.replace(/['"]+|/g, ''));
            });
            return csvMakeArr;
    })
    .then(function(csvmakesarr){
        var bracketlessMakeArr = [];
        var cleanMakeArr = [];
        //next makes to analyze
        var nextMakes = [
            'Toyota',
            'Volkswagen',
            'Volvo',
            'smart' ];
        //for each item in the array, find and remove brackets
        csvmakesarr.forEach(function(i){
            bracketlessMakeArr.push(i.replace(/\[|\]/g,''));
        });
        //for each item in the array, remove spaces
        bracketlessMakeArr.forEach(function(i){
            cleanMakeArr.push(i.trim());
        });
        return nextMakes;
    })//--------------------------------- Makes ---------------------------------------//
    .reduce(function(arr, makeitem){
        //create a make object from the given make item
        newMakeObj = {makename: makeitem};
        //return jsonfile method that reads the file using node.fs and then parses the json string in to object
        return jsonfile.readFileAsync(file).then(function(object){
            //make the value of obj equal to the parsed object from the json file
            obj = object;
            //console.log("json file has been read");
            //return the searchMake function that compares every make in the object to the newMakeObj.makename.
            return searchMake()
        })      //if there is a matching makename, found is returned true, else, found is returned false.
            .then(function(ifFoundMakeResult){
                //return the appendMakeDecision function. If found is true, this funciton returns the object that was read from the jsonfile method without modification.
                //If found is false, this function pushes a newMakeObject in to the obj function and returns the make appended object.
                return appendMakeDecision();
            })
            .then(function(makeCheckedObject){
                //console.log(makeCheckedObject);
                //writeFileAsync overwrites the json file with either the non-modified obj or the make appended obj, depending on what was
                //returned from the makeCheckedObject
                return jsonfile.writeFileAsync(file, makeCheckedObject).then(function(writtenobj){
                    //console.log("file was overwritten");
                })
            })//--------------------------------- Year -----------------------------

            .then(function(getyearsarr){
                var yearsURL = {
                    url: 'https://www.openbay.com/api/v2/vehicles/' + newMakeObj.makename + '/years',
                    headers: {
                    'User-Agent': random_ua.generate()
                     },
                     proxy: "http://us-ca.proxymesh.com:31280"
                    };
                    //retry
                return promiseRetry(function (retry, number){
                    if(number > 1) {
                        console.log('year attempt number', number);
                    }
                        //throttle all year requests
                    return limiter.schedule(rp, yearsURL)
                        .catch(retry);
                })

            })
            .then(function(rawyeardata) {
                reqCounter++;
                console.log("req count is " + reqCounter);
                end = new Date() - start;
                console.log("time passed since clocked in: " + end);
                //console.log("rawyeardata:" + rawyeardata);
                var rawYearArr = [];
                var csvYearArr = [];

                rawYearArr = rawyeardata;
                csvYearArr = rawYearArr.split(',');
                return csvYearArr;

            })
            .then(function(csvyearsarr){
                var bracketlessYearsArr = [];
                var cleanYearsArr = [];
                //for each item in the array, find and remove brackets
                csvyearsarr.forEach(function(i){
                    bracketlessYearsArr.push(i.replace(/\[|\]/g,''));
                });
                //for each item in the array, remove spaces
                bracketlessYearsArr.forEach(function(i){
                    cleanYearsArr.push(i.trim());
                });
                return cleanYearsArr;
            })
            //reduce the array of years
            .reduce(function(arr, yearitem) {
                //create a newYearObj for each year
                newYearObj = {year: yearitem};
                //console.log("starting to process year: " + newYearObj.year);
                //read the json file for each year
                return jsonfile.readFileAsync(file).then(function (makeappendedobj) {
                    //read json files at this point will be considered makeAppendedObj
                    makeAppendedObj = makeappendedobj;
                    //console.log("json file being read for year: " + newYearObj.year);
                    //call the getMakeIndex function that looks for the index of the make associated with this particular year
                    return getMakeIndex();
                })   //the makeIndex will be set at this point
                    .then(function (makeindexset) {
                        //console.log(newYearObj.year + " has makeIndex of " + makeIndex);
                       // console.log('checking for year property for year: ' + newYearObj.year);
                        //call the  hasYear function that checks if the make has the year property that will
                        //either create a and append years with the year or return the makeAppendedObj
                        return hasYear();
                    })
                    .then(function (yearappenddecision) {
                        //call the yearAppendDecision that will either return a makeAppendedObj, yearCreatedAndAppendedObj, or yearAppendedObj
                        return yearAppendDecision();
                    })
                    //this promise has the object returned from yearAppendDecision
                    .then(function (yearcheckedvehicleobj) {
                        //call the jsonwrite method that will overwrite the json file with the returned object
                        return jsonfile.writeFileAsync(file, yearcheckedvehicleobj).then(function (yearAppendedJSON) {
                            //console.log("file was overwritten for years");
                            //reset the truth states to default for the next index in years
                            yearCreatedAndAppended = false;
                            yearFound = false;
                        })
                    })//--------------------------------- Model --------------------
                    .then(function(getmodelsarr){
                        var modelsURL = {
                            url: 'https://www.openbay.com/api/v2/vehicles/' + newYearObj.year + '/' + newMakeObj.makename,
                            headers: {
                                'User-Agent': random_ua.generate()
                            },
                            proxy: "http://us-ca.proxymesh.com:31280"
                            };

                        return promiseRetry(function (retry, number){
                            if(number > 1) {
                                console.log('model attempt number', number);
                            }
                            //throttle all year requests
                            return limiter.schedule(rp, modelsURL)
                                .catch(retry);
                        })
                    })
                    .then(function(rawmodeldata) {
                        reqCounter++;
                        console.log("req count is " + reqCounter);
                        end = new Date() - start;
                        console.log("time passed since clocked in: " + end);
                        //console.log("rawmodeldata:" + rawmodeldata);
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
                        // read json file for each model
                        return jsonfile.readFileAsync(file).then(function (yearappendedobj) {
                            //parsed object from json file is treated as yearAppendedObj
                            yearAppendedObj = yearappendedobj;
                            //console.log("json file being read for model: " + newModelObj.modelname);
                            return getMakeIndex();
                        })
                            .then(function (makeindexset) {
                                //console.log(newModelObj.modelname + " has makeIndex of " + makeIndex);
                                return getYearIndex();
                            })
                            .then(function (setyearindex) {
                                //checks if there is a model that matches the newModelObj.modelname
                                return hasModel();
                            })
                            .then(function (checkedmodel) {
                                //Returns one of 3 possible objects
                                return modelAppendDecision();
                            })
                            .then(function (createdorreturnedmodel) {
                                //overwrites the json file with the object returned from the prior function
                                return jsonfile.writeFileAsync(file, createdorreturnedmodel).then(function (modelAppendedJSON) {
                                    //console.log("file was overwritten for models");
                                    //resert the truth states to default
                                    modelCreatedAndAppended = false;
                                    modelFound = false;
                                })
                            })//--------------------------------- Engine ---------------------------------------//
                            .then(function(getenginessarr){
                                var enginesURL = {
                                    url: 'https://www.openbay.com/api/v2/vehicles/' + newYearObj.year + '/' + newMakeObj.makename + '/' + newModelObj.modelname,
                                    headers: {
                                        'User-Agent': random_ua.generate()
                                    },
                                    proxy: "http://us-ca.proxymesh.com:31280"
                                };

                                return promiseRetry(function (retry, number){
                                    if(number > 1) {
                                        console.log('engine attempt number', number);
                                    }
                                    //throttle all year requests
                                    return limiter.schedule(rp, enginesURL)
                                        .catch(retry);
                                })
                            })
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
                                return colon;
                            })
                            .then(function(cleanjson){
                                var engineArr = JSON.parse(cleanjson);
                                return engineArr
                            })
                            .reduce(function(arr, engineobj) {
                                newEngineObj = engineobj;
                                newEngineObj.enginename = newEngineObj.engine;
                                delete newEngineObj.engine;
                                //console.log("start to process engine:" + newEngineObj.enginename + " for model: " + newModelObj.modelname);
                                return jsonfile.readFileAsync(file).then(function (modelappendedobj) {
                                    modelAppendedObj = modelappendedobj;
                                    //console.log(modelAppendedObj);
                                    //console.log("json file being read for " + newEngineObj.enginename + "for model: " + newModelObj.modelname);
                                    return getMakeIndex();
                                })
                                    .then(function (makeindexset) {
                                        //console.log(newEngineObj.enginename + " has makeIndex of " + makeIndex);
                                        return getYearIndex();
                                    })
                                    .then(function (yearindexset) {
                                        //console.log(newEngineObj.enginename + "has yearIndex of " + yearIndex);
                                        return getModelIndex();
                                    })
                                    .then(function (modelindexset) {
                                        //console.log(newEngineObj.enginename + "has modelIndex of " + modelIndex);
                                        return hasEngine();
                                    })
                                    .then(function (checkedengine) {
                                        return engineAppendDecision();
                                    })
                                    .then(function (createdorreturnedengine) {
                                        return jsonfile.writeFileAsync(file, createdorreturnedengine).then(function (engineAppendedJSON) {
                                            //console.log("file was overwritten for engines");
                                            engineCreatedAndAppended = false;
                                            engineFound = false;
                                        })
                                    })//--------------------------------- Trim ----------------
                                    .then(function(gettrimsarr){
                                        var dirtyEngineParam = newEngineObj.enginename;
                                        // replace . with !
                                        var exclamations = dirtyEngineParam.replace(/\./g, '!');
                                        //replace spaces with %20
                                        var engineParam = exclamations.replace(/ /g, '%20');

                                        var trimsURL = {
                                            url: 'https://www.openbay.com/api/v2/vehicles/' + newYearObj.year + '/' + newMakeObj.makename + '/' + newModelObj.modelname + '/' + engineParam,
                                            headers: {
                                                'User-Agent': random_ua.generate()
                                            },
                                            proxy: "http://us-ca.proxymesh.com:31280"
                                        };

                                        return promiseRetry(function (retry, number){
                                            if(number > 1) {
                                                console.log('trim attempt number', number);
                                            }
                                            //throttle all year requests
                                            return limiter.schedule(rp, trimsURL)
                                                .catch(retry);
                                        })
                                    })
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
                                        var trimArr = JSON.parse(cleantrimjson);
                                        return trimArr
                                    })
                                    .reduce(function(arr, trimobj){
                                        newTrimObj = trimobj;
                                        newTrimObj.trimname = newTrimObj.trim;
                                        delete newTrimObj.trim;
                                        return jsonfile.readFileAsync(file).then(function(engineappendedobj){
                                            engineAppendedObj = engineappendedobj;
                                            //console.log("json file being read for enginename: " + newTrimObj.trimname);
                                            return getMakeIndex();
                                        })
                                            .then(function(setmakeindex){
                                                return getYearIndex();
                                            })
                                            .then(function(setyearindex){
                                                return getModelIndex();
                                            })
                                            .then(function(setmodelindex){
                                                return getEngineIndex();
                                            })
                                            .then(function(settrimindex){
                                                return hasTrim();
                                            })
                                            .then(function(checkedengine){
                                                return trimAppendDecision();
                                            })
                                            .then(function(returnedorappendedtrimobj){
                                                return jsonfile.writeFileAsync(file, returnedorappendedtrimobj).then(function(trimappendedJSON){
                                                    console.log("file was overwritten for " + newMakeObj.makename + " " + newYearObj.year + " " + newModelObj.modelname + " " + newEngineObj.enginename + " " + newTrimObj.trimname);
                                                    trimCreatedAndAppended = false;
                                                    trimFound = false;
                                                })
                                            })
                                            .then(function(shit){
                                                if(reqCounter % 20 === 0 && reqCounter > 100) {
                                                    return fse.copyAsync('data/data.json', 'data/data' + reqCounter + '.json').then(function (err) {
                                                        console.log(err);
                                                    })
                                                }
                                                else {
                                                    return reqCounter;
                                                }
                                            })
                                    }, 0)
                            }, 0)
                    }, 0)
            }, 0)
    }, 0)
    .catch(function(err){
        console.log(err);
        // Set to `true` if the timeout was a read timeout
        console.log("read timeout: " + err.code === 'ETIMEDOUT');
        // `undefined` otherwise.
        console.log("connection timout: " + err.connect === true);
    });

/// Make functions ------------
//compares every make in the json to the data received. If there is a match
//found = true and break out of the function
function searchMake(){
    //if file object has the existing make return obj, else set found to false and return
    //console.log("searching for make: " + newMakeObj.makename);
    for (var i = 0; i < obj.makes.length; i++) {
        if (obj.makes[i].makename === newMakeObj.makename) {
            found = true;
            break;
        }
        else {
            found = false;
        }
    }
    return found;
}

function appendMakeDecision(){
//if found is true, return object, else push newMakeObj to obj and return the object AKA makeAppendedObj
    if(found == true){
        //console.log("make: " + newMakeObj.makename+ "exists in json structure, so skipping this write");
        return obj;
    }
    //if make does not exist already, push the make in to the vehicle object
    // and return the new object to the callback
    else if (found == false) {
        //console.log(newMakeObj.makename + "was not found in makes so it is being pushed to the makes array in the vehicle object");
        obj.makes.push(newMakeObj);
        makeAppendedObj = obj;
        return makeAppendedObj;
    }
}

////YEAR FUNCTIONS ----------
function getMakeIndex() {
    //loops through all the makes to find the make that is associated with this year
    for (var i = 0; i < obj.makes.length; i++) {
        if (obj.makes[i].makename === newMakeObj.makename) {
            makeIndex = i;
            break;
        }
    }
}

function hasYear() {
    //if make does not have the year property, create the year property and push newYearObj to it
    if (makeAppendedObj.makes[makeIndex].hasOwnProperty("years") == false) {
        makeAppendedObj.makes[makeIndex].years = [];
        makeAppendedObj.makes[makeIndex].years.push(newYearObj);
        // push year to the associated make
        yearCreatedAndAppendedObject = makeAppendedObj;
        //console.log("years array did not exist so a new years array was created and new year pushed in to it");
        yearCreatedAndAppended = true;
        return yearCreatedAndAppendedObject;
    }
    //if make has the year property, check if there is the newVehicleYear matches the year in the json object.
    //If there is a match, return the makeAppendedObj without modifying the object
    else if (makeAppendedObj.makes[makeIndex].hasOwnProperty("years") == true) {
        for (var j = 0; j < makeAppendedObj.makes[makeIndex].years.length; j++) {
            if (makeAppendedObj.makes[makeIndex].years[j].year === newYearObj.year) {
                yearFound = true;
                //console.log("year property exists so a new year property will not be created on make");
                return makeAppendedObj;
            }
            //this for loop and conditional loops through the years array and checks if there is a year
            //in the json that matches the year to be added. if found, found=true and break to determine
            //whether to return the object or push the data to the array.
        }
    }
}
//Function with three possible decision paths
function yearAppendDecision(){
    //1. if year property was created & appended, return the yearCreatedAndAppendedObj
    if(yearCreatedAndAppended == true){
        return yearCreatedAndAppendedObject;
        //console.log("a newly created year property and the year data was pushed to the object")
    }
    //2. if the particular year is found, return makeAppendedObj
    else if (yearFound == true) {
        //console.log("existing year found, exiting function");
        return makeAppendedObj;
        //existing year was found so return the object back to the callback
    }
    //3. if the particular year is not found,
    // push the year object to the makeAppendedObj and return yearAppendedObj
    else if (yearFound == false) {
        makeAppendedObj.makes[makeIndex].years.push(newYearObj);
        // push year to the associated make
        yearAppendedObj = makeAppendedObj;
        //write new object to the json file
        //console.log("year property exists, but existing year was not found so year data is being pushed to object")
        return yearAppendedObj;
        //an existing year was found to be false so push the new year to the array and return
        // the new object to callback function invocation
    }
}
////Model FUNCTIONS ----------

// getMakeIndex()

function getYearIndex() {
    //loops through all the makes to find the make that is associated with this year
    for (var i = 0; i < yearAppendedObj.makes[makeIndex].years.length; i++) {
        if (yearAppendedObj.makes[makeIndex].years[i].year === newYearObj.year) {
            yearIndex = i;
            break;
        }
    }
}

function hasModel() {
    //if yearAppendedObj does not have the year property, create the year property and push newYearObj to it
    if (yearAppendedObj.makes[makeIndex].years[yearIndex].hasOwnProperty("models") == false) {
        yearAppendedObj.makes[makeIndex].years[yearIndex].models = [];
        yearAppendedObj.makes[makeIndex].years[yearIndex].models.push(newModelObj);
        //rename this modified object
        modelCreatedAndAppendedObject = yearAppendedObj;
        //console.log("models array did not exist so a new models array was created and new model pushed in to it");
        modelCreatedAndAppended = true;
        return modelCreatedAndAppendedObject;
    }
    //if make has the year property, check if there is the newVehicleYear matches the year in the json object.
    //If there is a match, return the makeAppendedObj without modifying the object
    else if (yearAppendedObj.makes[makeIndex].years[yearIndex].hasOwnProperty("models") == true) {
        for (var j = 0; j < yearAppendedObj.makes[makeIndex].years[yearIndex].models.length; j++) {
            if (yearAppendedObj.makes[makeIndex].years[yearIndex].models[j].modelname === newModelObj.modelname) {
                modelFound = true;
                //console.log("year property exists so a new year property will not be created on make");
                return yearAppendedObj;
            }
            //this for loop and conditional loops through the years array and checks if there is a year
            //in the json that matches the year to be added. if found, found=true and break to determine
            //whether to return the object or push the data to the array.
        }
    }
}

function modelAppendDecision(){
    //Three possible decision paths
    //1. return the modelCreatedAndAppendedObj
    if(modelCreatedAndAppended == true){
        return modelCreatedAndAppendedObject;
        //console.log("a newly created model property and the model data was pushed to the object")
    }
    //2.return yearAppendedObj
    else if (modelFound == true) {
        //console.log("existing model found, exiting function");
        return yearAppendedObj;
        //existing model was found so return the object back to the callback
    }
    //3. push the model object to the yearAppendedObj and return this modelAppendedObj
    else if (modelFound == false) {
        yearAppendedObj.makes[makeIndex].years[yearIndex].models.push(newModelObj);
        // push model to the associated year
        modelAppendedObj = yearAppendedObj;
        //write new object to the json file
        //console.log("model property exists, but existing model was not found so model data is being pushed to object")
        return modelAppendedObj;
        //an existing model was found to be false so push the new model to the array and return
        // the new object to callback function invocation
    }
}
//Engine Function ------------

//getMakeIndex()

//getYearIndex()

function getModelIndex() {
    //loops through all the makes to find the make that is associated with this year
    for (var i = 0; i < modelAppendedObj.makes[makeIndex].years[yearIndex].models.length; i++) {
        if (modelAppendedObj.makes[makeIndex].years[yearIndex].models[i].modelname === newModelObj.modelname) {
            modelIndex = i;
            break;
        }
    }
}

function hasEngine() {
    //if  not have the year property, create the engine property and push newYearObj to it
    if (modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].hasOwnProperty("engines") == false) {
        modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines = [];
        modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines.push(newEngineObj);
        // push year to the associated make
        engineCreatedAndAppendedObject = modelAppendedObj;
        //console.log("engines array did not exist so a new engines array was created and new engine object pushed in to it");
        engineCreatedAndAppended = true;
        return engineCreatedAndAppendedObject;
    }
    //if make has the year property, check if there is the newVehicleYear matches the year in the json object.
    //If there is a match, return the makeAppendedObj without modifying the object
    else if (modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].hasOwnProperty("engines") == true) {
        for (var j = 0; j < modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines.length; j++) {
            if (modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[j].enginename === newEngineObj.enginename) {
                engineFound = true;
                //console.log("engine property exists so a new engine property will not be created on model");
                return engineAppendedObj;
            }
            //this for loop and conditional loops through the years array and checks if there is a year
            //in the json that matches the year to be added. if found, found=true and break to determine
            //whether to return the object or push the data to the array.
        }
    }
}

function engineAppendDecision(){
    //Three possible decision paths
    //1. return the trimCreatedAndAppendedObj
    if(engineCreatedAndAppended == true){
        return engineCreatedAndAppendedObject;
        //console.log("a newly created engine property and the engine data was pushed to the object")
    }
    //2.return yearAppendedObj
    else if (engineFound == true) {
        //console.log("existing engine found, exiting function");
        return modelAppendedObj;
        //existing engine was found so return the object back to the callback
    }
    //3. push the engine object to the yearAppendedObj and return this engineAppendedObj
    else if (engineFound == false) {
        modelAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines.push(newEngineObj);
        // push engine to the associated year
        engineAppendedObj = modelAppendedObj;
        //write new object to the json file
        //console.log("engine property exists, but existing engine was not found so engine data is being pushed")
        return engineAppendedObj;
        //an existing engine was found to be false so push the new engine to the array and return
        // the new object to callback function invocation
    }
}
//Trim Function ------------

//getMakeIndex

//getYearIndex

//getModelIndex()

function getEngineIndex() {
    //loops through all the makes to find the make that is associated with this year
    for (var i = 0; i < engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines.length; i++) {
        if (engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[i].enginename === newEngineObj.enginename) {
            engineIndex = i;
            break;
        }
    }
}

function hasTrim() {
    //if makeyears not have the year property, create the year property and push newYearObj to it
    if (engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].hasOwnProperty("trims") == false) {
        engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].trims = [];
        engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].trims.push(newTrimObj);
        // push year to the associated make
        trimCreatedAndAppendedObject = engineAppendedObj;
        //console.log("trims array did not exist so a new trims array was created and new trim object pushed in to it");
        trimCreatedAndAppended = true;
        return trimCreatedAndAppendedObject;
    }
    //if make has the year property, check if there is the newVehicleYear matches the year in the json object.
    //If there is a match, return the makeAppendedObj without modifying the object
    else if (engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].hasOwnProperty("trims") == true) {
        for (var j = 0; j < engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].trims.length; j++) {
            if (engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].trims[j].trimname === newTrimObj.trimname) {
                trimFound = true;
                //console.log("trim was found so a new array will not be created");
                return engineAppendedObj;
            }
            //this for loop and conditional loops through the years array and checks if there is a year
            //in the json that matches the year to be added. if found, found=true and break to determine
            //whether to return the object or push the data to the array.
        }
    }
}
function trimAppendDecision(){
    //Three possible decision paths
    //1. return the trimCreatedAndAppendedObj
    if(trimCreatedAndAppended == true){
        return trimCreatedAndAppendedObject;
        //console.log("a newly created trim property and the trim object was pushed to the array")
    }
    //2.return yearAppendedObj
    else if (trimFound == true) {
        //console.log("existing trim found, exiting function");
        return engineAppendedObj;
        //existing trim was found so return the object back to the callback
    }
    //3. push the trim object to the yearAppendedObj and return this trimAppendedObj
    else if (trimFound == false) {
        engineAppendedObj.makes[makeIndex].years[yearIndex].models[modelIndex].engines[engineIndex].trims.push(newTrimObj);
        // push trim to the associated year
        trimAppendedObj = engineAppendedObj;
        //write new object to the json file
        //console.log("trim property exists, but existing trim was not found so trim data is being pushed")
        return trimAppendedObj;
        //an existing trim was found to be false so push the new trim to the array and return
        // the new object to callback function invocation
    }
}



/*
'http://api.trove.nla.gov.au/result?key=6k6oagt6ott4ohno&zone=book&q-year1-date=2000&l-advformat=Thesis&l-australian=y&q-term2=&q-term3=&q-term0=&q-field1=title%3A&q-type2=all&q-field0=&q-term1=&q-type3=all&q-field3=subject%3A&q-type0=all&q-field2=creator%3A&q-type1=all&l-availability=y%2Ff&q=+date%3A[2000+TO+2014]&q-year2-date=2014&n=1
*/