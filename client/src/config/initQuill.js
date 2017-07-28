
if( window.Quill ){
  var icons = Quill.import('ui/icons');
  icons['bold'] = '<i class="material-icons">format_bold</i>';
  icons['image'] = '<i class="material-icons">image</i>';
  icons['code'] = '<i class="material-icons">code</i>';
  icons['italic'] = '<i class="material-icons">format_italic</i>';
  icons['underline'] = '<i class="material-icons">format_underlined</i>';
  icons['blockquote'] = '<i class="material-icons">format_quote</i>';
  icons['indent']['-1'] = '<i class="material-icons">format_indent_decrease</i>';
  icons['indent']['+1'] = '<i class="material-icons">format_indent_increase</i>';
  icons['list']['ordered'] = '<i class="material-icons">format_list_numbered</i>';
  icons['list']['bullet'] = '<i class="material-icons">format_list_bulleted</i>';
  icons['align'][''] = '<i class="material-icons">format_align_left</i>';
  icons['align']['center'] = '<i class="material-icons">format_align_center</i>';
  icons['align']['right'] = '<i class="material-icons">format_align_right</i>';
  icons['align']['justify'] = '<i class="material-icons">format_align_justify</i>';
  icons['video'] = '<i class="material-icons">video_library</i>';
  icons['link'] = '<i class="material-icons">insert_link</i>';
}