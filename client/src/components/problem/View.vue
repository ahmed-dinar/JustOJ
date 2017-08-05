<template>
  <div>

    <div class="col-md-12" v-if="!!error">
      <smooth-alert variant="danger" :show="!!error">
        {{ error }}
      </smooth-alert>
    </div>

    <div v-else class="col-md-12 pl-0">

      <div class="col-md-12">
        <smooth-alert variant="danger" :show="!!submitError" dismissible @dismissed="submitError=null">
          {{ submitError }}
        </smooth-alert>
        <smooth-alert :show="!!success" dismissible autoHide>
          {{ success }}
        </smooth-alert>
      </div>

      <div class="col-md-12">
        <div class="row">

          <div class="col-md-9 pl-0 mb-2 problem-content-wrapper">
            <loading-data :loading="loading">
              <template v-if="problem">
                <h5 class="pt-3 mb-0">{{ problem.title }}</h5>
                <p class="mb-4 limit-text">Limits: <span>{{ roundTo(problem.cpu) }}s, {{ problem.memory }} MB</span></p>

                <div class="problem-content" v-html="problem.statement"></div>
                <h6 class="mt-4">Samples</h6>
                <table class="table">
                  <tbody>
                    <tr>
                      <td><pre>{{ problem.input }}</pre></td>
                      <td><pre>{{ problem.output }}</pre></td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </loading-data>
          </div>

          <div class="col-md-3 pr-0">

            <!--Problem Tag List -->
            <div class="w-100 mb-5">
              <p class="mb-1 btn-iconic pl-0">
                  <strong><i class="material-icons">local_offer</i> Tags</strong>
              </p>
              <div class="p-1">
                <loading-pulse :loading="loading" css="" size="7px">
                  <template v-if="tags && tags.length">
                    <template v-for="ptag in tags">
                      <router-link :to="tagLink(ptag)">
                        <b-badge class="tag-badge">
                          {{ ptag }}
                        </b-badge>
                      </router-link>
                    </template>
                  </template>
                  <div class="text-center" v-else>
                    <small class="text-muted">No Tags Added</small>
                  </div>
                </loading-pulse>
               </div>
            </div>

            <!-- Submit Problem -->
            <div class="w-100 mb-5" v-if="!loading && problem">

              <template v-if="isLoggedIn">
                <form @submit.prevent="submit('submit-form')" name="submit-form">
                  <div class="p-0">

                    <p class="mb-1 btn-iconic pl-0">
                      <strong><i class="material-icons">near_me</i> Submit</strong>
                    </p>

                    <div class="p-1">
                      <div class="form-bundle">
                        <label for="inputLanguage">Languge</label>
                        <b-form-select
                        v-model="language" id="inputLanguage" :options="languages" class="mb-3"
                        ></b-form-select>
                      </div>

                      <div class="form-bundle">
                        <label for="solutionFile">Source</label>
                        <b-form-file
                        ref="solutionFile"
                        name="solutionFile" choose-label="Source..." id="source"
                        ></b-form-file>
                      </div>

                      <div class="form-bundle mt-3">
                        <submit-button css="btn btn-sm btn-primary" color="#fff" :submitting="submitting"></submit-button>
                      </div>

                    </div>
                  </div>

                </form>
              </template>
              <div class="p-0" v-else>
                <p class="mb-1 btn-iconic pl-0">
                  <strong><i class="material-icons">near_me</i> Submit</strong>
                </p>
                <router-link class="btn btn-sm btn-primary ml-1" to="/login">Login</router-link>
              </div>

            </div>

            <!-- Problem Ranking -->
            <div class="w-100 mb-5">
              <p class="mb-1 btn-iconic pl-0">
                <strong><i class="material-icons">people</i> Rank</strong>
              </p>
              <div class="p-1">
                <loading-pulse :loading="rankLoading" css="" size="7px">
                  <template v-if="ranks && ranks.length">
                    <!-- goes here -->
                  </template>
                  <div class="text-center" v-else>
                    <small class="text-muted">Nobody solved yet!</small>
                  </div>
                </loading-pulse>
               </div>
            </div>

            <!-- My Submissions -->
            <div class="w-100 mb-4">
              <p class="mb-1 btn-iconic pl-0">
                <strong><i class="material-icons">equalizer</i> My Submissions</strong>
              </p>
              <div class="p-1">
                <loading-pulse :loading="subsLoading" css="" size="7px">
                  <template v-if="submissions && submissions.length">
                    <!-- goes here -->
                  </template>
                  <div class="text-center" v-else>
                    <small class="text-muted">No submissions found</small>
                  </div>
                </loading-pulse>
               </div>
            </div>



          </div>

        </div>
      </div>

    </div>

  </div>
