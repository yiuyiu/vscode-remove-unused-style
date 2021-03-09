# removeUnusedStyle README
This is a VS code extension to remove unused style in react-native
## Usage

type `CMD+P`(or `CTRL+P` in windows) and enter `remove unused style`, then save the file.

![Usage animation](images/example.gif)

## how it works
1. it uses [@babel/parser](https://babeljs.io/docs/en/next/babel-parser.html) to parse the code
2. say `const styles = Stylesheet.create(obj)`. it will search `styles.` plus all keys in `obj`. 
3. then apply deletion according to the line number parsed by [@babel/parser](https://babeljs.io/docs/en/next/babel-parser.html).



