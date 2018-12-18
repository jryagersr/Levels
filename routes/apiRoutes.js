const mongoose = require("mongoose");
var express = require("express"),
  app = express(),
  request = require("request"),
  _ = require("underscore"),
  fs = require('fs');

var txData = [];

// Require all models
var db = require("../models")();

// // Connect to the Mondo DB
// var databaseUri = 'mongodb://localhost/BassSavvyTestDb';

// if (process.env.MONGODB_URI) {
//   db.connect(process.env.MONGODB_URI);
// } else {
//   db.connect(databaseUri);
// }

// ===============================================================================
// ROUTING
// ===============================================================================

module.exports = function (app) {
  var request = require("request");
  // API GET Requests
  // ---------------------------------------------------------------------------

  // Route to retrieve a single lake's data from db
  // app.get("/api/lakes/:lakeName", function (req, res) {
  //   let lakeName = req.params.lakeName
  //   db.model("Lake").find({ name: lakeName })
  //     .exec(function (err, data) {
  //       if (err) {
  //         res.send(lakeName + " lake data not found");
  //       } else {
  //         res.json(data)
  //       }
  //     })
  // })


  //Route to retrieve lakes in a specific state
  app.get("/api/states/:stateInitial", function (req, res) {
    let stateInitial = req.params.stateInitial;
    db.model("Lake").find({ state: stateInitial })
      .exec(function (err, data) {
        if (err) {
          res.send("No data found for " + state);
        } else {
          res.json(data);
        }
      })
  })

  // Route to retrieve ACE data for Kerr Lake
  app.get("/api/kerr", function (request, response) {
    var url = "http://epec.saw.usace.army.mil/dsskerr.txt";
    var indexes = [0, 1, 2, 3, 4]
    getData(10, "Kerr", indexes, url, function (error, data) {
      if (error) {
        response.send(error);
        return;
      }
      else {
        response.json(data.reverse());
      }
    });

    // Function to pull data
    function getData(col, lakeName, indexes, newUrl, callback) {
      var request = require("request");
      var data = [];

      var options = {
        url: newUrl
      }
      request(options, function (error, response, body) {
        if (error) {
          callback(error);
        }
        _.each(body.split("\r\n"), function (line) {
          // Split the text body into readable lines
          var splitLine;
          line = line.trim();
          splitLine = line.split(/[ ]+/);
          // Check to see if this is a data line
          // Column length and first two characters must match
          if (splitLine.length === col && !isNaN(parseInt(line.substring(0, 2)))) {
            // Loop through each cell and check for missing data
            for (var i = 0; i < splitLine.length; i++) {
              if (splitLine[i].substring(0, 1) === "?" || splitLine[i] == -99) {
                splitLine[i] = "N/A";
              }
            }
            // Formulate the date to remove Month
            let cleanDate = splitLine[indexes[0]].substring(0, 2) + " " + splitLine[indexes[0]].substring(2, 5);
            // Push each line into data object
            data.push({
              lakeName: lakeName,
              date: cleanDate,
              time: splitLine[indexes[1]],
              inflow: splitLine[indexes[2]],
              outflow: splitLine[indexes[3]],
              level: splitLine[indexes[4]]
          });

          }
        });
        callback(null, data);
      });
    }


  });

  // Route to retrieve ACE data for Jordan Lake
  app.get("/api/jordan", function (request, response) {
    var url = "http://epec.saw.usace.army.mil/dssjord.txt";
    var indexes = [0, 1, 8, 9, 10]
    getData(11, "Jordan", indexes, url, function (error, data) {
      if (error) {
        response.send(error);
        return;
      }
      else {
        response.json(data.reverse());
      }
    });

    // Function to pull data
    function getData(col, lakeName, indexes, newUrl, callback) {
      var request = require("request");
      var data = [];

      var options = {
        url: newUrl
      }
      request(options, function (error, response, body) {
        if (error) {
          callback(error);
        }
        _.each(body.split("\r\n"), function (line) {
          // Split the text body into readable lines
          var splitLine;
          line = line.trim();
          splitLine = line.split(/[ ]+/);
          // Check to see if this is a data line
          // Column length and first two characters must match
          
          if (splitLine.length === col && !isNaN(parseInt(line.substring(0, 2)))) {
            // Loop through each cell and check for missing data
            for (var i = 0; i < splitLine.length; i++) {
              if (splitLine[i].substring(0, 1) === "?" || splitLine[i] == -99) {
                splitLine[i] = "N/A";
              }
            }
            // Formulate the date to remove Month
            let cleanDate = splitLine[indexes[0]].substring(0, 2) + " " + splitLine[indexes[0]].substring(2, 5);
            // Push each line into data object
            data.push({
              lakeName: lakeName,
              date: cleanDate,
              time: splitLine[indexes[1]],
              inflow: splitLine[indexes[2]],
              outflow: splitLine[indexes[3]],
              level: splitLine[indexes[4]]
          });

          }
        });
        callback(null, data);
      });
    }


  });

  // This reads the tournament file for the Tournaments Page
  app.get("/api/tournaments", function (request, response) {

    var contents = fs.readFileSync('data/tournamentList.txt', 'ascii');

    var indexes = [0, 1, 2, 3, 4, 5, 6, 7]
    txData = [];

    _.each(contents.split("\n"), function (line) {
      // Split the text body into readable lines
      var splitLine;
      line = line.trim();
      splitLine = line.split(/[\t]+/);
      
      // Push each line into txData object
      txData.push({
        organizer: splitLine[indexes[0]],
        trail: splitLine[indexes[1]],
        date: splitLine[indexes[2]],
        lake: splitLine[indexes[3]],
        ramp: splitLine[indexes[4]],
        state: splitLine[indexes[5]],
        txDetail: splitLine[indexes[6]],
        results: splitLine[indexes[7]],
      });
    });

      response.json(txData);
    
  });


  // API POST Requests
  // ---------------------------------------------------------------------------

  // Route to update database with new lake data
  app.post("/api/usgs", (req, res) => {
    console.log("nameID: " + req.body.nameID)
    req.body.newBatch.forEach(function (e) {
      db.model('Lake').updateOne(
        { _id: ObjectId(req.body.nameID), data: [{ level: e.value, date: e.date, time: e.time }] }
      )
        .then(function (data) {
          res.json(data);
        })
        .catch(function (err) {
          res.json(err);
        });
    })
  });
};
