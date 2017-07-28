<template>
  <div>
    <h1 v-if="loading || error">{{ error }}</h1>
    <div v-else>


      <div class="col-md-12">

        <div class="row mb-3">
          <div class="form-bundle">
            <label for="problemTitle">Title</label>
            <input type="text" class="form-control" id="problemTitle" placeholder="Problem Title" v-model="title">
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-4 p-0 pr-2">
            <div class="form-bundle">
              <label for="problemAuthor">Author</label>
              <input type="text" class="form-control" id="problemAuthor" placeholder="Author name" v-model="author">
            </div>
          </div>
          <div class="col-md-4 p-0 pr-2">
            <div class="form-bundle">
              <label for="problemScore">Score</label>
              <input type="text" class="form-control" id="problemScore" placeholder="score" v-model="score">
            </div>
          </div>
          <div class="col-md-4 p-0">
            <div class="form-bundle">
              <label for="problemDifficulty">Difficulty</label>
              <b-form-select v-model="difficulty" id="problemDifficulty" :options="difficulties"></b-form-select>
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
              <b-form-select
              id="problemCategory"
              v-model="category"
              :options="categories"
              ></b-form-select>
            </div>
          </div>
        </div>

        <div class="row mb-3">
          <div class="form-bundle">
            <label for="problemContentEditor">Problem Statement</label>
            <quill-editor
              id="problemContentEditor"
              ref="problemEditor"
              v-model="content"
              :options="editorOption"
              @blur="onEditorBlur($event)"
              @focus="onEditorFocus($event)"
              @ready="onEditorReady($event)"
            >
            </quill-editor>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script>

  import { LOG_OUT } from '@/store/mutation-types';
  import Multiselect from 'vue-multiselect';
  import problem from '@/config/problem';

  export default {
    name: 'CreateProblems',

    components: { Multiselect },


    data () {
      return {
        content: problem.create.default,
        title: null,
        author: null,
        score: null,
        tags: null,
        category: 'def',
        difficulty: 'def',
        tagList: problem.create.options.tags,
        difficulties: problem.create.options.difficulties,
        categories: problem.create.options.categories,
        editorOption: {
          modules: {
            formula: true,
            toolbar: {
              container: [
                ['bold','code','italic','underline','blockquote'],
                [{'align': [] },{'indent': '-1'}, {'indent': '+1'},{'list': 'ordered'}, {'list': 'bullet'}],
                [{'header': []}],
                ['image','video','link'],
                ['formula']
              ],
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
        loading: true,
        error: ''
      };
    },

    computed: {
    },

    mounted(){

    },

    methods: {
      onEditorBlur(editor) {
       // console.log('editor blur!', editor);
        //console.log(this.content);
      },
      onEditorFocus(editor) {
        // console.log('editor focus!', editor);
      },
      onEditorReady(editor) {
        console.log('editor ready!', editor);
      }
    },

    created(){

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
  .ql-container, .ql-editor {
    min-height: 28em;
    padding-bottom: 1em;
    max-height: 25em;
  }
</style>