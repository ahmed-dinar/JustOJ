<template>
  <div class="row">
      <div class="col-md-9">
        <template v-if="problemList && problemList.problems.length">


          <b-card class="mb-2" no-block title="Problems">

          <div class="card-block-title card-title">
           <h5>Problems</h5>
          </div>


          <div class="table-responsive">
            <m-table hover show-empty
            :items="problemList.problems"
            :fields="fields"
            >
              <template slot="index" scope="problem">
                {{problem.index + 1}}
              </template>
              <template slot="title" scope="problem">
                {{problem.value}}
              </template>
              <template slot="difficulty" scope="problem">
                {{problem.value}}
              </template>
              <template slot="submissions" scope="problem">
                {{problem.value}}
              </template>
              <template slot="solved" scope="problem">
                {{problem.value}}
              </template>
            </m-table>
          </div>


          <div class="pull-right">
          <b-pagination
          size="sm"
          :total-rows="problemList.pagination.total"
          v-model="problemList.pagination.cur_page"
          :per-page="problemList.pagination.page_limit"
          ></b-pagination>
          </div>


          </b-card>
        </template>
      </div>
      <div class="col-md-3">
        <b-card class="mb-2">
        </b-card>
      </div>
  </div>
</template>

<script>

  import { mapGetters, mapActions } from 'vuex';

  export default {
    name: 'ProblemList',

    data () {
      return {
        fields: {
          index: {
            label: '#'
          },
          title: {
            label: 'Title'
          },
          difficulty: {
            label: 'Difficulty'
          },
          submissions: {
            label: 'submissions'
          },
          solved: {
            label: 'solved'
          }
        },

        currentPage: 0
      };
    },

    computed: {
      ...mapGetters('problem', [
        'problemList'
      ])
    },

    mounted(){
      this.fetchProblems();
      setTimeout(() => {
        this.updateProblems(this.problemList);
      }, 3000);
    },

    methods: {
      ...mapActions('problem', [
        'fetchProblems',
        'updateProblems'
      ])
    }
  };
</script>

