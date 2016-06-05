/**
 * Created by ahmed-dinar on 6/6/16.
 */

module.exports = {

    resistration: {

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
            optional: true,
            isLength: {
                options: [{ min: 3, max: 250 }],
                errorMessage: 'Must be between 3 and 250 chars long'
            },
            errorMessage: 'Invalid  name'
        }
    }

};