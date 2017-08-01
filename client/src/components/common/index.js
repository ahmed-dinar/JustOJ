
import SmoothAlert from '@/components/common/SmoothAlert';
import LoadingData from '@/components/common/LoadingData';
import SubmitButton from '@/components/common/SubmitButton';
import Table from '@/components/custom/Table';

const GlobalComponents = {

  install(Vue){
    Vue.component('m-table', Table);
    Vue.component('SmoothAlert', SmoothAlert);
    Vue.component('LoadingData', LoadingData);
    Vue.component('SubmitButton', SubmitButton);
  }
};

export { GlobalComponents };