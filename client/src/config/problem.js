
export default {
  create: {
    options: {
      sampleInput: `3
1 3
5 6
2 0`,
      sampleOutput: `Case 1: 4
Case 2: 11
Case 3: 2`,
      difficulties: [
        { text: 'Select difficulty', value: '' },
        { text: 'Easy', value: 'easy' },
        { text: 'Medium', value: 'medium' },
        { text: 'Hard', value: 'hard' }
      ],
      categories: [
        { text: 'Select category', value: '' },
        { text: 'Beginner', value: 'beginner' },
        { text: 'Math', value: 'math' },
        { text: 'Matrix', value: 'matrix' },
        { text: 'Data Structures', value: 'ds' },
        { text: 'Divide and Conquer', value: 'dac' },
        { text: 'Flow/Matching', value: 'fom' },
        { text: 'Game Theory', value: 'game' },
        { text: 'Graph Theory', value: 'graph' },
        { text: 'String', value: 'string' },
        { text: 'Searching', value: 'searching' },
        { text: 'Geometry', value: 'geometry' }
      ],
      tags: [
        {
          text: 'Beginner',
          value: 'beginner'
        },
        {
          text: 'Add-hoc',
          value: 'addhoc'
        },
        {
          text: 'DP',
          value: 'dp'
        },
        {
          text: 'Implementation',
          value: 'imp'
        },
        {
          text: 'Divide and Conquer',
          value: 'dac'
        },
        {
          text: 'Flow/Matching',
          value: 'fom'
        },
        {
          text: 'Geometry',
          value: 'geometry'
        },
        {
          text: 'Graph Theory',
          value: 'graph'
        },
        {
          text: 'Number Theory',
          value: 'number'
        },
        {
          text: 'String',
          value: 'string'
        },
        {
          text: 'Searching',
          value: 'searching'
        },
        {
          text: 'Game Theory',
          value: 'game'
        },
        {
          text: 'Matrix',
          value: 'matrix'
        },
        {
          text: 'Greedy',
          value: 'greedy'
        },
        {
          text: 'Brute Force',
          value: 'bf'
        },
        {
          text: 'DFS/BFS',
          value: 'dfsbfs'
        },
        {
          text: 'Combinatorics',
          value: 'comb'
        },
        {
          text: 'Trees',
          value: 'trees'
        },
        {
          text: 'Bitmasks',
          value: 'bitmasks'
        },
        {
          text: 'Probabilities',
          value: 'probabilities'
        }
      ]
    },
    default: `
      <p>This is an example problem description. Please put your problem description here with enough detail.</p><p><br></p><p><strong>INPUT</strong></p><p>This is a sample input detail. Please put your input detail here. For example, Input starts with an integer&nbsp;<strong>T</strong>, denoting the number of test cases.Each case contains two integers&nbsp;<strong>N</strong>&nbsp;denoting the number of elements of array A. The next line will contain n integers separated by spaces, denoting the elements of the array A.</p><p><br></p><p><strong>OUTPUT</strong></p><p>This is a sample output detail. Please put your output detail here. For example, For each case of input, output the index of the number for which the array is not sorted .If several solution exists then print the smallest one . Here indexes are 1 based.</p><p><br></p><p><strong>Constraints</strong></p><p>This is an example Constraints.If you already explain constraints then remove this section.</p><p><br></p><p><span class="ql-formula" data-value="0 < T < 100">﻿<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mn>0</mn><mo>&lt;</mo><mi>T</mi><mo>&lt;</mo><mn>1</mn><mn>0</mn><mn>0</mn></mrow><annotation encoding="application/x-tex">0 &lt; T &lt; 100</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="strut" style="height: 0.68333em;"></span><span class="strut bottom" style="height: 0.72243em; vertical-align: -0.0391em;"></span><span class="base textstyle uncramped"><span class="mord mathrm">0</span><span class="mrel">&lt;</span><span class="mord mathit" style="margin-right: 0.13889em;">T</span><span class="mrel">&lt;</span><span class="mord mathrm">1</span><span class="mord mathrm">0</span><span class="mord mathrm">0</span></span></span></span></span>﻿</span></p><p><span class="ql-formula" data-value="1 < N < 10^4">﻿<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mn>1</mn><mo>&lt;</mo><mi>N</mi><mo>&lt;</mo><mn>1</mn><msup><mn>0</mn><mn>4</mn></msup></mrow><annotation encoding="application/x-tex">1 &lt; N &lt; 10^4</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="strut" style="height: 0.814108em;"></span><span class="strut bottom" style="height: 0.853208em; vertical-align: -0.0391em;"></span><span class="base textstyle uncramped"><span class="mord mathrm">1</span><span class="mrel">&lt;</span><span class="mord mathit" style="margin-right: 0.10903em;">N</span><span class="mrel">&lt;</span><span class="mord mathrm">1</span><span class="mord"><span class="mord mathrm">0</span><span class="msupsub"><span class="vlist"><span class="" style="top: -0.363em; margin-right: 0.05em;"><span class="fontsize-ensurer reset-size5 size5"><span class="" style="font-size: 0em;">​</span></span><span class="reset-textstyle scriptstyle uncramped mtight"><span class="mord mathrm mtight">4</span></span></span><span class="baseline-fix"><span class="fontsize-ensurer reset-size5 size5"><span class="" style="font-size: 0em;">​</span></span>​</span></span></span></span></span></span></span></span>﻿</span></p><p><span class="ql-formula" data-value="1 < A[i] < 10^2 ( -1 < i < N )">﻿<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mn>1</mn><mo>&lt;</mo><mi>A</mi><mo>[</mo><mi>i</mi><mo>]</mo><mo>&lt;</mo><mn>1</mn><msup><mn>0</mn><mn>2</mn></msup><mo>(</mo><mo>−</mo><mn>1</mn><mo>&lt;</mo><mi>i</mi><mo>&lt;</mo><mi>N</mi><mo>)</mo></mrow><annotation encoding="application/x-tex">1 &lt; A[i] &lt; 10^2 ( -1 &lt; i &lt; N )</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="strut" style="height: 0.814108em;"></span><span class="strut bottom" style="height: 1.06411em; vertical-align: -0.25em;"></span><span class="base textstyle uncramped"><span class="mord mathrm">1</span><span class="mrel">&lt;</span><span class="mord mathit">A</span><span class="mopen">[</span><span class="mord mathit">i</span><span class="mclose">]</span><span class="mrel">&lt;</span><span class="mord mathrm">1</span><span class="mord"><span class="mord mathrm">0</span><span class="msupsub"><span class="vlist"><span class="" style="top: -0.363em; margin-right: 0.05em;"><span class="fontsize-ensurer reset-size5 size5"><span class="" style="font-size: 0em;">​</span></span><span class="reset-textstyle scriptstyle uncramped mtight"><span class="mord mathrm mtight">2</span></span></span><span class="baseline-fix"><span class="fontsize-ensurer reset-size5 size5"><span class="" style="font-size: 0em;">​</span></span>​</span></span></span></span><span class="mopen">(</span><span class="mord">−</span><span class="mord mathrm">1</span><span class="mrel">&lt;</span><span class="mord mathit">i</span><span class="mrel">&lt;</span><span class="mord mathit" style="margin-right: 0.10903em;">N</span><span class="mclose">)</span></span></span></span></span>﻿</span></p><p><br></p><p><strong>Explanation</strong></p><p>This is an example Explanation.If any explanation not needed,remove this section.</p>
    `
  }
};

