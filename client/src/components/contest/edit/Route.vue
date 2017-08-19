<template>
  <div>
    <h6 class="btn-iconic mb-2 p-0">
      <i class="material-icons mr-1">mode_edit</i> Edit Contest
    </h6>
    <div class="btn-group mb-2" role="group" aria-label="Contest Edit Nav">
      <router-link :to="`/contests/${id}/edit`" class="btn-material btn btn-sm btn-secondary bold">
        <i class="material-icons mr-1">dashboard</i> Details
      </router-link>
      <router-link :to="`/contests/${id}/edit/problems`" class="btn-material btn btn-sm btn-secondary bold">
        <i class="material-icons mr-1">extension</i> Problems
      </router-link>
      <router-link :to="`/contests/${id}/edit/contestants`" class="btn-material btn btn-sm btn-secondary bold" exact>
        <i class="material-icons mr-1">people</i> Contestants
      </router-link>
    </div>
    <router-view></router-view>
  </div>
</template>

<script type="text/javascript">
  export default{
    name: 'EditCRoute',
    computed: {
      id(){
        return this.$store.state.route.params.cid;
      }
    }
  };
</script>