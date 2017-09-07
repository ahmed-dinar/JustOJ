# JustOJ

<a href="https://www.codacy.com/app/ahmed-dinar/JustOJ/dashboard"><img src="https://img.shields.io/codacy/grade/8515c14218ec49c384b276fba758f983.svg?style=flat-square&label=codacy" alt="code quality"></a>

## Work in progress

#### Language Support

- [x] C
- [x] C++
- [x] JAVA 8
- [x] C++11
- [x] C++14
- [ ] Python2 & Python3


#### Executor Usage
```javascript
$ ./safec <executable file> [options]
```

```javascript
$ ./safejava <executable file> [options]
```
##### options
```javascript
  -t <cpu limit> (in milliseconds, max: 15s)
  -m <memory limit> (in MB, max: 512 MB)
  -i <stdin test case file>
  -o <stdout file>
  -e <stderr file>
  -r <result file>
  -s <java security policy file path> (for safejava)
  -c <chroot directory>
  -d <code run directory inside chroot>
```

##### Future Works

- [ ] Integrate [MOSS](https://theory.stanford.edu/~aiken/moss/) like tool for Detecting Plagiarism.
- [ ] Different language for different problem
- [ ] Score based standings
- [ ] User rating
- [ ] Multiple Modearator for contest
- [ ] More language support
