const categories = {
  blending: ["cat", "dog", "giraffe"], /* add more but idk we might needa find some way to get a database*/
  hatching: ["table", "ball", "apple"],
  stippling: ["beach", "castle", "school"],
}


function prompt(category) {
  if (categories[category]) {
    const words = categories[category];
    return words[Math.floor(Math.random() * words.length)];
  }
  return null; 
}


module.exports = { prompt };
// export { prompt };
