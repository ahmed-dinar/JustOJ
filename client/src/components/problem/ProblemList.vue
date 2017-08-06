<template>
  <div class="row">

      <div v-if="!!error" class="col-md-12">
        <smooth-alert variant="danger" :show="!!error">
          {{ error }}
        </smooth-alert>
      </div>

      <div v-else class="col-md-12">

        <h5 class="mb-3 btn-iconic pl-0">
          <i class="material-icons mr-1">extension</i> Problems
        </h5>

        <loading-data :loading="loading">

          <div v-if="problemList && problemList.problems.length">
            <div class="table-responsive">

              <m-table show-empty
              :items="problemList.problems"
              :fields="fields"
              class="problem-table"
              >
              <template slot="index" scope="problem">
                {{problem.index + 1}}
              </template>
              <template slot="title" scope="problem">
                <router-link class="link" :to="problemLink(problem.item, problem.item)">{{problem.value}}</router-link>
              </template>
              <template slot="status" scope="problem">

                <template v-if="hasStatus(problem.item)">
                  <b-popover placement="top" triggers="hover" :content="userStatusText(problem.item)">
                    <router-link
                    :to="`/submissions?problem=${problem.item.hash_id}&user=${getUser.username}`"
                    >
                      <div  v-html="userStatus(problem.item)"></div>
                    </router-link>
                  </b-popover>
                </template>

                <!-- <i class="material-icons text-success" v-if="userStatus(problem.item)">check_circle</i> -->

                <!-- <i class="material-icons text-success">check_circle</i> -->
                <!-- <i class="material-icons text-danger">highlight_off</i> -->
                <!-- <i class="material-icons text-warning">error_outline</i> -->
              </template>
              <template slot="difficulty" scope="problem">
                {{problem.value}}
              </template>
              <template slot="users" scope="problem">
                <router-link to="/">{{ problem.item.solvedBy }}</router-link>
              </template>
              <template slot="percentage" scope="problem">
                <div class="progress">
                  <div class="progress-bar" role="progressbar"
                  :aria-valuenow="solvePercent(problem.item.submissions,problem.item.solved)"
                  :aria-valuemin="0"
                  :aria-valuemax="100"
                  >
                  {{ solvePercent(problem.item.submissions,problem.item.solved) }}%
                </div>
              </div>
            </template>
          </m-table>
        </div>

        <div>
          <p class="text-muted text-center pull-left">Showing </p>
          <b-pagination
          size="sm"
          :total-rows="problemList.pagination.total"
          v-model="problemList.pagination.cur_page"
          :per-page="problemList.pagination.page_limit"
          class="pull-right"
          ></b-pagination>
        </div>
      </div>
    </loading-data>

    </div>
  </div>
</template>

<script>

  import has from 'has';
  import { mapGetters, mapActions } from 'vuex';

  export default {
    name: 'ProblemList',

    data () {
      return {
        fields: {
          index: {
            label: '#',
            class: ['pl-3','w-3', 'text-center', 'font-weight-bold']
          },
          title: {
            label: 'Title',
            class: 'w-64'
          },
          status: {
            label: '<i class="material-icons">person</i>',
            class: ['pl-3','w-3', 'text-center']
          },
          difficulty: {
            label: 'Difficulty',
            class: ['w-10']
          },
          users: {
            label: 'Users',
            class: ['w-5']
          },
          percentage:{
            label: 'AC %',
            class: 'w-15'
          }
        },

        currentPage: 0,
        loading: true,
        error: null
      };
    },

    computed: {
      ...mapGetters('problem', [
        'problemList',
        'getUser'
      ]),
      ...mapGetters([
        'isLoggedIn',
        'getUser'
      ])
    },

    mounted(){
      this
        .fetchProblems()
        .then(() => {
          this.loading = false;
        })
        .catch(err => {
          this.loading = false;
          this.error = err;
          console.log('error = ',err);
        });
    },

    methods: {

      solvePercent(triedBy, solvedBy){
        //console.log(triedBy + ' ' + solvedBy );
        return triedBy && triedBy >= 1
          ? Math.ceil( (100.0*parseFloat(solvedBy)) / parseFloat(triedBy) )
          : 0;
      },

      hasStatus(data){
        return this.isLoggedIn && has(data,'youSolved');
      },

      userStatus(data){
        if( data.youSolved )
          return '<i class="material-icons text-success">check_circle</i>';
        if( data.youTried )
          return '<i class="material-icons text-warning">error_outline</i>';

        return '';
      },

      userStatusText(data){
        if( data.youSolved )
          return 'Solved By Me';
        if( data.youTried )
          return 'Tried By Me';

        return '';
      },

      problemLink(prob){
        return `/problems/${prob.hash_id}/${prob.slug}`;
      },

      ...mapActions('problem', [
        'fetchProblems',
        'updateProblems'
      ])
    }
  };
</script>

