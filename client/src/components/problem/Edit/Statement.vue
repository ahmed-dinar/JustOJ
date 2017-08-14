<template>
  <div>


    <div class="col-md-12 mt-5 ml-3">
      <div class="d-flex justify-content-between">
        <span></span>
        <router-link :class="['btn', 'btn-outline-primary', 'btn-xs', 'pull-right']" :to="nextStep">
          <i class="material-icons">navigate_next</i>
        </router-link>
      </div>
    </div>


  </div>
</template>

<script type="text/javascript">
  export default {
    name: 'EditProblem',

    data(){
      return {

      };
    },

    computed: {
      nextStep(){
        return `/problems/${this.$store.state.route.params.pid}/edit/testcase`;
      }
    }
  };
</script>