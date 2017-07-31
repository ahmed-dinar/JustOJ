
<template>
  <transition
  name="custom-classes-transition"
  :enter-active-class="transitionIn"
  :leave-active-class="transitionOut"
  >
    <div v-if="visible"
    :class="cssClasses"
    role="alert"
    aria-live="polite"
    aria-atomic="true"
    >
      <button v-if="dismissible"
        type="button"
        class="close"
        data-dismiss="alert"
        aria-label="close"
        @click.stop.prevent="dismiss"
        >
        <span aria-hidden="true">&times;</span>
      </button>
      <slot></slot>
    </div>
  </transition>
</template>

<script>

  export default {
    name: 'SmoothAlert',

    props: {
      show: {
        type: Boolean,
        default: false
      },
      variant: {
        type: String,
        default: 'success'
      },
      duration: {
        type: Number,
        default: 3000
      },
      dismissible: {
        type: Boolean,
        default: false
      },
      autoHide: {
        type: Boolean,
        default: false
      },
      transitionIn:{
        type: String,
        default: 'animated fadeInDown'
      },
      transitionOut:{
        type: String,
        default: 'animated fadeOutUp'
      }
    },
    data(){
      return {
        closed: false,
        _timeout: null
      };
    },
    computed: {
      cssClasses(){
        return ['alert', 'text-center', this.variantClass, this.dismissible ? 'alert-dismissible' : ''];
      },
      variantClass(){
        return `alert-${this.variant}`;
      },
      visible(){
        return ! this.closed && this.show;
      }
    },
    watch: {
      show() {
        this.alertAction();
      }
    },
    mounted() {
      this.alertAction();
    },
    methods: {
      dismiss(){
        this.closed = true;
        this.$emit('dismissed');
        if (this._timeout){
          clearTimeout(this._timeout);
        }
      },
      alertAction(){
        this.closed = false;
        if (this.autoHide) {
          this._timeout = setTimeout(() => {
            this.dismiss();
          }, this.duration);
        }
      }
    }
  };
</script>

