'use strict';

var myutil = appRequire('lib/myutil');

module.exports = {
  'email': {
    'email': {
      notEmpty: true,
      isEmail: {
        errorMessage: 'Invalid Email'
      }
    }
  },
  'password': {
    'password': {
      notEmpty: true,
      isLength: {
        options: [{min: 6, max: 30}],
        errorMessage: 'Must be between 6 and 30 chars long'
      },
      errorMessage: 'Password should not be empty'
    }
  },
  'resistration': {
    'username': {
      notEmpty: true,
      isLength: {
        options: [{ min: 6, max: 20 }],
        errorMessage: 'Must be between 6 and 20 chars long'
      },
      errorMessage: 'Invalid Username'
    },
    'email': {
      notEmpty: true,
      isEmail: {
        errorMessage: 'Invalid Email'
      }
    },
    'password': {
      notEmpty: true,
      isLength: {
        options: [{min: 6, max: 30}],
        errorMessage: 'Must be between 6 and 30 chars long'
      },
      errorMessage: 'Invalid Password'
    },
    'name': {
      notEmpty: true,
      isLength: {
        options: [{ min: 3, max: 250 }],
        errorMessage: 'Must be between 3 and 250 chars long'
      },
      errorMessage: 'Invalid  name'
    }
  },
  'settings': {
    'profile': {
      'name': {
        optional: {
          options: [{ checkFalsy: true }]
        },
        isLength: {
          options: [{ min: 3, max: 250 }],
          errorMessage: 'Must be between 3 and 250 chars long'
        },
        errorMessage: 'Invalid Name'
      },
      'website': {
        optional: {
          options: [{ checkFalsy: true }]
        },
        isURL: {
          errorMessage: 'Must be a valid url'
        },
        isLength: {
          options: [{ min: 12, max: 512 }],
          errorMessage: 'Must be between 12 and 512 chars long'
        },
        errorMessage: 'Invalid website link'
      },
      'institute': {
        optional: {
          options: [{ checkFalsy: true }]
        },
        isLength: {
          options: [{ min: 0, max: 50 }],
          errorMessage: 'should not contains more than 50 chars'
        },
        errorMessage: 'Invalid Institution'
      },
      'country': {
        optional: {
          options: [{ checkFalsy: true }]
        },
        isLength: {
          options: [{ min: 0, max: 2 }],
          errorMessage: 'Must be 2 chars long'
        },
        errorMessage: 'Invalid country code'
      },
      'city': {
        optional: {
          options: [{ checkFalsy: true }]
        },
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Must be between 2 and 30 chars long'
        },
        errorMessage: 'Invalid location'
      }
    }
  },
  problemLimit: {
    'cpu': {
      isFloat: {
        options: [{ min: 0.01, max: 20.00, allow_leading_zeroes: false }],
        errorMessage: 'Must be between 0.01 and 20.00'
      },
      errorMessage: 'Invalid score'
    }
  },
  problem: {
    'title': {
      isLength: {
        options: [{ min: 6, max: 1000 }],
        errorMessage: 'Must be between 6 and 1000 chars long'
      },
      errorMessage: 'Invalid title'
    },
    'author': {
      isLength: {
        options: [{ min: 3, max: 50 }],
        errorMessage: 'Must be between 3 and 50 chars long'
      },
      errorMessage: 'Invalid title'
    },
    'score': {
      isInt: {
        options: [{ gt: 0, lt: 11, allow_leading_zeroes: false }],
        errorMessage: 'Must be between 0 and 10'
      },
      errorMessage: 'Invalid score'
    },
    'statement':{
      notEmpty: true,
      errorMessage: 'Invalid statement'
    },
    'category':{
      notEmpty: true,
      isIn: {
        options: [myutil.categoryList()],
        errorMessage: 'invalid'
      },
      errorMessage: 'required'
    },
    'difficulty':{
      notEmpty: true,
      isIn: {
        options: [myutil.difficultyList()],
        errorMessage: 'invalid'
      },
      errorMessage: 'required'
    },
    'input':{
      notEmpty: true,
      errorMessage: 'required'
    },
    'output':{
      notEmpty: true,
      errorMessage: 'required'
    }
  }
};