// In-memory stand-in for mongoose, used only by test/escrow.test.js. Not for production.
// Minimal in-memory Mongoose stand-in for controller tests.
const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o), (k, v) => (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) ? new Date(v) : v)));
const get = (o, k) => o[k];
const cmp = (a, b) => (a instanceof Date ? a.getTime() : a) - (b instanceof Date ? b.getTime() : b);
function matchValue(val, cond) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date) && Object.keys(cond).some((k) => k.startsWith('$'))) {
    return Object.entries(cond).every(([op, arg]) => {
      switch (op) {
        case '$in': return Array.isArray(val) ? val.some((v) => arg.includes(v)) : arg.includes(val ?? null);
        case '$nin': return Array.isArray(val) ? !val.some((v) => arg.includes(v)) : !arg.includes(val ?? null);
        case '$ne': return Array.isArray(val) ? !val.includes(arg) : (val ?? null) !== arg;
        case '$gte': return cmp(val, arg) >= 0;
        case '$gt': return cmp(val, arg) > 0;
        case '$lte': return cmp(val, arg) <= 0;
        default: throw new Error('op ' + op);
      }
    });
  }
  if (Array.isArray(val)) return val.includes(cond);
  return (val ?? null) === cond;
}
function matches(doc, filter = {}) {
  return Object.entries(filter).every(([k, c]) => (k === '$or' ? c.some((f) => matches(doc, f)) : matchValue(get(doc, k), c)));
}
class Schema {
  constructor(def, opts = {}) { this.def = def; this.opts = opts; this.indexes = []; }
  index() {}
}
Schema.Types = {};
const models = {};
function model(name, schema) {
  const store = [];
  const defaults = () => {
    const o = {};
    for (const [k, d] of Object.entries(schema.def)) {
      if (Array.isArray(d)) o[k] = [];
      else if (d && typeof d === 'object' && 'default' in d) o[k] = d.default;
    }
    return o;
  };
  const validate = (o) => {
    for (const [k, d] of Object.entries(schema.def)) {
      if (d && d.required && (o[k] === undefined || o[k] === null || o[k] === '')) { const e = new Error(`${k} required`); e.name = 'ValidationError'; e.errors = { [k]: { message: `${k} is required` } }; throw e; }
      if (d && d.enum && o[k] != null && !d.enum.includes(o[k])) { const e = new Error('enum'); e.name = 'ValidationError'; e.errors = { [k]: { message: `${k} invalid` } }; throw e; }
      if (d && d.unique) { if (store.some((s) => s !== o && s[k] === o[k])) { const e = new Error('dup'); e.code = 11000; throw e; } }
    }
  };
  const wrap = (raw) => {
    if (!raw) return null;
    const doc = clone(raw);
    Object.defineProperty(doc, 'save', { enumerable: false, value: async () => { validate({ ...doc }); Object.assign(raw, clone(doc), { updatedAt: new Date() }); return doc; } });
    return doc;
  };
  class Query {
    constructor(exec, many) { this.exec_ = exec; this.many = many; this._lean = false; this._sort = null; this._limit = null; }
    sort(s) { this._sort = s; return this; } lean() { this._lean = true; return this; } select() { return this; } limit(n) { this._limit = n; return this; }
    run() {
      let r = this.exec_();
      if (this.many) {
        r = [...r];
        if (this._sort) { const e = Object.entries(this._sort); r.sort((a, b) => { for (const [k, d] of e) { const c = cmp(a[k] ?? '', b[k] ?? ''); if (c) return c * d; } return 0; }); }
        if (this._limit) r = r.slice(0, this._limit);
        return r.map((x) => (this._lean ? clone(x) : wrap(x)));
      }
      return r ? (this._lean ? clone(r) : wrap(r)) : null;
    }
    then(a, b) { return Promise.resolve().then(() => this.run()).then(a, b); }
  }
  const applyUpdate = (doc, update, inserting) => {
    for (const [op, fields] of Object.entries(update)) {
      for (const [k, v] of Object.entries(fields)) {
        if (op === '$set') doc[k] = v;
        else if (op === '$inc') doc[k] = (doc[k] || 0) + v;
        else if (op === '$addToSet') { doc[k] = doc[k] || []; if (!doc[k].includes(v)) doc[k].push(v); }
        else if (op === '$setOnInsert') { if (inserting) doc[k] = v; }
        else throw new Error('update op ' + op);
      }
    }
    doc.updatedAt = new Date();
  };
  const M = {
    _store: store,
    create: async (o) => { if (Array.isArray(o)) return Promise.all(o.map(M.create)); const d = { ...defaults(), ...clone(o), createdAt: new Date(), updatedAt: new Date() }; await new Promise((r) => setTimeout(r, 1)); validate(d); store.push(d); return wrap(d); },
    insertMany: async (arr) => Promise.all(arr.map(M.create)),
    find: (f) => new Query(() => store.filter((d) => matches(d, f)), true),
    findOne: (f) => new Query(() => store.find((d) => matches(d, f)), false),
    exists: async (f) => (store.some((d) => matches(d, f)) ? { _id: 1 } : null),
    countDocuments: async (f) => store.filter((d) => matches(d, f || {})).length,
    findOneAndUpdate: (f, u, o = {}) => new Query(() => {
      let d = store.find((x) => matches(x, f));
      if (!d) {
        if (!o.upsert) return null;
        d = { ...defaults(), createdAt: new Date() };
        for (const [k, v] of Object.entries(f)) if (typeof v !== 'object' || v === null) d[k] = v;
        applyUpdate(d, u, true); store.push(d); return d;
      }
      const before = clone(d); applyUpdate(d, u, false);
      return o.new ? d : before;
    }, false),
    findOneAndDelete: (f) => new Query(() => { const i = store.findIndex((d) => matches(d, f)); return i < 0 ? null : store.splice(i, 1)[0]; }, false),
    updateOne: async (f, u) => { const d = store.find((x) => matches(x, f)); if (d) applyUpdate(d, u.$set || u.$inc || u.$addToSet ? u : { $set: u }, false); return { modifiedCount: d ? 1 : 0 }; },
    updateMany: async (f, u) => { store.filter((x) => matches(x, f)).forEach((d) => applyUpdate(d, u, false)); },
    deleteOne: async (f) => { const i = store.findIndex((d) => matches(d, f)); if (i >= 0) store.splice(i, 1); },
    deleteMany: async (f) => { for (let i = store.length - 1; i >= 0; i--) if (matches(store[i], f)) store.splice(i, 1); },
    aggregate: async (pipe) => { const m = store.filter((d) => matches(d, pipe[0].$match)); const f = pipe[1].$group.total.$sum.slice(1); return m.length ? [{ total: m.reduce((s, d) => s + (d[f] || 0), 0) }] : []; },
  };
  models[name] = M;
  return M;
}
module.exports = { Schema, model, models, connect: async () => {}, connection: { readyState: 1, name: 'test' } };
