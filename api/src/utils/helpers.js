// Helper functions

const makeRes = (status, message = null, data = null) => {
  return { status, message, data };
};

const to = promise => {
  return promise.then(data => {
    return [null, data];
  }, (err => [err]));
};

const resErrors = errors => {
  return {
    errors: {
      allFields: errors
    }
  };
};

// return client safe error messages from Sequelize err
const filterSqlErrors = err => {
  var errorMessages = {};

  if ('errors' in err) {
    err.errors.forEach(error => {
      if (error.validatorKey !== null && error.path !== null) {
        errorMessages = { ...errorMessages, [error.path]: error.message };
      }
    });
  }

  return {
    errors: errorMessages
  };
}

module.exports = {
  makeRes,
  to,
  resErrors,
  filterSqlErrors
};
