/**
 * Created by ahmed-dinar on 6/6/16.
 */

module.exports = {

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
        'name': { //
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
    }

};