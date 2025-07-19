export default class Delta {
  constructor(ops = []) {
    this.ops = Array.isArray(ops) ? ops : (ops?.ops ?? []);
  }
}
