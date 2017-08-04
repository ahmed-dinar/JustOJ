
<template>
  <div>
    <button v-if="submitting" :class="spinButtonClass" type="button">
      <pulse-loader :loading="submitting" :color="color" :size="size"></pulse-loader>
    </button>
    <button v-else :class="css" :type="type">
      <slot>Submit</slot>
    </button>
  </div>
</template>

<script>

  import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

  export default {
    name: 'SubmitButton',

    components: {
      PulseLoader
    },

    props: {
      submitting: {
        type: Boolean,
        required: true
      },
      type: {
        type: String,
        default: 'submit'
      },
      color: {
        type: String,
        default: '#737373'
      },
      size: {
        type: String,
        default: '10px'
      },
      css: {
        type: String,
        default: 'btn btn-md btn-outline-primary'
      }
    },

    computed: {
      spinButtonClass(){
        return `btn-loading ${this.css}`;
      }
    }
  };
</script>

