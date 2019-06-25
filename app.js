var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var csv = require('csv-parser')
var fs = require('fs')
var results = [];

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


//Get and Parse JSON files
var JSONfile = fs.readFileSync("./public/files/paymentTransactions.json");
var parsedJSONfile = JSON.parse(JSONfile);

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
        // console.log(csvTransaction)
      } else {
        //If Transaction DOES NOT exist then alert the user
        console.log('Transaction does not exist')
      }
      // checkJSONtransactions(csvTransaction['Receipt No.'], csvTransaction);
      // for (var i in parsedJSONfile) {
      //   console.log('runned')
      // if (parsedJSONfile[i].ref == csvTransaction['Receipt No.']) {
      //   console.log(csvTransaction)
      // }else{
      //   console.log('Transaction not found')
      // }
      // }
      // console.log(csvTransaction[ 'Receipt No.' ]);
      // if(csvTransaction[ 'Receipt No.' ] == 'PAI2094'){
      //   console.log(csvTransaction)
      // }
    }
  });
//Compare CSV data to JSON data
// function checkJSONtransactions(ref){
//   console.log(ref)
//
//   for (var i in parsedJSONfile) {
//     if (parsedJSONfile[i].ref == ref) {
//       console.log(parsedJSONfile[i])
//     }else{
//       console.log('Transaction did not found')
//     }
//   }
// }

function checkTransactions(ref) {
  return parsedJSONfile.some(function(el) {
    return el.ref === ref;
  });
}

//
var finalTransaction = new Object();

function compareTransaction(transaction, ref) {
  // console.log(transaction)
  for (var i in parsedJSONfile) {
    if (parsedJSONfile[i].ref == ref) {
      var csvDetail = transaction['Details'];
      var initiationTime = transaction['Initiation Time'];
      var csvUnixTime = new Date(initiationTime).getTime() / 1000;
      var jsonUnixTime = JSON.stringify(parsedJSONfile[i].time)
      var res = csvDetail.match(/[^ ]* [^ ]*$/g);
      var csvName = res[0];

      //Get the payment source number
      var csvPaymentSrcNo = csvDetail.replace(/[^0-9]/g,'');
      var jsonPaymentSrcNo = parsedJSONfile[i].src.replace(/[^0-9]/g,'');

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
        console.log('names match')
        finalTransaction.name = {
          csv: csvName,
          json: parsedJSONfile[i].name,
          status: 'ok'
        }
      } else {
        console.log('names DO NOT match', parsedJSONfile[i].name, csvName)
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

// catch 404 and forward to err or handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
