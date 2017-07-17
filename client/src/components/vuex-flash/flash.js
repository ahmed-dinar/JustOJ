/**
 * Copyright (C) 2017 Ahmed Dinar
 * 05/07/2017
 */

import extend from 'extend';

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
      }
    },

    data(){

      return extend({
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
      }
    },

    computed: {

      show(){
        return !! this.message;
      },

      getFlash(){
        return this.$store.getters[this.getter];
      }
    },

    methods: {

      clear(){
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

      }
    }
  };

}