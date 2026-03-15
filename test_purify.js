const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><div></div>`);
const DOMPurify = require("dompurify")(dom.window);

const string1 = '<img src="data:image/png;base64,1234" style="width: 300px; cursor: pointer" height="400" width="300" />';
console.log(DOMPurify.sanitize(string1, { ADD_ATTR: ['style'] }));
