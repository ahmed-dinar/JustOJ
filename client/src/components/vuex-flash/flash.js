/**
 * Copyright (C) 2017 Ahmed Dinar
 * 05/07/2017
 */

import extend from 'extend';
<<<<<<< HEAD

const defaultTemplate = `

  <transition
    :name="transitionName"
    :enter-active-class="transitionIn"
    :leave-active-class="transitionOut"
  >
    <b-alert :variant="variant || defaultVariant" :class="{ 'text-center': center }" :dismissible="!important" :show="show" >
      {{ message }}
    </b-alert>
  </transition>

`;

export default function flash(
  {
    cleaner = 'CLEAR_FLASH',
    getter = 'getFlash',
    key = '__vuexFlash',
    delay = 3000,
    template = defaultTemplate,
    storage = null,
    save = true
  } = {}
) {

  if( save && !storage ){
    storage = window && window.sessionStorage;
  }

  return {

    template,
=======
import template from './template';

export default function(options = {}){

  //only allow these options as root config and allow others as props
  let { cleaner, getter, key, delay } = options;

  return {

    template: template(),
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5

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
<<<<<<< HEAD
      },
      transitionName:{
        type: String,
        default: 'custom-classes-transition'
      },
      transitionIn:{
        type: String,
        default: 'animated slideInDown'
      },
      transitionOut:{
        type: String,
        default: 'animated slideOutUp'
=======
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
      }
    },

    data(){

      return extend({
<<<<<<< HEAD
        message: null,
        defaultVariant: null,
        timer: null
      }, { cleaner, getter, key, delay, storage, save });
    },

    mounted() {

      let flashes = this.getFlash;

      if( flashes.message ){
        this.defaultVariant = flashes.variant || 'success';
        this.message = flashes.message;
        this.clear();
        if( this.autoHide ){
          this.hide();
        }
=======
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
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
      }
    },

    computed: {

      show(){
<<<<<<< HEAD
        return !! this.message;
=======

        if( !this.msg )
          return false;

        //in bootstrap-vue if `show` is set as number(in second) alert will auto hide
        //https://bootstrap-vue.js.org/docs/components/alert
        return this.autoHide ? this.delay : true;
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
      },

      getFlash(){
        return this.$store.getters[this.getter];
      }
    },

    methods: {

      clear(){
<<<<<<< HEAD
        this.$store.commit(this.cleaner);
        if( this.save ){
          this.storage.removeItem(this.key);
        }
      },

      hide(){

        this.timer = setTimeout(() => {
          this.message = null;
          if( this.timer ){
            clearTimeout(this.timer);
          }
        }, this.delay);

=======
        window.sessionStorage.removeItem(this.key);
        this.$store.commit(this.cleaner);
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
      }
    }
  };

}