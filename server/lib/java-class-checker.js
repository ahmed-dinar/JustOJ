'use strict';

function ClassChecker (code) {
  return code.match(/[^{}]*public\s+class\s+(\w+).*/);
}

module.exports = ClassChecker;