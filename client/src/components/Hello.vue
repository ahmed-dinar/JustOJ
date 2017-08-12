<template>
  <div class="text-center">

    <button @click="notifyMe" class="btn btn-primary btn-md">Normal</button>

  </div>
</template>

<script>

  export default {
    name: 'hello',

    data () {
      return {
        msg: 'Welcome to Your Vue.js App'
      };
    },

    methods: {
      notifyMe(){
        this.$noty.success('hey');
      }
    },

    mounted(){

    }

  };
</script>
