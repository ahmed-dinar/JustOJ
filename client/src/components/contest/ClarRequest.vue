<template>
  <div>
    <div v-if="!!error">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
    </div>

    <loading-data :loading="loading" v-else>
      <contest-navbar :contest="contest" :id="this.params.cid" class="mb-4"></contest-navbar>

      <h6 class="p-0 mb-4 btn-iconic btn-iconic-default">
        <i class="material-icons mr-1">question_answer</i> Request Clarification
      </h6>

      <div class="row">
        <div class="col-md-6">
          <select class="form-control mb-4 form-control-sm" v-model="pid">
            <option value="">Select a problem</option>
            <option v-for="problem in problems" :key="problem.id" :value="problem.id">
              {{ problem.name }}. {{ problem.title }}
            </option>
          </select>
          <textarea class="form-control mb-4" v-model="request" style="height: 100px;"></textarea>
          <button @click="submit()" class="btn btn-primary btn-md">SUBMIT</button>
        </div>
      </div>


    </loading-data>
  </div>
</template>

<script>

  import contestMixin from '@/mixins/contest';

  export default {
    name: 'ClarRequest',
    mixins: [ contestMixin ],

    data () {
      return {
        contest: null,
        problems: null,
        pid: '',
        error: null,
        loading: true,
        request: null
      };
    },

    methods: {
      submit(){

        if(!this.pid || this.pid === ''){
          this.$noty.warning('please select a problem');
          return;
        }

        if(!this.request){
          this.$noty.warning('please enter request');
          return;
        }

        this.loading = true;
        progressbar.start();

        console.log(this.$store.state.route.query);

        this.$http
          .post(`/api/contest/${this.params.cid}/clar/request`, {
            problem: this.pid,
            request: this.request
          })
          .then(response => {
            this.$noty.success('Request submitted');
            this.done(null);
          })
          .catch(err=>{
            this.done(this.getApiError(err));
            this.$noty.warning(this.error);
            if( err.response.status === 302 ){
              this.$router.replace(`/contests/${this.params.cid}/${this.params.slug}`);
            }
          });
      },
      fetchProblems(){
        this.loading = true;
        progressbar.start();

        console.log(this.$store.state.route.query);

        this.$http
          .get(`/api/contest/${this.params.cid}/clar/request`)
          .then(response => {
            console.log(response.data);
            this.contest = response.data.contest;
            this.problems = response.data.problems;
            this.done(null);
          })
          .catch(err=>{
            this.done(this.getApiError(err));
            this.$noty.warning(this.error);
            if( err.response.status === 302 ){
              this.$router.replace(`/contests/${this.params.cid}/${this.params.slug}`);
            }
          });
      },
      done(err){
        progressbar.done();
        progressbar.remove();
        this.error = err;
        this.loading = false;
      }
    },

    mounted(){
      this.fetchProblems();
    }
  };
</script>
