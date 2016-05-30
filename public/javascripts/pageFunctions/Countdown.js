function CountDownTimer(begin,selector) {

    console.log(begin);


    var end = new Date(begin);

    var _second = 1000;
    var _minute = _second * 60;
    var _hour = _minute * 60;
    var _day = _hour * 24;
    var timer;
    var running = false;

    function showRemaining() {
        var now = new Date();

        var distance = end - now;

        if (distance <= 0) {
            clearInterval(timer);
            selector.innerHTML = 'Finished';

            if( running ) {
                alert('Contest Finished!');
            }
            return;
        }


         var days = Math.floor(distance / _day);
         var hours = Math.floor((distance % _day) / _hour);
         var minutes = Math.floor((distance % _hour) / _minute);
         var seconds = Math.floor((distance % _minute) / _second);

        selector.innerHTML = days <=0 ? '' : days + 'd ';
        selector.innerHTML += Math.floor(hours/10) + '' +  hours%10 + ':';
        selector.innerHTML += Math.floor(minutes/10) + '' +  minutes%10 + ':';
        selector.innerHTML += Math.floor(seconds/10) + '' +  seconds%10;

        running = true;
    }
    showRemaining();
    timer = setInterval(showRemaining, 1000);
}
