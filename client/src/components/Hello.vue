<template>
  <div class="text-center home-page pt-4 pb-4">

    <h1>Welcome To JUST Online Judge</h1>

    <img src="homebanner.jpg" class="mb-4" style="max-width: 100%;">

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

<style type="text/css">
  .home-page{
    background-color: #6AA3B6;
    color: #fff;
  }

  .home-page h1{
    font-family:  'Ubuntu', sans-serif;
  }
</style>