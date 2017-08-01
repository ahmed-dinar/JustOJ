<template>
  <div>
      <div class="col-md-12" v-if="!!error">
        <smooth-alert variant="danger" :show="!!error">
          {{ error }}
        </smooth-alert>
      </div>
      <div class="row" v-else>
        <div class="col-md-12">
          <smooth-alert variant="danger" :show="!!submitError" dismissible @dismissed="submitError=null">
            {{ submitError }}
          </smooth-alert>
          <smooth-alert :show="!!success" dismissible autoHide>
            {{ success }}
          </smooth-alert>
        </div>
        <div class="col-md-12 mb-5">
        <form @submit.prevent="submit('limits-form')" name="limits-form" data-vv-scope="limits-form">
          <div class="row">

              <div class="col-md-6">

                  <div class="col-md-8">

                    <h6 class="btn-iconic pl-0">
                      <i class="material-icons pr-1">update</i> Test Solution
                    </h6>

                    <div class="form-bundle">
                      <label for="inputLanguage">Language</label>
                      <div :class="{ 'has-danger': formError.has('limits-form.language')} ">
                        <b-form-select
                        v-model="language" id="inputLanguage" :options="languages" class="mb-3"
                        ></b-form-select>
                      </div>
                    </div>

                    <div class="form-bundle mb-3">
                      <label for="inputtimeLimit">Time Limit (s)</label>
                      <div :class="{ 'has-danger': formError.has('limits-form.timeLimit')} ">
                        <input
                        name="timeLimit"
                        v-model="timeLimit" id="inputtimeLimit" placeholder="0.0" class="form-control"
                        v-validate="'required|decimal|min_value:0|max_value:20'"
                        />
                        <span v-show="formError.has('limits-form.timeLimit')" class="help form-control-feedback">
                          {{ formError.first('limits-form.timeLimit') }}
                        </span>
                      </div>
                    </div>

                    <div class="form-bundle">
                      <label for="solutionFile">Judge Solution</label>
                      <b-form-file
                      ref="solutionFile"
                      name="solutionFile" choose-label="Choose Case Input File" id="solutionFile"
                      v-validate="'required'"
                      ></b-form-file>
                    </div>

                    <div class="form-bundle mt-3">
                      <submit-button css="btn btn-sm btn-primary" color="#fff" :submitting="submitting"></submit-button>
                    </div>
                  </div>

              </div>

            <div class="col-md-6">
              <h6 class="btn-iconic pl-0 mb-4">
                <i class="material-icons pr-1">timer</i> Runs
              </h6>

                <m-table
                :items="runs"
                :fields="fields"
                class="runs-table-sm"
                showEmpty
                >
                  <template slot="index" scope="runInfo">
                    {{runInfo.index + 1}}
                  </template>
                  <template slot="cpu" scope="runInfo">
                    {{ runInfo.value }}
                  </template>
                  <template slot="memory" scope="runInfo">
                    {{ runInfo.value }}
                  </template>
                  <template slot="status" scope="runInfo">
                    {{ runInfo.value }}
                  </template>
                </m-table>

            </div>

          </div>
          </form>
        </div>
  
        <hr/>

        <div class="col-md-12 mt-5 ml-3">
          <div class="d-flex justify-content-between">
            <router-link class="btn btn-outline-primary btn-xs" :to="previousStep">
              <i class="material-icons">navigate_before</i>
            </router-link>
          </div>
        </div>

      </div>
  </div>
</template>

<script>

  import { LOG_OUT } from '@/store/mutation-types';
  import swal from 'sweetalert2';

  export default {
    name: 'ProblemsEditLimits',

    data () {
      return {
        success: null,
        submitError: null,
        submitting: false,
        error: null,
        language: 'c',
        timeLimit: null,
        fields:{
          index: {
            label: '#',
            class: ['text-center']
          },
          cpu: {
            label: 'CPU'
          },
          memory: {
            label: 'Memory'
          },
          status: {
            label: 'Status'
          }
        },
        runs: [],
        // runs: [
        //   {
        //     id: '1',
        //     cpu: '0.09',
        //     memory: '244',
        //     status: 'Accepted'
        //   },
        //   {
        //     id: '2',
        //     cpu: '1.00',
        //     memory: '744',
        //     status: 'TLE'
        //   }
        // ],
        languages: [
          {
            text: 'C',
            value: 'c'
          },
          {
            text: 'C++',
            value: 'cpp'
          }
        ]
      };
    },

    computed: {
      previousStep(){
        return `/problems/${this.$store.state.route.params.pid}/edit/testcase`;
      }
    },

    created(){
      this.loading = true;
      //this.fetchTestCases();
    },

    methods: {
      submit(){

        this.success = null;
        this.submitting = true;
        this.submitError = null;
        this.error = null;
        progressbar.start();

        let sourceFile = document.getElementById('solutionFile').files;

        if( !sourceFile.length ){
          swal({
            title: 'Error',
            text: 'Source Required',
            type: 'error'
          });
          return this.formDone();
        }

        if( !this.timeLimit ){
          swal({
            title: 'Error',
            text: 'TimeLimit required',
            type: 'error'
          });
          return this.formDone();
        }

        var postData = new FormData();
        postData.append('cpu', this.timeLimit);
        postData.append('language', this.language);
        postData.append('source', sourceFile[0]);

        this.$http
          .post(`/api/problem/edit/limits/${this.$store.state.route.params.pid}`, postData, {
            headers: {
              'Content-Type': 'multipart/form-data; charset=UTF-8'
            },
            onUploadProgress: function(progressEvent) {
              var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
              console.log(`completed: ${percentCompleted}`);
            }
          })
          .then(response => {
            console.log(response.data);
            this.formDone();
          })
          .catch(err => {
            console.log(err);
            let errors = this.getApiError(err);
            switch (err.response.status) {
              case 401:
                this.$store.commit(LOG_OUT);
                this.$router.replace({ path: '/login' });
                break;
              case 400:
              case 404:
                this.submitError = errors;
                break;
              default:
                this.error = errors;
            }
            this.formDone();
          });

        ///edit/limits/:pid

      },
      formDone(){
        this.submitting = false;
        progressbar.done();
        progressbar.remove();
        this.$refs.solutionFile.reset();
      },

      fetchTestCases(isForm = false){
        let pid = this.$store.state.route.params.pid;

        this.$http
          .get(`/api/problem/edit/testcase/${pid}`)
          .then(response => {
            this.testCases = response.data;
            if(isForm){
              this.formDone(false);
            }else{
              this.loading = false;
            }
            console.log(this.testCases);
          })
          .catch(err => {
            this.error = this.getApiError(err);
            if(isForm){
              this.formDone();
            }else{
              this.loading = false;
            }
          });
      },
      handleError(err){
        let errors = this.getApiError(err);

        switch (err.response.status) {
          case 401:
            this.$store.commit(LOG_OUT);
            this.$router.replace({ path: '/login' });
            break;
          case 400:
          case 404:
            this.submitError = errors;
            break;
          default:
            this.error = errors;
        }
      }
    },

    mounted(){
      console.log(this.$store.state.route.params);
      setTimeout(()=>{
        this.runs.push( {
          id: '3',
          cpu: '1.00',
          memory: '1000',
          status: 'WA'
        });
      },3000);
    }
  };
</script>

