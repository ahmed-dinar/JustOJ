/**
 * Copyright (C) 2017 Ahmed Dinar
 * 05/07/2017
 */

import extend from 'extend';
import template from './template';

export default function(options = {}){

  //only allow these options as root config and allow others as props
  let { cleaner, getter, key, delay } = options;

  return {

    template: template(),

    props: {
      variant: {
        type: String,
        default: null
      },
      important: {
        type: Boolean,
        default: false
      },
      autoHide: {
        type: Boolean,
        default: false
      },
      center: {
        type: Boolean,
        default: true
      }
    },

    data(){

      return extend({
        key: '__vuexFlash',
        cleaner: 'CLEAR_FLASH',
        getter: 'getFlash',
        msg: null,
        delay: 3,
        defaultVariant: null
      }, { cleaner, getter, key, delay });
    },

    created() {

      let flashes = this.getFlash;

      if( flashes.msg ){
        this.clear();
        this.defaultVariant = flashes.variant || 'success';
        this.msg = flashes.msg;
      }
    },

    computed: {

      show(){

        if( !this.msg )
          return false;

        //in bootstrap-vue if `show` is set as number(in second) alert will auto hide
        //https://bootstrap-vue.js.org/docs/components/alert
        return this.autoHide ? this.delay : true;
      },

      getFlash(){
        return this.$store.getters[this.getter];
      }
    },

    methods: {

      clear(){
        window.sessionStorage.removeItem(this.key);
        this.$store.commit(this.cleaner);
      }
    }
  };

}