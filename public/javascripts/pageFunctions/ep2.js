

    $(document).ready(function() {

        $('#caseuploadingDiv').hide();
        $('#caseremovingDiv').hide();


        //add test case using ajax
        $('#cases').on('submit', function (e) {
            e.preventDefault();

            var formData = new FormData($('#cases')[0]);

            $('#caseuploadingDiv').show();
            $.ajax({
                url: "/ep/" + PID + '/2',
                type: "POST",
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                complete: function(){
                    $('#caseuploadingDiv').hide();
                },
                success: function(data) {


                    data = JSON.parse(data);

                    var newList = '';
                    for (var i = 0; i < data.length; i++) {
                        var casen = 1;
                        for (var key in data[i]) {
                            if (key == 'name') {
                                newList += '<tr>';
                                for (var i = 0; i < data.length; i++) {
                                    newList += '<td class="col-md-4">';
                                    newList += '<input type="button" class="btn btn-primary btn-xs remove btn-danger" value="remove" >';
                                    newList += '</td>';
                                    newList += '<td>';
                                    newList += 'Test Case: ' + casen++;
                                    newList += '</td>';
                                    newList += '<input type="hidden" value="' + data[i][key] + '" />';
                                    newList += '</tr> ';
                                }
                            }
                        }
                    }
                    if (newList) {
                        document.getElementById("caselist").innerHTML = (newList);
                    }
                },
                error: function(err) {
                    setTimeout(function() {
                        $("#addtcerrorDiv").hide('blind', {}, 500)
                    }, 5000);
                    alert('adding test case error');
                }
            });
        });


        //remove TC
        $(document).on('click', '.remove', function () {
            var a = $(this).parent().parent();

            var remName = null;
            for(var i=0; i<a[0].childNodes.length; i++){
                if(a[0].childNodes[i].type == 'hidden'){
                    remName = a[0].childNodes[i].value;
                    break;
                }
            }

            if( remName ){
                $('#caseremovingDiv').show();
                $.ajax({
                        url: "/ep/rtc/",
                        type: 'post',
                        dataType: 'json',
                        data: {
                            pid: PID,
                        casename: remName
                    },
                    complete: function(){
                    $('#caseremovingDiv').hide();
                },
                success: function (data) {


                    var newList = '';
                    if( data.length > 0 ){

                        for (var i = 0; i < data.length; i++) {
                            var casen = 1;
                            for (var key in data[i]) {
                                if (key == 'name') {
                                    newList += '<tr>';
                                    for (var i = 0; i < data.length; i++) {
                                        newList += '<td class="col-md-4">';
                                        newList += '<input type="button" class="btn btn-primary btn-xs remove btn-danger" value="remove" >';
                                        newList += '</td>';
                                        newList += '<td>';
                                        newList += 'Test Case: ' + casen++;
                                        newList += '</td>';
                                        newList += '<input type="hidden" value="' + data[i][key] + '" />';
                                        newList += '</tr> ';
                                    }
                                }
                            }
                        }
                    }

                    document.getElementById("caselist").innerHTML = (newList);

                },
                error: function(err) {
                    alert('removing test case error');
                }
            });
        }

    });


        $('#judgesolution').on('submit', function (e) {
            e.preventDefault();

            var formData = new FormData($('#judgesolution')[0]);
            formData.append("language", document.getElementById("language").value);

            $.ajax({
                url: '/ep/' + PID + '/tjs',
                type: "POST",
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                complete: function(){

                },
                success: function (data) {

                },
                error: function(err) {
                    alert('removing test case error');
                }
            });


        });



var count=1;
var approvedHTML = '';
var limitsize = 5;
$("#fileinput").on("change", function (e) {

    var files = e.currentTarget.files; // puts all files into an array

    if( files.length == 0 ){
        $("#ddddd").html('no file selected');
        return;
    }

    var filesize = ((files[0].size/1024)/1024).toFixed(4); // MB

    if (filesize>limitsize) {
        $("#ddddd").html('file size should less than ' + (limitsize+1) + 'MB');
        $("#fileinput").val('');
    }
});

});

//add form action
window.onload = function() {
    document.cases.action = get_action('2');
    document.judgesolution.action = get_action('tjs');
}

function get_action(ac) {
    return '/ep/'+ PID + '/' + ac;
}
