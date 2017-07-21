

export default function(){
  return {
    'particles': {
      'number': {
        'value': 170,
        'density': {
          'enable': true,
          'value_area': 1200
        }
      },
      'color': {
        'value': ['#aa73ff', '#f8c210', '#83d238', '#33b1f8']
      },
      'shape': {
        'type': 'circle',
        'stroke': {
          'width': 0,
          'color': '#fff'
        },
        'polygon': {
          'nb_sides': 5
        }
      },
      'opacity': {
        'value': 1,
        'random': false,
        'anim': {
          'enable': false,
          'speed': 0.5,
          'opacity_min': 0.1,
          'sync': false
        }
      },
      'size': {
        'value': 3,
        'random': true,
        'anim': {
          'enable': false,
          'speed': 20,
          'size_min': 0.3,
          'sync': false
        }
      },
      'line_linked': {
        'enable': true,
        'distance': 120,
        'color': '#919191',
        'opacity': 0.4,
        'width': 1
      },
      'move': {
        'enable': true,
        'speed': 2,
        'direction': 'none',
        'random': false,
        'straight': false,
        'out_mode': 'out',
        'bounce': false,
        'attract': {
          'enable': false,
          'rotateX': 600,
          'rotateY': 1200
        }
      }
    },
    'interactivity': {
      'detect_on': 'canvas',
      'events': {
        'onhover': {
          'enable': false
        },
        'onclick': {
          'enable': false
        },
        'resize': true
      },
      'modes': {
        'bubble': {
          'distance': 400,
          'size': 40,
          'duration': 2,
          'opacity': 8,
          'speed': 1
        },
        'repulse': {
          'distance': 200,
          'duration': 0.4
        },
        'push': {
          'particles_nb': 4
        },
        'remove': {
          'particles_nb': 2
        }
      }
    },
    'retina_detect': true
  };
};