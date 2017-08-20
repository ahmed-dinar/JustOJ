<template>
  <div>
    <div v-if="!!error">
      <b-alert variant="warning">{{ error }}</b-alert>
    </div>

    <loading-data :loading="loading" v-else>
      <contest-navbar :contest="contest" :id="this.params.cid" class="mb-4"></contest-navbar>

      <div class="row">
        <div class="col-md-12">
          <h6 class="mb-3 btn-iconic text-secondary">
            <i class="material-icons mr-1">group</i> Standings
          </h6>

          <table class="table mb-5 table-md rank-table">
            <thead>
              <tr>
                <th class="cell text-center" v-tooltip="'rank'">#</th>
                <th><i class="material-icons md-18" v-tooltip="'name'">person</i></th>
                <th class="cell text-center" v-tooltip="'problem solved'"><i class="material-icons md-18">done</i></th>
                <th class="cell text-center" v-tooltip="'time'"><i class="material-icons md-18">schedule</i></th>
                <th v-for="problem in stats" :key="problem.id" class="cell text-center">
                  <router-link :to="`${contestLink}/p/${problem.id}/${problem.slug}`" v-tooltip="`${problem.title} ( ${problem.solvedBy}/${problem.triedBy} )`">
                    {{ problem.name }}
                  </router-link>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ranks">
                <td class="text-center font-weight-bold">
                  {{ index + 1 + ( (cur_page-1)*pagination.page_limit ) }}
                </td>
                <td style="font-size: 14px; font-weight: 600;">
                  <router-link :to="`/users/${item.username}`">{{ item.name }}</router-link>
                </td>
                <td class="text-center font-weight-bold">{{ item.solved || 0 }}</td>

                <td class="text-center font-weight-bold">
                  <template v-if="item.penalty == null">0</template>
                  <router-link :to="`${contestLink}/submissions?user=${item.username}`" v-else>{{ item.penalty }}</router-link>
                </td>

                <template v-if="item.penalty == null">
                  <td style="height: 45px;" v-for="problem in stats.length"></td>
                </template>
                <td class="cell" v-for="problem in stats.length" v-else>
                  <div v-if="!item.problems[problem-1]"></div>
                  <button @click="showRuns(item.username, stats[problem-1].id)" :class="[ 'badge', `badge-${statusVariant(item.problems[problem-1].status)}`, 'w-100' ]" v-tooltip="item.problems[problem-1].penalty_time" v-else>
                    <p>( {{ item.problems[problem-1].tried }} )</p>
                    <p>{{ item.problems[problem-1].penalty }}</p>
                  </button>
                </td>

              </tr>
            </tbody>

          </table>

          <div class="d-flex justify-content-between" v-if="ranks && ranks.length && pagination && pagination.total !== null">

            <small><!-- Showing {{ ranks ? ranks.length : '0' }} of {{ pagination.total }} entries --></small>

            <b-pagination
            size="sm"
            :total-rows="pagination.total"
            v-model="cur_page"
            :per-page="pagination.page_limit"
            :next-text="pg.next"
            :prev-text="pg.prev"
            :first-text="pg.first"
            :last-text="pg.last"
            ></b-pagination>
            <small></small>

          </div>

        </div>
      </div>


    </loading-data>



  <b-modal
  id="runModal"
  ref="runModal"
  size="md"
  >
    <div slot="modal-title">
      <h6>Submissios</h6>
    </div>
    <loading-data :loading="runLoading">
      <table class="table table-gray table-md">
        <thead>
          <tr>
            <th>When</th>
            <th>Language</th>
            <th>CPU</th>
            <th>Memory</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="runinfo in runs">
            <td>{{ fromWhen(runinfo.submittime) }}</td>
            <td>{{ getRunLang(runinfo.language) }}</td>
            <td>{{ roundTo(runinfo.cpu) }}s</td>
            <td>{{ runinfo.memory }} KB</td>
            <td>
              <b-badge :variant="statusVariant(runinfo.status)">
                {{  getRunStatus(runinfo.status) }}
              </b-badge>
            </td>
          </tr>
        </tbody>
      </table>
    </loading-data>
    <div slot="modal-footer"></div>
  </b-modal>




  </div>
</template>

<script>

  import contestMixin from '@/mixins/contest';
  import has from 'has';
  import submissionMixin from '@/mixins/submission';

  export default {
    name: 'Standings',
    mixins: [ contestMixin, submissionMixin ],

    data () {
      return {
        contest: null,
        ranks: null,
        stats: null,
        pagination: null,
        loading: true,
        cur_page: 1,
        error: null,
        runLoading: false,
        runs: null,
        pg: {
          next: '<i class="material-icons md-18">keyboard_arrow_right</i>',
          prev: '<i class="material-icons md-18">keyboard_arrow_left</i>',
          first: '<i class="material-icons md-18">first_page</i>',
          last: '<i class="material-icons md-18">last_page</i>'
        }
      };
    },

    methods: {
      fetchRank(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/contest/${this.params.cid}/rank`)
          .then(response => {
            console.log(response.data);
            this.contest = response.data.contest;
            this.contest.id = this.params.cid;
            this.ranks = response.data.rank;
            this.stats = response.data.stats;
            this.pagination = response.data.pagination;
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
      },
      showRuns(username, pid){
        console.log(`${username} ${pid}`);

        this.runLoading = true;
        this.$refs.runModal.show();

        this.$http
          .get(`/api/contest/${this.params.cid}/submissions`,{
            params: {
              user: username,
              problem: pid
            }
          })
          .then(response => {
            console.log(response.data);
            this.runs = response.data.subs;
            this.runLoading = false;
          })
          .catch(err=>{
            this.$noty.warning(this.error);
            this.runLoading = false;
          });

      }
    },

    watch: {
      '$route': 'fetchRank',
      cur_page: function (page) {
        this.$router.push({
          path: this.$store.state.route.path,
          query: Object.assign({}, this.$store.state.route.query, { page })
        });
      }
    },

    mounted(){
      this.cur_page = has(this.$store.state.route.query,'page')
        ? parseInt(this.$store.state.route.query.page)
        : 1;
      this.fetchRank();
    }
  };
</script>
