'use strict';
// Language comes from the ?lang= query (set after the ready handshake); English is the source text.
(() => {
  const asked = new URLSearchParams(location.search).get('lang') || 'en';
  const lang = /^[a-z]{2}$/.test(asked) ? asked : 'en';
  const dict = (window.VantaLocales || {})[lang];

  window.VantaLang = lang;
  window.t = (text, ...args) => {
    let out = (dict && dict[text]) || text;
    args.forEach((arg, i) => { out = out.replace('{' + i + '}', arg); });
    return out;
  };
  document.documentElement.lang = lang;

  // Markup is written in English; translate a subtree once after it is built.
  const attrs = ['aria-label', 'title', 'placeholder', 'alt', 'data-tip'];
  const swap = (value) => { const key = value.trim(); return dict[key] ? value.replace(key, dict[key]) : value; };
  window.tDom = (root) => {
    if (!dict) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue.trim()) node.nodeValue = swap(node.nodeValue);
    }
    const sel = attrs.map((name) => '[' + name + ']').join(',');
    const els = [...root.querySelectorAll(sel)];
    if (root.matches && root.matches(sel)) els.push(root);
    els.forEach((el) => attrs.forEach((name) => { if (el.hasAttribute(name)) el.setAttribute(name, swap(el.getAttribute(name))); }));
  };
  if (dict) document.title = swap(document.title);
  window.tDom(document.body);
})();
