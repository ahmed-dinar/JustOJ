
<script type="text/javascript">
    $(document).ready(function() {

        $('#caseuploadingDiv').hide();
        $('#caseremovingDiv').hide();



        //add test case using ajax
        $('#cases').on('submit', function (e) {
            e.preventDefault();

            var formData = new FormData($('#cases')[0]);

            $('#caseuploadingDiv').show();
            $.ajax({
                url: "/ep/" + <%= pid %> + '/2',
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
                            pid: <%= pid %>,
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
                error: function (xhr, status, error)  {
                    alert(JSON.stringify(error));
                }
            });
        }

    });


});

//add form action
window.onload = function() {
    document.cases.action = get_action('2');
}

function get_action(ac) {
    return '/ep/'+ <%= pid %> + '/' + ac;
}

</script>