</template>

<script>

  import { mapGetters } from 'vuex';

  export default {
    name: 'ViewProblem',

    data () {
      return {
        rankLoading: true,
        subsLoading: true,
        loading: true,
        problem: null,
        error: null,
        submitError: null,
        success: null,
        submitting: false,
        language: 'c',
        ranks: null,
        submissions: null,
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
      params(){
        return this.$store.state.route.params;
      },
      tags(){
        if(!this.problem || !this.problem.tags){
          return [];
        }
        return this.problem.tags.split(',');
      },
      ...mapGetters([
        'isLoggedIn'
      ])
    },

    methods: {

      submit(){
        if(this.submitting){
          return;
        }

        let sourceFile = document.getElementById('source').files;
        if( !sourceFile.length ){
          return;
        }

        var postData = new FormData();
        postData.append('language', this.language);
        postData.append('source', sourceFile[0]);

        this.success = null;
        this.submitting = true;
        this.submitError = null;
        this.error = null;
        progressbar.start();

        this.$http
          .post(`/api/problem/${this.params.pid}`, postData, {
            headers: {
              'Content-Type': 'multipart/form-data; charset=UTF-8'
            }
          })
          .then(response => {
            this.success = 'Submitted';
            this.formDone();
            this.resetForm();
          })
          .catch(this.handleError);
      },

      fetchProblem(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/problem/${this.params.pid}`)
          .then(response => {
            this.problem = response.data;
            this.fetchRank();
          })
          .catch(this.handleError);
      },

      fetchRank(){
        this.$http
          .get(`/api/problem/rank/${this.params.pid}`)
          .then(response => {
            console.log(response.data);
            this.fetchSubmissions();
          })
          .catch(this.handleError);
      },

      fetchSubmissions(){
        this.$http
          .get(`/api/problem/submission/${this.params.pid}`)
          .then(response => {
            console.log(response.data);
            this.formDone();
          })
          .catch(this.handleError);
      },

      formDone(){
        this.loading = false;
        this.submitting = false;
        this.rankLoading = false;
        this.subsLoading = false;
        progressbar.done();
        progressbar.remove();
      },

      resetForm(){
        this.language = 'c';
        this.$refs.solutionFile.reset();
      },

      handleError(err){
        let errors = this.getApiError(err);

        switch (err.response.status) {
          case 400:
          case 404:
            this.submitError = errors;
            break;
          default:
            this.error = errors;
        }
        this.formDone();
      },

      roundTo(num) {
        if( !num || num === undefined ){
          return '0.00';
        }
        num = parseFloat(parseInt(num)/1000.0);
        num = num.toString();
        return (num.indexOf('.') > -1 ? num+'00' : num+'.00').match(/^-?\d+(?:\.\d{0,2})?/)[0];
      },

      tagLink(tagName){
        return `/problems?tag=${tagName}`;
      }
    },

    mounted(){
      this.fetchProblem();
    },

    created(){
      console.log(this.$store.state.route.params.pid);
      console.log(this.$store.state.route.params.slug);
    }
  };
</script>

