import Noty from 'noty';

class VueNoty {

  constructor(){
    this.config = {
      layout: 'topRight',
      timeout: 4000,
      progressBar: false,
      theme: 'bootstrap-v4',
      closeWith: ['click','button'],
      animation: {
        open: 'animated fadeInRight',
        close: 'animated fadeOutRight'
      }
    };
  }

  notify(text, type = 'success', options = {}){
    new Noty(Object.assign({}, this.config, options, { text, type })).show();
  }

  error (text, options = {}) {
    this.notify(text, 'error', options);
  }

  success (text, options = {}) {
    this.notify(text, 'success', options);
  }

  warning (text, options = {}) {
    this.notify(text, 'warning', options);
  }

  info (text, options = {}) {
    this.notify(text, 'info', options);
  }
}


export default {
  install: function (Vue) {
    Vue.prototype.$noty = new VueNoty();
  }
};