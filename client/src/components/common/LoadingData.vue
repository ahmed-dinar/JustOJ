
<template>
  <div>
    <transition-group
      name="custom-classes-transition"
      enter-active-class="animated fadeIn"
      leave-class="animated fadeOut"
    >
      <div v-if="loading" :class="classObj" key="loadme">
        <clip-loader :loading="loading" :size="size" :color="color"></clip-loader>
      </div>
      <div key="theData" v-else>
        <slot></slot>
      </div>
    </transition-group>
  </div>
</template>

<script>

  import ClipLoader from 'vue-spinner/src/ClipLoader.vue';

  export default {
    name: 'LoadingData',

    components: {
      ClipLoader
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
        default: '30px'
      },
      color: {
        type: String,
        default: '#34364c'
      }
    }
  };
</script>

