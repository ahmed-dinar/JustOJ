
import flash from './flash';

export default {
  install(Vue, config){
    Vue.component('FlashMessage', flash(config) );
  }
};