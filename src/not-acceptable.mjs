function notAcceptable() {
  return this.status(406).send('Not Acceptable');
}

export default notAcceptable;
