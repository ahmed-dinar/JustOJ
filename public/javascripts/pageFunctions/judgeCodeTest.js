


function showRuns(data){

    var res = '<div class="panel panel-default">';
    res += '<div class="panel-heading">STATUS</div>';
    res += '<table class="table">';

    var errorMsg = 'OK';

    if( data.system ){
        errorMsg = 'System Error';
       // $("#ajaxResult").html('<h4><span class="label label-danger">System Error</span></h4>');
      //  return;
    }
    else if( data.formError ){
        errorMsg = data.formError;
       // $("#ajaxResult").html('<h4><span class="label label-danger">'+ data.formError  +'</span></h4>');
        //return;
    }
    else if( data.compiler ){
        errorMsg = 'Compiler Error';
       // $("#ajaxResult").html('<h4><span class="label label-danger">Compiler Error</span></h4>');
       // return;
    }

    if( errorMsg !== 'OK' ) {
        res += '<tr>';
        res += '<td style="width: 15%">Status</td>';
        res += '<td class="danger">Error</td>';
        res += '</tr>';
        res += '<tr>';
        res += '<td style="width: 15%">Error</td>';
        res += ' <td class="info">' + errorMsg + '</td>';
        res += '</tr>';
        res += '</table>';
        res += '</div>';
        $("#ajaxResult").html(res);
        return;
    }


    var langName = {c: 'C', cpp: 'C++', java: 'Java'};
    var ac = (data.final.result === 'Accepted');


    res += '<tr><td style="width: 15%">Status</td>';
    if(ac){
        res += '<td class="success">Success</td></tr>';
    }else if( data.final.whyError ){
        res += '<td class="danger">Failed</td></tr>';
        res += '<tr><td style="width: 15%">Error</td><td class="info">'+ data.final.whyError +'</td></tr>';
    }else{
        res += '<td class="danger">Failed</td></tr>';
    }
    res += '</table>';
    res += '</div>';
    res += '<div class="panel panel-default">';
    res += '<div class="panel-heading">RESULT</div>';

    res += '<table class="table"><thead><tr><th>CPU</th><th>Memory</th><th>Language</th><th>Status</th>';
    if(ac){
        res += '<th>Use</th>';
    }
    res += '</tr></thead><tbody>';
    res += '<tr>';

    res += '<td class="ftl">'+ parseFloat(data.final.cpu).toFixed(2)  +'s</td>';
    res += '<td class="fml">'+ data.final.memory +'KB</td>';
    res += '<td>'+ langName[data.final.language] +'</td>';

    res += '<td>';
    if(ac){
        res += '<span class="label label-success">' + data.final.result + '</span>';
        res += '<td><span class="label label-default"><input type="button" value="Use This Limit" class="flb" style="background: transparent; color: #fff; border: none;" /></span></td>';
    }else{
        res += '<span class="label label-danger">' + data.final.result + '</span>';
    }
    res += '</td>';


    res += '</tr>';
    res += '</tbody>';
    res += '</table>';
    res += '</div>';
    res += '<div class="panel panel-default">';
    res += '<div class="panel-heading">TESTS</div>';
    res += '<table class="table table-striped">';
    res += '<thead>';
    res += '<tr>';
    res += '<th>#</th>';
    res += '<th>CPU</th>';
    res += '<th>Memory</th>';
    res += '<th>Status</th>';
    res += '</tr>';
    res += '</thead>';
    res += '<tbody>';

    for(var i=0; i<data.runs.length; i++){
        res += '<tr>';
        res += '<td>'+ (i+1) +'</td>';
        res += '<td>'+ parseFloat(data.runs[i].cpu).toFixed(2)  +'s</td>';
        res += '<td>'+ data.runs[i].memory +'KB</td>';
        res += '<td>';
        if(data.runs[i].result === 'Accepted'){
            res += '<span class="label label-success">'+ data.runs[i].result +'</span>';
        }else{
            res += '<span class="label label-danger">'+ data.runs[i].result +'</span>';
        }
        res += '</td>';
        res += '</tr>';
    }

    res += '</tbody>';

    res += '</table>';

    res += '</div>';

    $("#ajaxResult").html('');
    $("#ajaxResult").append(res);

}


function toSecond(num){
    var ret = num;
    if(ret){
        ret = String(parseFloat(num/1000.0).toFixed(2));
    }
    return ret;
}