
export default {
  create: {
    options: {
      difficulties: [
        { text: 'Select difficulty', value: 'def' },
        { text: 'Easy', value: 'easy' },
        { text: 'Medium', value: 'medium' },
        { text: 'Hard', value: 'hard' }
      ],
      categories: [
        { text: 'Select category', value: 'def' },
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
      <p>This is an example problem description. Please put your problem description here with enough detail.</p>
      <p><br></p>
      <p><strong>INPUT</strong></p>
      <p>This is a sample input detail. Please put your input detail here. For example, Input starts with an integer&nbsp;<strong>T</strong>, denoting the number of test cases.Each case contains two integers&nbsp;<strong>N</strong>&nbsp;denoting the number of elements of array A. The next line will contain n integers separated by spaces, denoting the elements of the array A.</p>
      <p><br></p>
      <p><strong>OUTPUT</strong></p>
      <p>This is a sample output detail. Please put your output detail here. For example, For each case of input, output the index of the number for which the array is not sorted .If several solution exists then print the smallest one . Here indexes are 1 based.</p>
      <p><br></p>
      <p><strong>Constraints</strong></p>
      <p>This is an example Constraints.If you already explain constraints then remove this section.</p>
      <p>0 &lt; T &lt; 101</p><p>1 &lt; N&lt;10^4</p>
      <p>1 &lt; A[i] &lt;10^2 ( -1 &lt; i &lt; N )</p>
      <p><br></p>
      <p><strong>Explanation</strong></p>
      <p>This is an example Explanation.If any explanation not needed,remove this section.</p>
    `
  }
};