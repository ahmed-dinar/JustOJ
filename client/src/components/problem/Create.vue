<template>
  <div>
    <h1 v-if="loading || error">{{ error }}</h1>
    <div v-else>

      <quill-editor
        ref="problemEditor"
        v-model="content"
        :options="editorOption"
        @blur="onEditorBlur($event)"
        @focus="onEditorFocus($event)"
        @ready="onEditorReady($event)"
      >
      </quill-editor>
      <!-- <div v-html="content"></div> -->

    </div>
  </div>
</template>

<script>

  export default {
    name: 'CreateProblems',

    data () {
      return {
        content: '',
        editorOption: {
          modules: {
            toolbar: {
              container: [
                ['bold','code','italic','underline','blockquote'],
                [{'align': [] },{'indent': '-1'}, {'indent': '+1'},{'list': 'ordered'}, {'list': 'bullet'}],
                [{'header': []}],
                ['image','video','link']
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
    min-height: 20em;
    padding-bottom: 1em;
    max-height: 25em;
  }
</style>