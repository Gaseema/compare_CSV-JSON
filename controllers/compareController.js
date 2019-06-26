var csv = require('csv-parser')
var fs = require('fs')
var results = [];


//Get and Parse JSON files
var JSONfile = fs.readFileSync("./public/files/paymentTransactions.json");
var parsedJSONfile = JSON.parse(JSONfile);


//Declair global variables
var finalTransaction = new Object();
var allTransactions = [];
var called = false;

// exports.compare_get = function(req, res, next) {
//   res.render('index', {
//     title: 'Payment Auditor'
//   })
// }
exports.compare_get = function(req, res, next) {
  if (called == true) {
    //Do not load the files again
    res.render('index', {
      title: 'Payment Auditor',
      transactions: allTransactions
    })
  } else {
    // Get and parse the CSV files
    fs.createReadStream('./public/files/paymentTransactions.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        for (perTransaction in results) {
          var csvTransaction = results[perTransaction];

          //First check whether the transaction exists
          if (checkTransactions(csvTransaction['Receipt No.']) == true) {
            //If Transaction exist then compare the contents
            console.log('Transaction exist ', csvTransaction['Receipt No.'])
            compareTransaction(csvTransaction, csvTransaction['Receipt No.'])
            // var stringified = JSON.stringify(finalTransaction)
            var stringified = JSON.stringify(finalTransaction)
            allTransactions.push(stringified)

          } else {
            //If Transaction DOES NOT exist then alert the user
            console.log('Transaction does not exist')
          }
        }
        res.render('index', {
          title: 'Payment Auditor',
          transactions: allTransactions
        })
      });
    called = true;
  }
}

function checkTransactions(ref) {
  return parsedJSONfile.some(function(el) {
    return el.ref === ref;
  });
}

function compareTransaction(transaction, ref) {
  for (var i in parsedJSONfile) {
    if (parsedJSONfile[i].ref == ref) {
      var csvDetail = transaction['Details'];

      //Get unix time
      var initiationTime = transaction['Initiation Time'];
      var csvUnixTime = new Date(initiationTime).getTime() / 1000;
      var jsonUnixTime = JSON.stringify(parsedJSONfile[i].time).replace(/[0]+$/, '')

      var res = csvDetail.match(/[^ ]* [^ ]*$/g);
      var csvName = res[0];

      //Get the payment source number
      var csvPaymentSrcNo = csvDetail.replace(/[^0-9]/g, '');
      var jsonPaymentSrcNo = parsedJSONfile[i].src.replace(/[^0-9]/g, '');

      //Get the payment source
      var csvPaymentSrc = csvDetail.replace(/ .*/, '');
      var jsonPaymentSrc = parsedJSONfile[i].src;
      if (jsonPaymentSrc.split(':')[0] == 'creditcard') {
        jsonPaymentSrc = 'Credit'
      } else if (jsonPaymentSrc.split(':')[0] == 'mpesa') {
        jsonPaymentSrc = 'Mpesa'
      }
      finalTransaction.ref = {
        csv: ref,
        json: parsedJSONfile[i].ref,
        status: 'ok'
      }

      //Compare the names
      if (parsedJSONfile[i].name == csvName) {
        // Names match
        finalTransaction.name = {
          csv: csvName,
          json: parsedJSONfile[i].name,
          status: 'ok'
        }
      } else {
          // Names DO NOT match
        finalTransaction.name = {
          csv: csvName,
          json: parsedJSONfile[i].name,
          status: 'bad'
        }
      }

      //Compare the Amount
      if (parsedJSONfile[i].amount == transaction['Paid In']) {
        finalTransaction.amount = {
          csv: transaction['Paid In'],
          json: parsedJSONfile[i].amount,
          status: 'ok'
        }
      } else {
        finalTransaction.amount = {
          csv: transaction['Paid In'],
          json: parsedJSONfile[i].amount,
          status: 'bad'
        }
      }

      //Compare the account
      if (parsedJSONfile[i].acc == transaction['A/C No.']) {
        finalTransaction.acc = {
          csv: transaction['A/C No.'],
          json: parsedJSONfile[i].acc,
          status: 'ok'
        }
      } else {
        finalTransaction.acc = {
          csv: transaction['A/C No.'],
          json: parsedJSONfile[i].acc,
          status: 'bad'
        }
      }

      //Compare the time
      if (jsonUnixTime == csvUnixTime) {
        finalTransaction.time = {
          csv: csvUnixTime,
          json: jsonUnixTime,
          status: 'ok'
        }
      } else {
        finalTransaction.time = {
          csv: csvUnixTime,
          json: jsonUnixTime,
          status: 'bad'
        }
      }

      //Compare the source
      if (jsonPaymentSrc == csvPaymentSrc) {
        finalTransaction.src = {
          csv: csvPaymentSrc,
          json: jsonPaymentSrc,
          status: 'ok'
        }
      } else {
        finalTransaction.src = {
          csv: csvPaymentSrc,
          json: jsonPaymentSrc,
          status: 'bad'
        }
      }


      //Compare the source number
      if (jsonPaymentSrcNo == csvPaymentSrcNo) {
        finalTransaction.srcNo = {
          csv: csvPaymentSrcNo,
          json: jsonPaymentSrcNo,
          status: 'ok'
        }
      } else {
        finalTransaction.srcNo = {
          csv: csvPaymentSrcNo,
          json: jsonPaymentSrcNo,
          status: 'bad'
        }
      }
    } else {
      // console.log('Transaction did not found')
    }
  }
}
