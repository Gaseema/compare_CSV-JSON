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
        compareTransaction(csvTransaction,csvTransaction['Receipt No.'])
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

function compareTransaction(transaction, ref) {
  // console.log(transaction)
    for (var i in parsedJSONfile) {
      if (parsedJSONfile[i].ref == ref) {
        console.log(transaction['Details'])
      }else{
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
