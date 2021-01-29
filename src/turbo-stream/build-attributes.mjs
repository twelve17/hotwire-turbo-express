import escape from 'escape-html';

const buildAttributes = (attributes) => Object.keys(attributes || {})
  .map((name) => [name, `"${escape(attributes[name])}"`].join('='))
  .join(' ');

export default buildAttributes;
