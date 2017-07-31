
import has from 'has';

let mixins = {
  methods: {
    getApiError: function (err) {
      let retErr = has(err.response.data,'error')
            ? err.response.data.error
            : `${err.response.status} ${err.response.statusText}`;

      return retErr;
    }
  }
};

export default{
  install(Vue){
    Vue.mixin(mixins);
  }
};