
<template>
  <div>
    <transition-group
      name="custom-classes-transition"
      enter-active-class="animated fadeIn"
      leave-class="animated fadeOut"
    >
      <div v-if="loading" :class="classObj" key="loadme">
        <pulse-loader :loading="loading" :size="size" :color="color"></pulse-loader>
      </div>
      <div key="theData" v-else>
        <slot></slot>
      </div>
    </transition-group>
  </div>
</template>

<script>

  import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

  export default {
    name: 'LoadingData',

    components: {
      PulseLoader
    },

    computed: {
      classObj(){
        return `text-center ${this.css}`;
      }
    },

    props: {
      loading: {
        type: Boolean,
        default: true
      },
      css: {
        type: String,
        default: 'big-loading'
      },
      size: {
        type: String,
        default: '12px'
      },
      color: {
        type: String,
        default: '#999999'
      }
    }
  };
</script>

