import buildAttributes from './build-attributes';

const createTag = (attributes, content, singleLine = false) => {
  const tag = `
  <turbo-stream ${buildAttributes(attributes)}>
    <template>
      ${content}
    </template>
  </turbo-stream>
`;
  return singleLine ? tag.replace(/\n/g, '') : tag;
};

export default createTag;
