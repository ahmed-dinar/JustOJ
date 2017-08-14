<template>
  <div class="mb-5">
    <div class="col-md-12" v-if="!!error">
      <smooth-alert variant="danger" :show="!!error">{{ error }}</smooth-alert>
    </div>

    <div v-else>

      <b-alert variant="danger" class="text-center" dismissible :show="!!createError" @dismissed="createError=''" >
        {{ createError }}
      </b-alert>

      <div class="col-md-12" v-show="!loading">


        <form @submit.prevent="submit('create-problem-form')" name="create-problem-form" data-vv-scope="create-problem-form">

          <div class="row" v-if="preview">
            <div class="problem-content-wrapper col-md-9 p-0">
              <b-card no-block class="mb-0 p-3 w-100">
                <h5 class="pt-3">{{ title }}</h5>
              </b-card>
              <b-card no-block class="mb-4 p-3 w-100">
                <div class="problem-content" v-html="content"></div>

                <h6 class="mt-4">Samples</h6>
                <table class="table">
                  <tbody>
                    <tr>
                      <td><pre>{{ sampleInput }}</pre></td>
                      <td><pre>{{ sampleOutput }}</pre></td>
                    </tr>
                  </tbody>
                </table>
              </b-card>
            </div>
            <div class="col-md-3"></div>
          </div>

          <div v-show="!preview">

            <div class="row mb-3">
              <div class="form-bundle">
                <label for="problemTitle">Title</label>
                <div :class="{ 'has-danger': formError.has('create-problem-form.title')} ">
                  <input
                    type="text" class="form-control" id="problemTitle" placeholder="Problem Title"
                    name="title"
                    v-model="title"
                    v-validate="'required|min:6|max:1000'"
                  >
                  <span v-show="formError.has('create-problem-form.title')" class="help form-control-feedback">
                    {{ formError.first('create-problem-form.title') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-4 p-0 pr-2">
                <div class="form-bundle">
                  <label for="problemAuthor">Author</label>
                  <div :class="{ 'has-danger': formError.has('create-problem-form.author')} ">
                    <input
                    type="text" class="form-control" id="problemAuthor" placeholder="Author name"
                    name="author"
                    v-model="author"
                    v-validate="'required|min:3|max:50'"
                    >
                    <span v-show="formError.has('create-problem-form.author')" class="help form-control-feedback">
                      {{ formError.first('create-problem-form.author') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="col-md-4 p-0 pr-2">
                <div class="form-bundle">
                  <label for="problemScore">Score</label>
                  <div :class="{ 'has-danger': formError.has('create-problem-form.score')} ">
                    <input
                    type="text" class="form-control" id="problemScore" placeholder="score"
                    name="score"
                    v-model="score"
                    v-validate="'required|numeric|min_value:0|max_value:10'"
                    >
                    <span v-show="formError.has('create-problem-form.score')" class="help form-control-feedback">
                      {{ formError.first('create-problem-form.score') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="col-md-4 p-0">
                <div class="form-bundle">
                  <label for="problemDifficulty">Difficulty</label>
                  <div :class="{ 'has-danger': formError.has('create-problem-form.difficulty')} ">
                    <b-form-select textarea
                    type="text" class="form-control" id="problemDifficulty"
                    :options="difficulties"
                    name="difficulty"
                    v-model="difficulty"
                    v-validate="'required'"
                    ></b-form-select>
                    <span v-show="formError.has('create-problem-form.difficulty')" class="help form-control-feedback">
                      {{ formError.first('create-problem-form.difficulty') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 p-0 pr-2">
                <div class="form-bundle">
                  <label for="problemTags">Tags</label>
                  <multiselect
                  id="problemTags"
                  v-model="tags"
                  :options="tagList"
                  :multiple="true"
                  placeholder="Add tag"
                  HideSelected="true"
                  label="text"
                  track-by="value"
                  >
                  </multiselect>
                </div>
              </div>
              <div class="col-md-6 p-0 pl-2">
                <div class="form-bundle">
                  <label for="problemCategory">Category</label>
                  <div :class="{ 'has-danger': formError.has('create-problem-form.category')} ">
                    <b-form-select textarea
                    type="text" class="form-control" id="problemCategory"
                    :options="categories"
                    name="category"
                    v-model="category"
                    v-validate="'required'"
                    ></b-form-select>
                    <span v-show="formError.has('create-problem-form.category')" class="help form-control-feedback">
                      {{ formError.first('create-problem-form.category') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 p-0 pr-2">
                <div class="form-bundle">
                  <label for="sampleInput">Sample Input</label>
                  <div :class="{ 'has-danger': formError.has('create-problem-form.sampleInput')} ">
                    <b-form-input textarea
                    type="text" class="form-control" id="sampleInput" placeholder=""
                    name="sampleInput"
                    v-model="sampleInput"
                    v-validate="'required'"
                    ></b-form-input>
                    <span v-show="formError.has('create-problem-form.sampleInput')" class="help form-control-feedback">
                      {{ formError.first('create-problem-form.sampleInput') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="col-md-6 p-0 pl-2">
                <div class="form-bundle">
                  <label for="sampleOutput">Sample Output</label>
                  <div :class="{ 'has-danger': formError.has('create-problem-form.sampleOutput')} ">
                    <b-form-input textarea
                    type="text" class="form-control" id="sampleOutput" placeholder=""
                    name="sampleOutput"
                    v-model="sampleOutput"
                    v-validate="'required'"
                    ></b-form-input>
                    <span v-show="formError.has('create-problem-form.sampleOutput')" class="help form-control-feedback">
                      {{ formError.first('create-problem-form.sampleOutput') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="form-bundle">
              <label for="problemContentEditor">Problem Statement</label>
              <quill-editor
                :class="[ isFullscreen ? 'fullScreenEditor' : 'normalEditor' ]"
                id="problemContentEditor"
                ref="problemEditor"
                v-model="content"
                :options="editorOption"
                @ready="onEditorReady($event)"
              >
                <div id="toolbar" slot="toolbar">

                  <div class="ql-formats">
                    <button class="ql-bold" data-toggle="tooltip" data-placement="bottom" title="Bold"></button>
                    <button class="ql-italic" data-toggle="tooltip" data-placement="bottom" title="Italic"></button>
                    <button class="ql-underline" data-toggle="tooltip" data-placement="bottom" title="underline"></button>
                    <button class="ql-blockquote" data-toggle="tooltip" data-placement="bottom" title="Block Quote"></button>
                    <button class="ql-code" data-toggle="tooltip" data-placement="bottom" title="Code snippet"></button>
                  </div>

                  <div class="ql-formats">
                    <select class="ql-align" data-toggle="tooltip" data-placement="bottom" title="alignment"></select>
                    <button class="ql-indent" value="-1" data-toggle="tooltip" data-placement="bottom" title="indent left"></button>
                    <button class="ql-indent" value="+1" data-toggle="tooltip" data-placement="bottom" title="indent right"></button>
                    <button class="ql-list" value="ordered" data-toggle="tooltip" data-placement="bottom" title="ordered list"></button>
                    <button class="ql-list" value="bullet" data-toggle="tooltip" data-placement="bottom" title="bullet list"></button>
                  </div>

                  <div class="ql-formats">
                    <select class="ql-size" data-toggle="tooltip" data-placement="bottom" title="font size"></select>
                    <button class="ql-header" value="1" data-toggle="tooltip" data-placement="bottom" title="header 1"></button>
                    <button class="ql-header" value="2" data-toggle="tooltip" data-placement="bottom" title="header 2"></button>
                    <select class="ql-header" data-toggle="tooltip" data-placement="bottom" title="header size"></select>
                  </div>

                  <div class="ql-formats">
                    <button class="ql-image" data-toggle="tooltip" data-placement="bottom" title="image"></button>
                    <button class="ql-video" data-toggle="tooltip" data-placement="bottom" title="video"></button>
                    <button class="ql-link" data-toggle="tooltip" data-placement="bottom" title="link"></button>
                    <button class="ql-formula" data-toggle="tooltip" data-placement="bottom" title="formula"></button>
                    <button @click="fullScreen" class="ql-toggle-btn" data-toggle="tooltip" data-placement="bottom" :title="isFullscreen ? 'exit fullscreen' : 'fullscreen'">
                      <i class="material-icons" v-if="!isFullscreen">fullscreen</i>
                      <i class="material-icons" v-else>fullscreen_exit</i>
                    </button>
                  </div>


                  <div class="ql-formats">
                    <toggle-button
                      data-toggle="tooltip" data-placement="bottom" title="live preview"
                      @change="preview = $event.value"
                      :value="false"
                      :width="65"
                      :height="20"
                      :labels="{ checked: 'preview', unchecked: 'preview' }"
                    />
                  </div>


                </div>
              </quill-editor>
              <div class="text-right">
                <a class="pull-right help-block" href="https://khan.github.io/KaTeX/function-support.html" target="_blank">Formula Help</a>
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <submit-button :submitting="loading" css="btn btn-lg btn-outline-primary"></submit-button>
          </div>

        </form>

      </div>

    </div>
  </div>
</template>

<script>

  import has from 'has';
  import { LOG_OUT } from '@/store/mutation-types';
  import Multiselect from 'vue-multiselect';
  import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
  import problem from '@/config/problem';

  export default {
    name: 'CreateProblems',

    components: {
      Multiselect,
      PulseLoader
    },

    data () {
      return {
        error: null,
        sampleInput: problem.create.options.sampleInput,
        sampleOutput: problem.create.options.sampleOutput,
        createError: null,
        isFullscreen: false,
        preview: false,
        content: problem.create.default,
        title: 'Sample Title',
        author: 'Author Name',
        score: '10',
        tags: null,
        category: '',
        difficulty: '',
        tagList: problem.create.options.tags,
        difficulties: problem.create.options.difficulties,
        categories: problem.create.options.categories,
        editorOption: {
          modules: {
            formula: true,
            toolbar: {
              container: '#toolbar',
              handlers: {
                'image': function(value) {
                  if (value) {
                    var range = this.quill.getSelection();
                    var href = prompt('What is the image URL');
                    this.quill.insertEmbed(range.index, 'image', href, Quill.sources.USER);
                  }
                }
              }
            }
          }
        },
        loading: true
      };
    },

    computed: {
      selectedTags(){
        return !this.tags
          ? null
          : this.tags.map(val => val.value);
      }
    },

    methods: {

      formDone(){
        this.loading = false;
        this.preview = false;
        progressbar.done();
        progressbar.remove();
        window.scrollTo(0, 0);
      },

      submit(scope){

        this.loading = true;
        this.createError = '';
        progressbar.start();

        this.$validator
          .validateAll(scope)
          .then(result => {

            if(!result){
              return this.formDone();
            }

            let prob = {
              statement: this.content,
              input: this.sampleInput,
              output: this.sampleOutput,
              title: this.title,
              author: this.author,
              tags: this.selectedTags,
              score: this.score,
              category: this.category,
              difficulty: this.difficulty
            };

            if( has(this.$store.state.route.query,'contest') ){
              prob.cid = this.$store.state.route.query.contest;
            }

            this.$http
              .post('/api/problem/create', prob)
              .then(response => {
                this.$noty.success('Problem Successfully Created');
                this.formDone();
                this.$router.replace(`/problems/${response.data.id}/edit/testcase`);
              })
              .catch(err => {
                this.formDone();
                this.createError = has(err.response.data,'error')
                ? err.response.data.error
                : `${err.response.status} ${err.response.statusText}`;
              });
          });
      },
      onEditorReady(editor) {
        console.log('editor ready!', editor);
      },
      fullScreen(){
        if (screenfull.enabled) {
          screenfull.toggle( document.getElementById('problemContentEditor') );
        }
      },
      fullScreenListener(){
        this.isFullscreen = screenfull.isFullscreen;
      }
    },

    beforeDestroy(){
      if (screenfull.enabled){
        screenfull.off('change', this.fullScreenListener);
      }
    },

    created(){

      if (screenfull.enabled) {
        screenfull.on('change', this.fullScreenListener);
      }

      this.$http
        .get('/api/problem/create')
        .then(()=>{
          this.loading = false;
        })
        .catch(err => {
          switch (err.response.status) {
            case 401:
              this.$store.commit(LOG_OUT);
              this.$router.replace({
                path: '/login',
                query: {
                  next: '/problems/create'
                }
              });
              break;
            case 403:
              this.error = 'Access Denied';
              break;
            default:
              this.error = `${err.response.status} ${err.response.statusText}`;
          }
        });
    }
  };
</script>

<style>

  .normalEditor .ql-container,
  .normalEditor .ql-editor{
    min-height: 30em;
    max-height: 30em;
  }

  .fullScreenEditor{
    min-height: 100vh;
    overflow: auto;
  }

  .ql-container, .ql-editor {
    padding-bottom: 1em;
  }
</style>