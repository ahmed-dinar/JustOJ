<template>
  <div class="full-page">
      <div class="col-md-12 pt-2" v-if="!!error">
        {{ error }}
      </div>
      <pre class="pl-1" v-else>{{ caseData }}</pre>
  </div>
</template>

<script>

  //import { LOG_OUT } from '@/store/mutation-types';

  export default {
    name: 'ViewTestCase',

    data(){
      return {
        loading: false,
        caseData: null,
        error: null
      };
    },

    created(){
      let caseType = this.$store.state.route.query.type;

      if( !caseType || (caseType !== 'input' && caseType !== 'output') ){
        this.$router.push('/404');
        return;
      }

      let caseId = this.$store.state.route.params.caseId;
      let problemId = this.$store.state.route.params.pid;

      this.$http
        .get(`/api/problem/testcase/${problemId}/${caseId}?type=${caseType}`)
        .then(response => {
          this.loading = false;
          this.caseData = response.data;
        })
        .catch(err => {
          this.loading = false;
          this.error = this.getApiError(err);
        });
    },

    mounted(){
      // console.log(this.$store.state.route.params);
      // console.log(this.$store.state.route.query);
    }
  };
</script>

<style>
  .full-page{
    background: #fff !important;
    height: 100vh !important;
  }
</style>