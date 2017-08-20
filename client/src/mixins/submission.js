

import moment from 'moment';
import runStatus from '@/lib/runStatus';
import runLanguage from '@/lib/runLanguage';

const submissionMixin = {
  methods: {
    roundTo(num) {
      if( !num || num === undefined ){
        return '0.00';
      }
      num = parseFloat(parseInt(num)/1000.0);
      num = num.toString();
      return (num.indexOf('.') > -1 ? num+'00' : num+'.00').match(/^-?\d+(?:\.\d{0,2})?/)[0];
    },
    getRunStatus(status){
      return runStatus[parseInt(status)];
    },
    getRunLang(lang){
      return runLanguage[lang];
    },
    statusVariant(code){
      code = parseInt(code);
      switch(code){
        case 0:
          return 'success';
        case 5:
          return 'secondary';
        case 6:
          return 'info';
        case 8:
          return 'warning';
        default:
          return 'danger';
      }
    },
    fromWhen(time){
      return moment(time).from();
    }
  }
};

export default submissionMixin;