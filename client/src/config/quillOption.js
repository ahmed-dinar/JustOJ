import swal from 'sweetalert2';

export default function() {
  return {
    modules: {
      toolbar: {
        container: '#toolbar',
        handlers: {
          'image': function(value) {
            if (value) {
              var range = this.quill.getSelection();
              swal({
                text: 'Enter image url',
                input: 'text',
                padding: 10,
                showCancelButton: true
              }).then((href) => {
                this.quill.insertEmbed(range.index, 'image', href, Quill.sources.USER);
              });
            }
          }
        }
      }
    }
  };
}