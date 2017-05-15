/ traversing vehicles json through an iterative loop

jsonfile.readFile(file, function(err, vehicles){
 for (var i = 0; i < vehicles.makes.length; i++){
 make = vehicles.makes[i];
 for (var j = 0; j < make.years.length; j++){
 year = make.years[j];
 for(var k = 0; k < year.models.length; k++){
 model = year.models[k];
 for(var l = 0; l < model.trims.length; l++){
 trim = model.trims[l];
 for(var m = 0; m < trim.engines.length; m++){
 engine = trim.engines[m];
 }
 }
 }
 }
 }
 });




// Recursive traversal of nested json structures
 function getObject(theObject) {
 var result = null;
 if(theObject instanceof Array) {
 for(var i = 0; i < theObject.length; i++) {
 result = getObject(theObject[i]);
 if (result) {
 break;
 }
 }
 }
 else
 {
 for(var prop in theObject) {
 console.log(prop + ': ' + theObject[prop]);
 if(prop == 'id') {
 if(theObject[prop] == 1) {
 return theObject;
 }
 }
 if(theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
 result = getObject(theObject[prop]);
 if (result) {
 break;
 }
 }
 }
 }
 return result;
 }

 jsonfile.readFile(file, function(err, vehicles){
 getObject(vehicles);
 });


my own callback function for appending an object to a json file.
 jsonfile.readFile(file, function(err, vehicles) {
 var newvehiclemake = {makename: "Kawasaki"};
 appendNewMake(vehicles, function (appendedObj) {
 jsonfile.writeFile(file, appendedObj, function (err) {
 if (err) console.log(err);
 console.log(appendedObj);
 })
 });

 ///// defined function
 function appendNewMake(obj, callback) {
 // define the "callback" parameter to accept callback functions
 obj.makes.push(newvehiclemake);
 var newobj = obj;
 return callback(newobj);
 // return callback arguments with the result value it is supposed to return
 }
 });
