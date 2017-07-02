jQuery(document).ready(function(){


    $('.valpop').tooltipster({

        trigger: 'custom', // default is 'hover' which is no good here
        onlyOne: false,    // allow multiple tips to be open at a time
        position: 'right',  // display the tips to the right of the element
        theme: 'tooltipster-shadow'
    });


    var validator = $("#resform").validate({

        rules: {
            username : {
                rangelength: [5,20],
                remote: {
                    url: "/ucheck",
                    type: "post",
                    data: {
                        username: function() {
                            return $( "#iUsername" ).val();
                        }
                    }
                }
            },
            name:{
                rangelength: [3,250]
            },
            email : {
                email: true,
                remote: {
                    url: "/ucheck",
                    type: "post",
                    data: {
                        email: function() {
                            return $( "#iEmail" ).val();
                        }
                    }
                }
            },


            password: {
                rangelength: [6,30]
            },

            conpassword: {
                equalTo: "#iPassword"
            }
        },

        messages: {
            conpassword: "password doesnot match",
            username: {
                remote: "username already taken"
            },
            email: {
                remote: "Email already taken"
            }
        },

        highlight: function(element) {
            $(element).addClass('val-error');
        },

        unhighlight: function(element) {
            $(element).removeClass('val-error');
        },

        errorPlacement: function (error, element) {
            $(element).tooltipster('update', $(error).text());
            $(element).tooltipster('show');
        },
        success: function (label, element) {
            $(element).tooltipster('hide');
        }

    });


});