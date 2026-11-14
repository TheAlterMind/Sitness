import pxtorem from 'postcss-pxtorem'

// Every pixel size in our CSS and in Ant Design Mobile's becomes rem, so the whole interface
// scales with the root font size that src/scale.ts sets from the size of the window.
// Hairlines (1px and thinner) stay crisp pixels; media queries keep real viewport pixels.
export default {
  plugins: [
    pxtorem({
      rootValue: 16,
      unitPrecision: 5,
      propList: ['*'],
      minPixelValue: 1.01,
      mediaQuery: false,
    }),
  ],
}
