<template>
  <div class="row">
      <div class="col-md-12">

        <b-card class="mb-2" no-block title="Problems">

          <div class="card-block-title card-title">
           <h5>Problems</h5>
          </div>

          <transition-group
            name="custom-classes-transition"
            enter-active-class="animated fadeIn"
            leave-class="animated fadeOut"
          >

            <div v-if="loading" class="text-center big-loading" key="loadme">
             <clip-loader :loading="loading" size="30px" color="#34364c"></clip-loader>
            </div>

            <div key="thedata" v-else>
              <div v-if="!loading && problemList && problemList.problems.length" class="table-responsive">
                <m-table show-empty
                :items="problemList.problems"
                :fields="fields"
                class="problem-table"
                >
                  <template slot="index" scope="problem">
                    {{problem.index + 1}}
                  </template>
                  <template slot="title" scope="problem">
                    <router-link class="link" to="/problems/">{{problem.value}}</router-link>
                  </template>
                  <template slot="status" scope="problem">

                    <div v-if="hasStatus(problem.item)" v-html="userStatus(problem.item)"></div>

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
          </transition-group>

      </b-card>
    </div>
  </div>
</template>

<script>

  import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
  import has from 'has';
  import { mapGetters, mapActions } from 'vuex';

  export default {
    name: 'ProblemList',

    components: {
      ClipLoader
    },

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
        'problemList'
      ])
    },

    mounted(){

      this
        .fetchProblems()
        .then(() => {
          this.loading = false;
          setTimeout(() => {
            this.updateProblems(this.problemList);
          }, 2000);
        })
        .catch(err => {
          this.loading = false;
          this.error = err;
          console.log(err);
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
        return has(data,'youSolved');
      },

      userStatus(data){
        if( data.youSolved )
          return '<i class="material-icons text-success">check_circle</i>';
        if( data.youTried )
          return '<i class="material-icons text-warning">error_outline</i>';

        return '';
      },

      ...mapActions('problem', [
        'fetchProblems',
        'updateProblems'
      ])
    }
  };
</script>

