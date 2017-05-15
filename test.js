var Promise = require('bluebird');
var jsonfile = Promise.promisifyAll(require('jsonfile'));

var file = './services.json';
jsonfile.spaces = 2;

jsonfile.readFileAsync(file).then(function(obj){
    console.log(obj.services);
})

