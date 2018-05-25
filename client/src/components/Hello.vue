<template>
  <div class="text-center home-page pt-4 pb-4">

  <div id="home-particle"></div>

    <h1 class="mt-5">Welcome To JUST Online Judge</h1>
    <h4 class="m-0">Improve Programming Skill</h4>

    <!-- <img src="homebanner.jpg" class="mb-4" style="max-width: 100%;"> -->

  </div>
</template>

<script>

  import particlesOptions from '@/config/particlesOptions';

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
      },
      initParticleJS(){
        particlesJS('home-particle', particlesOptions());
      }
    },

    mounted(){
      this.$nextTick(() => {
        console.log('tada');
        this.initParticleJS();
      });
    }

  };
</script>

<style type="text/css">
  .home-page{
 /*    background-color: #0099e5;*/
    color: #fff;
    min-height: 600px;
  }

  /* .home-page h1{
    font-family:  'Ubuntu', sans-serif;
  } */
</style>
