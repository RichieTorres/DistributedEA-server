var async       = require('async');
var http        = require('http');
var MongoClient = require('mongodb').MongoClient;
var qs          = require('querystring');

var configuration = require("./config/config.js");
var Server        = require("./lib/Server.js");
var Timer         = require("./lib/timer.js");

var httpServer     = null;
var aServer        = null;
var aQueue         = null;
var initialTime    = null;
var queueCount     = 0;
var PARALELL_TASKS = 1;

var generalTimer   = new Timer();
var workTimer      = new Timer();
var requestTimer   = new Timer();
var deliverTimer   = new Timer();

function printReport() {
  generalTimer.stop();

  console.info("=== REPORT ===");
  console.info("Initial Time: "  + generalTimer.getInitialDate());
  console.info("End Time: "      + generalTimer.getEndDate());
  console.info("Total Duration:" + generalTimer.getTime());
  console.info("");
  console.info("Time work in server :" + workTimer.getTime());
  console.info("Request time :"        + requestTimer.getTime());
  console.info("Deliver time : "       + deliverTimer.getTime());
  console.info("");
  console.info("Total tasks completed:" + queueCount);
}

function processTask(task, callback) {
  workTimer.start();
  requestTimer.start();
  deliverTimer.start();

  aServer.processCommunication(task.data, function (error, answer) {
    if (error) {
      console.error(error);
    }

    if (answer === JSON.stringify({ok: true})) {
      deliverTimer.stop();
    } else {
      requestTimer.stop();

    }
    task.response.end(answer);

    if (answer === JSON.stringify({finalized: true})) {
      printReport();
    }
    callback();
  });
}

function finishedTask(err) {
  if (err) {
    console.error("ERROR en push " + err);
  }
  queueCount++;
  workTimer.stop();
}

function processHttpRequest(request, response) {
  if (0 === generalTimer.getInitialDate()) {
    generalTimer.start();
  }

  var requestBody = '';
  request.on('data', function (data) {
    requestBody += data;
  });
  request.on('end', function () {
    var formData = qs.parse(requestBody);

    ///Write in database parallel to queue process
    aServer.writeInDB();

    var aTask = {
      data: formData,
      response: response
    };

    /// add a task to the queue process
    aQueue.push(aTask, finishedTask);
  });
}

MongoClient.connect(configuration.urlMongo, function (err, db) {
  if (err) {
    console.error(err);
    console.error("Is MongoDB server running ?");
  } else {
    aServer = new Server(db, function (error) {
      if (error) {
        console.error("ERROR :"  + error);
      } else {

        // Start queue for client request
        aQueue = async.queue(processTask, PARALELL_TASKS);
        // Start HTTP server
        httpServer = http.createServer(processHttpRequest);
        httpServer.listen(configuration.httpPort);

        console.log('Server listening on port ' + configuration.httpPort);
        console.log('Start time :' + new Date());
      }
    });
  }
});
