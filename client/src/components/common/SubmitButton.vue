
<template>
  <div>
    <button v-if="submitting" class="btn btn-outline-primary btn-md" type="button">
      <pulse-loader :loading="submitting" :color="color" :size="size"></pulse-loader>
    </button>
    <button v-else class="btn btn-md btn-outline-primary" type="submit">
      Submit
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
      color: {
        type: String,
        default: '#737373'
      },
      size: {
        type: String,
        default: '10px'
      }
    }
  };
</script>

