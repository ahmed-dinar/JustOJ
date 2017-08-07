<template>
    <input
      type="text"
      v-model="localValue"
      :value="value"
    >
  </div>
</template>


<script>

  import Flatpickr from 'flatpickr';

  export default {
    name: 'Flatpickr',

    props: {
      value: {
        type: String,
        default: ''
      },
      options: {
        type: Object,
        default: () => ({})
      }
    },
    data () {
      return {
        flatpickr: null,
        localValue: ''
      };
    },
    mounted(){
      this.flatpickr = new Flatpickr(this.$el, this.options);
    },
    watch: {
      value(val){
        if( this.flatpickr ){
          this.flatpickr.setDate(val, true);
        }
      },
      localValue(val){
        this.$emit('input', val);
      }
    },
    beforeDestroy () {
      if (this.flatpickr) {
        this.flatpickr.destroy();
        this.flatpickr = null;
      }
    }
  };
</script>

