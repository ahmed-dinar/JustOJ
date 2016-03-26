


function showRuns(data){

    if( data.system ){
        $("#ajaxResult").html('<h4><span class="label label-danger">System Error</span></h4>');
        return;
    }

    if( data.formError ){
        $("#ajaxResult").html('<h4><span class="label label-danger">'+ data.error  +'</span></h4>');
        return;
    }

    if( data.compiler ){
        $("#ajaxResult").html('<h4><span class="label label-danger">Compiler Error</span></h4>');
        return;
    }


    var langName = {c: 'C', cpp: 'C++', java: 'Java'};
    var ac = (data.final.result === 'Accepted');

    var res = '<div class="col-md-6"><h4>Run</h4>';
    res += '<table class="table"><thead><tr><th>CPU</th><th>Memory</th><th>Language</th><th>Status</th>';
    if(ac){
        res += '<th>Use</th>';
    }
    res += '</tr></thead><tbody>';
    res += '<tr>';

    res += '<td class="ftl">'+ toSecond(data.final.cpu) +'s</td>';
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
    res += '<h4>Tests</h4>';
    res += '<table class="table">';
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
        res += '<td>'+ toSecond(data.runs[i].cpu) +'s</td>';
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