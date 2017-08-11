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
          <smooth-alert :show="!!success" dismissible>
            {{ success }}
          </smooth-alert>
        </div>

        <div class="col-md-12 mb-5">

          <div class="row">
            <div class="col-md-6">

              <form @submit.prevent="submit('limits-form')" name="limits-form" data-vv-scope="limits-form">
                <div class="row">
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
                      ></b-form-file>
                    </div>

                    <div class="form-bundle mt-3">
                      <submit-button css="btn btn-sm btn-primary" color="#fff" :submitting="submitting"></submit-button>
                    </div>
                  </div>
                </div>
              </form>

              <!-- Test case passed with given cpu time -->
              <form @submit.prevent="saveLimit('limits-set-form')" name="limits-set-form" data-vv-scope="limits-set-form" v-if="testPassed">
                <div class="row pt-5">
                  <div class="col-md-8">

                    <h6 class="btn-iconic pl-0">
                      <i class="material-icons pr-1">done_all</i> Test Limit Passed
                    </h6>

                    <div class="form-bundle">
                      <label for="inputfinalLimit">Time Limit</label>
                      <div :class="{ 'has-danger': formError.has('limits-set-form.finalLimit')} ">
                        <input
                        name="finalLimit"
                        v-model="finalLimit" id="inputfinalLimit" placeholder="0.0" class="form-control"
                        v-validate="'required|decimal|min_value:0|max_value:20'"
                        />
                        <span v-show="formError.has('limits-set-form.finalLimit')" class="help form-control-feedback">
                          {{ formError.first('limits-set-form.finalLimit') }}
                        </span>
                      </div>
                    </div>

                    <div class="form-bundle mt-3">
                      <submit-button css="btn btn-md btn-primary" color="#fff" :submitting="submitting">
                        Save & Finish
                      </submit-button>
                    </div>

                  </div>
                </div>
              </form>

            </div>

            <div class="col-md-6">

                <h6 class="btn-iconic pl-0 mb-4">
                  <i class="material-icons pr-1">timer</i> Test Status
                </h6>

                <template v-if="loading || finalResult">
                  <loading-data :loading="loading">

                    <table class="table runs-table-sm" v-if="finalResult">
                      <thead>
                        <tr>
                          <th>CPU</th>
                          <th>memory</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{{ roundTo(finalResult.cpu) }}</td>
                          <td>{{ finalResult.memory }} KB</td>
                          <td>
                            <b-badge :variant="statusVariant(finalResult.code)">
                              {{  getRunStatus(finalResult.code) }}
                            </b-badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <template v-if="runs">
                      <p class="mb-1 btn-iconic"><strong><i class="material-icons">playlist_add_check</i> Test Cases</strong></p>
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
                          {{ roundTo(runInfo.value) }}s
                        </template>
                        <template slot="memory" scope="runInfo">
                          {{ runInfo.value }} KB
                        </template>
                        <template slot="result" scope="runInfo">
                           <b-badge :variant="statusVariant(runInfo.item.code)">{{ getRunStatus(runInfo.item.code) }}</b-badge>
                        </template>
                      </m-table>
                    </template>

                  </loading-data>
                </template>
                <div class="text-center" v-else>
                  <small class="text-muted">Submit Solution To See Status</small>
                </div>

            </div>

          </div>

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

  import runStatus from '@/lib/runStatus';
  import { LOG_OUT } from '@/store/mutation-types';
  import swal from 'sweetalert2';

  export default {
    name: 'ProblemsEditLimits',

    data () {
      return {
        finalLimit: null,
        loading: false,
        success: null,
        submitError: null,
        submitting: false,
        error: null,
        language: 'c',
        timeLimit: null,
        finalResult: null,
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
          result: {
            label: 'Status'
          }
        },
        runs: [],
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
      },
      testPassed(){
        return this.finalResult && parseInt(this.finalResult.code) === 0;
      }
    },


    methods: {

      submit(scope){

        //already running
        if( this.loading || this.submitting ){
          return;
        }

        this.$validator
          .validateAll(scope)
          .then(result => {
            if(!result){
              return this.formDone(false);
            }

            let sourceFile = document.getElementById('solutionFile').files;
            if( !sourceFile.length ){
              swal({
                title: 'Error',
                text: 'Source Required',
                type: 'error'
              });
              return this.formDone(false);
            }

            var postData = new FormData();
            postData.append('cpu', this.timeLimit);
            postData.append('language', this.language);
            postData.append('source', sourceFile[0]);

            this.finalResult = null;
            this.success = null;
            this.submitting = true;
            this.submitError = null;
            this.error = null;
            this.loading = true;
            progressbar.start();

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
                this.runs = response.data.runs;
                this.finalResult = response.data.final;
                this.formDone();
              })
              .catch(this.handleError);
          });
      },
      saveLimit(scope){

        this.$validator
          .validateAll(scope)
          .then(result => {
            if(!result){
              return this.formDone(false);
            }

            this.$http
              .post(`/api/problem/edit/limits/${this.$store.state.route.params.pid}?action=save`, {
                cpu: this.finalLimit
              })
              .then(response => {
                this.success = 'Limit Saved';
                this.formDone();
              })
              .catch(this.handleError);
          });

      },
      getRunStatus(status){
        return runStatus[parseInt(status)];
      },
      statusVariant(code){
        code = parseInt(code);
        switch(code){
          case 0:
            return 'success';
          case 5:
            return 'default';
          case 6:
            return 'info';
          case 8:
            return 'warning';
          default:
            return 'danger';
        }
      },
      formDone(reset = true){
        this.loading = false;
        this.submitting = false;
        progressbar.done();
        progressbar.remove();
        if( reset ){
          this.resetForm();
        }
      },
      resetForm(){
        this.finalLimit = null;
        this.timeLimit = null;
        this.$refs.solutionFile.reset();
        this.$nextTick(() => {
          this.formError.clear('limits-form');
          this.formError.clear('limits-set-form');
        });
      },
      roundTo(num) {
        if( !num || num === undefined ){
          return '0.00';
        }
        num = num.toString();
        return (num.indexOf('.') > -1 ? num+'00' : num+'.00').match(/^-?\d+(?:\.\d{0,2})?/)[0];
      },
      handleError(err){
        let errors = this.getApiError(err);

        switch (err.response.status) {
          case 401:
            this.$store.commit(LOG_OUT);
            this.$router.replace({ path: '/login' });
            break;
          case 303:
            this.flash({ message: errors, variant: 'danger' });
            this.$router.replace({ path: `/problems/${this.$store.state.route.params.pid}/edit/testcase` });
            break;
          case 400:
          case 404:
            this.submitError = errors;
            break;
          default:
            this.error = errors;
        }
        this.formDone();
      }
    },

    mounted(){
      console.log(this.$store.state.route.params);
    }
  };
</script>

