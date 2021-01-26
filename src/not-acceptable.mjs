export function notAcceptable() {
  this.status(406).send('Not Acceptable');
}
