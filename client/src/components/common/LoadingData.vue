
<template>
  <div>
    <transition-group
      name="custom-classes-transition"
      enter-active-class="animated fadeIn"
      leave-class="animated fadeOut"
    >
      <div v-if="loading" class="text-center big-loading" key="loadme">
        <clip-loader :loading="loading" size="30px" color="#34364c"></clip-loader>
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

    props: {
      loading: {
        type: Boolean,
        default: true
      }
    }
  };
</script>

