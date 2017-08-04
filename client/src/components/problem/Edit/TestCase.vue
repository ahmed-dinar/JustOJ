<template>
  <div class="edit-testcase">

      <div class="col-md-12">
        <flash-message variant="danger"></flash-message>
      </div>

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

        <div class="col-md-12">
          <b-card class="mb-2" no-block>
            <loading-data :loading="loading">

              <div class="card-block-title card-title text-center">
                  <h5>Test Cases</h5>
                  <p>{{ testCases.length }} added</p>
              </div>

              <div v-if="!loading && !emptyCases" class="table-responsive">
                <m-table show-empty
                :items="testCases"
                :fields="fields"
                keyIdentifier="hash"
                >

                  <template slot="empty" scope="cases">
                  </template>
                  <template slot="index" scope="cases">
                    {{cases.index + 1}}
                  </template>
                  <template slot="input" scope="cases">
                    <a
                      class="btn btn-xs btn-info"
                      :href="showCase(cases.item,'input')"
                      target="_blank"
                    >
                        <i class="material-icons">remove_red_eye</i> View Input
                    </a>
                  </template>
                  <template slot="output" scope="cases">
                    <a
                      class="btn btn-xs btn-info"
                      :href="showCase(cases.item,'output')"
                      target="_blank"
                    >
                        <i class="material-icons">remove_red_eye</i> View Output
                    </a>
                  </template>
                  <template slot="delete" scope="cases">
                    <button class="btn btn-xs btn-danger" @click="removeCase(cases.item)">
                      <i class="material-icons">delete</i> Remove
                    </button>
                  </template>
                  <template slot="empty2" scope="cases">
                  </template>

                </m-table>
              </div>
            </loading-data>
          </b-card>
        </div>

        <div class="col-md-12">
          <b-card class="mb-2">
          <form @submit.prevent="submit('edit-case-form')" name="edit-case-form" data-vv-scope="edit-case-form">
             <div class="row">

              <div class="col-md-6">
                <h6>Input</h6>
                <div :class="{ 'has-danger': inputFileError }">
                  <b-form-file
                  ref="fileinput"
                  v-model="inputFile" name="inputFile" choose-label="Choose Case Input File" id="inputFile"
                  v-validate="'required'"
                  ></b-form-file>
                  <span v-show="inputFileError" class="help form-control-feedback">
                    {{ inputFileError }}
                  </span>
                </div>
              </div>
              <div class="col-md-6">
                <h6>Output</h6>
                <div :class="{ 'has-danger': outputFileError }">
                  <b-form-file
                  ref="fileoutput"
                  v-model="outputFile" name="outputFile" choose-label="Choose Case Ouput File" id="outputFile"
                  v-validate="'required'"
                  ></b-form-file>
                  <span v-show="outputFileError" class="help form-control-feedback">
                    {{ outputFileError }}
                  </span>
                </div>
              </div>
              <div class="ml-3 mt-3">
                <submit-button :submitting="submitting"></submit-button>
              </div>
            </div>
          </form>
        </b-card>

      </div>

      <div class="col-md-12 mt-2">
        <div class="d-flex justify-content-between">
          <router-link class="btn btn-outline-primary btn-xs" :to="previousStep">
            <i class="material-icons">navigate_before</i>
          </router-link>
          <router-link :class="['btn', 'btn-outline-primary', 'btn-xs', 'pull-right', emptyCases ? 'disabled' : '' ]" :to="nextStep">
            <i class="material-icons">navigate_next</i>
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
    name: 'ProblemsEditCases',

    data () {
      return {
        success: null,
        submitError: null,
        submitting: false,
        error: null,
        testCases: [],
        loading: true,
        inputFile: null,
        outputFile: null,
        inputFileError: null,
        outputFileError: null,
        fields:{
          empty: {
            label: '',
            class: ['w-20']
          },
          index: {
            label: '#',
            class: ['pl-3', 'text-center', 'font-weight-bold']
          },
          input: {
            label: 'Input',
            class: ['text-center']
          },
          output: {
            label: 'Output',
            class: ['text-center']
          },
          delete: {
            label: 'Delete',
            class: ['text-center']
          },
          empty2: {
            label: '',
            class: ['w-20']
          }
        }
      };
    },

    computed: {
      emptyCases(){
        return !this.testCases || !this.testCases.length;
      },
      nextStep(){
        return `/problems/${this.$store.state.route.params.pid}/edit/limits`;
      },
      previousStep(){
        return `/problems/${this.$store.state.route.params.pid}/edit/statement`;
      }
    },

    created(){
      this.loading = true;
      this.fetchTestCases();
    },

    methods: {
      submit(){

        this.success = null;
        this.submitting = true;
        this.submitError = null;
        progressbar.start();

        this.inputFileError = null;
        this.outputFileError = null;

        let inputSelectedFile = document.getElementById('inputFile').files;
        let outputSelectedFile = document.getElementById('outputFile').files;

        if( !inputSelectedFile.length ){
          this.inputFileError = 'Input file is required';
          return this.formDone();
        }

        if( !outputSelectedFile.length ){
          this.outputFileError = 'Output file is required';
          return this.formDone();
        }

        var caseData = new FormData();
        caseData.append('input', inputSelectedFile[0]);
        caseData.append('output', outputSelectedFile[0]);

        this.$http
          .post(`/api/problem/edit/testcase/${this.$store.state.route.params.pid}`, caseData, {
            headers: {
              'Content-Type': 'multipart/form-data; charset=UTF-8'
            },
            onUploadProgress: function(progressEvent) {
              var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
              console.log(`completed: ${percentCompleted}`);
            }
          })
          .then(response => {
            this.success = 'Test Case Added';
            this.fetchTestCases(true);
          })
          .catch(err => {
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
      },
      formDone(goTop = true){
        this.submitting = false;
        progressbar.done();
        progressbar.remove();
        this.$refs.fileinput.reset();
        this.$refs.fileoutput.reset();
        if(goTop){
          window.scrollTo(0, 0);
        }
      },
      removeCase(caseId){

        swal({
          title: 'Are you sure?',
          text: 'You won\'t be able to revert this.',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Remove',
          animation: false,
          customClass: 'animated fadeIn'
        }).then(() => {

          caseId = caseId.hash;
          console.log(caseId);

          this.success = null;
          //this.submitting = true;
          this.submitError = null;
          progressbar.start();

          swal('Please Wait');
          swal.showLoading();

          this.$http
            .post(`/api/problem/edit/testcase/${this.$store.state.route.params.pid}?action=remove`, {
              case: caseId
            })
            .then(response => {
              //this.success = 'Test Case Removed';

              swal({
                title: 'Deleted',
                text: 'Test Case has been deleted.',
                type: 'success'
              }).then(() => {
                this.fetchTestCases(true);
              });


            })
            .catch(err => {
              this.formDone();
              this.handleError(err);
              swal(
                'Error!',
                this.submitError || this.error,
                'error'
              );
            });

        });
        return;


      },
      showCase(caseId, caseType){
        let caseURL = `/problems/testcase/${this.$store.state.route.params.pid}/${caseId.hash}?type=${caseType}`;
        return caseURL;
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

    watch: {
      inputFile: function(val){
        if(val){
          this.inputFileError = null;
        }
      },
      outputFile: function(val){
        if(val){
          this.outputFileError = null;
        }
      }
    },

    mounted(){
      console.log(this.$store.state.route.params);
    }
  };
</script>

