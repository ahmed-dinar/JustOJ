<template>
  <div>
    <div class="col-md-12" v-if="!!error">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
    </div>
    <div class="row" v-else>


      <div class="col-md-9">
        <template v-if="running && running.length">
          <div class="list-group mb-4">
            <div class="list-group-item disabled cell-list">
              <h6 class="p-0 m-0 btn-iconic">
                <i class="material-icons mr-1">alarm</i> Running Contests
              </h6>
            </div>
            <router-link v-for="contest in running" :key="contest.id" :to="`/contests/${contest.id}/${contest.slug}`" class="list-group-item list-group-item-action list-group-item-light cell-list">
              <h6 class="m-0">{{ contest.title }}</h6>
              <small class="text-muted">Ends {{ contestTime(contest.end) }}</small>
            </router-link>
          </div>
        </template>


        <template v-if="upcoming && upcoming.length">
          <div class="list-group">
            <div class="list-group-item disabled cell-list">
              <h6 class="p-0 m-0 btn-iconic">
                <i class="material-icons mr-1">alarm_on</i> Upcoming Contests
              </h6>
            </div>
            <router-link v-for="contest in upcoming" :key="contest.id" :to="`/contests/${contest.id}/${contest.slug}`" class="list-group-item list-group-item-action list-group-item-light cell-list">
              <h6 class="m-0">{{ contest.title }}</h6>
              <small class="text-muted">Ends {{ contestTime(contest.end) }}</small>
            </router-link>
          </div>
        </template>

        <template v-if="past && past.length">
          <div class="list-group">
            <div class="list-group-item disabled cell-list">
              <h6 class="p-0 m-0 btn-iconic">
                <i class="material-icons mr-1">history</i> Past Contests
              </h6>
            </div>
            <router-link v-for="contest in past" :key="contest.id" :to="`/contests/${contest.id}/${contest.slug}`" class="list-group-item list-group-item-action list-group-item-light cell-list">
              <h6 class="m-0">{{ contest.title }}</h6>
              <small class="text-muted">Ends {{ contestTime(contest.end) }}</small>
            </router-link>
          </div>
        </template>
      </div>

      <div class="col-md-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Host Contest</h5>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>

  import moment from 'moment';

  export default {
    name: 'Contests',

    data () {
      return {
        running: null,
        upcoming: null,
        past: null,
        error: null
      };
    },

    methods: {
      fetchContests(status = 'running'){

        progressbar.start();
        this.error = null;

        this.$http
          .get(`/api/contest/list?status=${status}`)
          .then(response => {
            console.log(response.data);
            progressbar.done();
            progressbar.remove();
            if( status === 'running' ){
              this.running = response.data.running;
              this.upcoming = response.data.future;
            }else{
              this.past = response.data.past;
            }
          })
          .catch(err => {
            progressbar.done();
            progressbar.remove();
            this.error = this.getApiError(err);
          });
      },
      contestTime(starts){
        if( moment().isBefore(starts) ){
          return moment().to(starts);
        }
        return moment().from(starts);
      }
    },

    mounted(){
      this.fetchContests();
      this.fetchContests('past');
    }
  };
</script>

