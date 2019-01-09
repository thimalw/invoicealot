// Helper functions

const makeRes = (status, message = null, data = null) => {
  return { status, message, data };
};

const to = promise => {
  return promise.then(data => {
    return [null, data];
  }, (err => [err]));
};

// return client safe error messages from Sequelize err
const filterSqlErrors = err => {
  var errorMessages = [];

  err.errors.forEach(error => {
    errorMessages.push(error.message);
  });

  return errorMessages;
}

module.exports = {
  makeRes,
  to,
  filterSqlErrors
};
