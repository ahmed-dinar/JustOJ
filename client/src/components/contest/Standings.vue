<template>
  <div>
    <div v-if="!!error">
      <b-alert variant="warning">{{ error }}</b-alert>
    </div>

    <loading-data :loading="loading" v-else>
      <contest-navbar :contest="contest" :id="this.params.cid" class="mb-4"></contest-navbar>

      <div class="row">
        <div class="col-md-12">
          <!-- <h6 class="mb-1 btn-iconic">
            <i class="material-icons mr-1">extension</i> Standings
          </h6> -->

          <table class="table table-gray mb-4 table-md">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th><i class="material-icons md-18">schedule</i></th>
                <th v-for="problem in stats" :key="problem.id">
                  {{ problem.id }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ranks">
                <td>{{ index }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.penalty }}</td>
                <td v-for="problem in stats.length-1">
                  {{ problem }}
                </td>
                <td>{{ parseProb(item.problems) }}</td>
              </tr>
            </tbody>

          </table>

          <div class="d-flex justify-content-between" v-if="ranks && ranks.length && pagination && pagination.total !== null">

            <small>Showing {{ ranks ? ranks.length : '0' }} of {{ pagination.total }} entries</small>

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

          </div>

        </div>
      </div>


    </loading-data>
  </div>
</template>

<script>

  import contestMixin from '@/mixins/contest';
  import has from 'has';

  export default {
    name: 'Standings',
    mixins: [ contestMixin ],

    data () {
      return {
        contest: null,
        ranks: null,
        stats: null,
        pagination: null,
        loading: true,
        cur_page: 1,
        error: null,
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
      parseProb(problems){

        console.log(problems);

        this.stats.forEach((value) => {
          console.log(value);
        });

        return 'hola';
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
