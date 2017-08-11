<template>
  <div>
    <h1>EditContestants</h1>
  </div>
</template>

<script type="text/javascript">
  export default {
    name: 'EditContestants',

    data(){
      return {

      };
    },

    mounted(){
      console.log(this.$store.state.route.params);
    }
  };
</script>