<template>
  <div>
    <div v-if="!!error">
      <b-alert variant="warning">{{ error }}</b-alert>
    </div>

    <div class="row" v-else>
      <div class="col-md-8">
        <loading-data :loading="loading">
          <h3 class="mt-3 mb-4">{{ contest.title }}</h3>
          <p></p>
          <div class="rich-text" v-html="contest.description"></div>
        </loading-data>
      </div>
      <div class="col-md-4 mt-5">
        <div>
          <router-link v-if="!isUpcoming" :to="`/contests/${params.cid}/${contest.slug}/dashboard`" class="btn btn-primary btn-md">
            ENTER
          </router-link>
          <button v-else-if="parseInt(contest.privacy) === 1" class="btn btn-primary btn-md">
            REGISTER
          </button>
          <h6 v-else>Only Invited Participants can join</h6>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

  import moment from 'moment';

  export default {
    name: 'Announcement',

    data () {
      return {
        contest: null,
        loading: true,
        error: null
      };
    },

    computed: {
      params(){
        return this.$store.state.route.params;
      },
      isUpcoming(){
        return moment().isBefore(this.contest.begin);
      }
    },

    methods: {
      fetchContest(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/contest/${this.params.cid}`)
          .then(response => {
            console.log(response.data);
            this.contest = response.data;
            this.error = null;
            this.done();
          })
          .catch(err=>{
            this.done();
            this.error = this.getApiError(err);
            this.$noty.warning(this.error);
            if( err.response.status === 302 ){
              this.$router.replace(`/contests/${this.params.cid}/${this.params.slug}`);
            }
          });
      },
      done(){
        this.loading = false;
        progressbar.done();
        progressbar.remove();
      }
    },

    mounted(){
      console.log(this.$store.state.route);
      this.fetchContest();
    }
  };
</script>

