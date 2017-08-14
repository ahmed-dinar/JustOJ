<template>
  <div>
    <div class="col-md-12" v-if="!!error">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
    </div>
    <div class="row" v-else>


      <div class="col-md-9">
        <!-- Running contests -->
        <h6 class="p-0 mb-3 btn-iconic">
          <i class="material-icons mr-1">alarm</i> Running Contests
        </h6>
        <template v-if="running && running.length">
          <b-table
          :items="running"
          :fields="runningFields"
          >
            <template slot="title" scope="contest">
              <div class="list-group">
                <router-link :to="`/contests/${contest.item.id}/${contest.item.slug}`" class="list-group-item list-group-item-action list-group-item-light">
                  <h5>{{ contest.value }}</h5>
                  <small class="text-muted">{{ contestTime(contest.item.begin) }}</small>
                </router-link>
              </div>
            </template>
            <template slot="users" scope="contest">
              {{ contest.value }}
            </template>
          </b-table>
        </template>
        <div class="text-muted small-text text-center">
          There is No Running Contest
        </div>


        <!-- Future contests -->
        <h6 class="p-0 mt-5 mb-3 btn-iconic">
          <i class="material-icons mr-1">alarm_on</i> Upcoming Contests
        </h6>
        <template v-if="upcoming && upcoming.length">
          <b-table
          :items="upcoming"
          :fields="runningFields"
          >
            <template slot="title" scope="contest">
              <div class="list-group">
                <router-link :to="`/contests/${contest.item.id}/${contest.item.slug}`" class="list-group-item list-group-item-action list-group-item-light">
                  <h5>{{ contest.value }}</h5>
                  <small class="text-muted">{{ contestTime(contest.item.end) }}</small>
                </router-link>
              </div>
            </template>
          </b-table>
        </template>
        <div class="text-muted  small-text text-center">
          No Upcoming Contest Found
        </div>


        <!-- Past contests -->
        <h6 class="p-0 mt-5 mb-3 btn-iconic">
          <i class="material-icons mr-1">history</i> Past Contests
        </h6>
        <template v-if="past && past.length">
          <b-table
          :items="past"
          :fields="pastFields"
          >
            <template slot="title" scope="contest">
              <div class="list-group">
                <router-link :to="`/contests/${contest.item.id}/${contest.item.slug}`" class="list-group-item list-group-item-action list-group-item-light">
                  <h5>{{ contest.value }}</h5>
                  <small class="text-muted">{{ contestTime(contest.item.end) }}</small>
                </router-link>
              </div>
            </template>
          </b-table>
        </template>
        <div class="text-muted small-text text-center">
          No Past Contest Found
        </div>

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
        runningFuture: {
          title: {
            label: 'Title'
          },
          users: {
            label: ''
          }
        },
        pastFields: {
          title: {
            label: 'Title'
          }
        },
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
            progressbar.done();
            progressbar.remove();
            if( status === 'running' ){
              this.running = response.data.running;
              this.future = response.data.future;
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
        return moment().from(starts);
      }
    },

    mounted(){
      this.fetchContests();
    }
  };
</script>

