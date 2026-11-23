(function() {
  if (window.__WL_GUARD_EARLY__) return;
  window.__WL_GUARD_EARLY__ = 1;
  var DANGER = `(?:alert\\s*\\(|eval\\s*\\(|prompt\\s*\\(|confirm\\s*\\(|execScript\\s*\\(|Function\\s*\\(|document\\s*\\.\\s*(?:cookie|write)|window\\s*\\.\\s*location\\s*=|location\\s*=\\s*["']|<\\s*script|javascript\\s*:|vbscript\\s*:)`;
  var SAFE_CALL = "\\b(?:TPL|DETAIL|VC|FORM|ACT|PAGE|E|this|event)\\s*\\.|\\bwindow\\s*\\.\\s*TPL\\s*\\.|\\breturn\\b";
  var RISK = new RegExp(
    '<\\s*(?:script|iframe|object|embed|foreignobject|base|meta|link)\\b|javascript\\s*:|vbscript\\s*:|data\\s*:\\s*text\\s*\\/\\s*html|expression\\s*\\(|<\\s*svg[^>]*\\son[a-z]+\\s*=|\\bon[a-z]+\\s*=\\s*"[^"]*' + DANGER + `[^"]*"|\\bon[a-z]+\\s*=\\s*'[^']*` + DANGER + `[^']*'|\\bon[a-z]+\\s*=\\s*"(?![^"]*(?:` + SAFE_CALL + `))[^"]*"|\\bon[a-z]+\\s*=\\s*'(?![^']*(?:` + SAFE_CALL + "))[^']*'",
    "i"
  );
  var BAD_ON = /\b(?:alert\s*\(|eval\s*\(|prompt\s*\(|confirm\s*\(|execScript\s*\(|Function\s*\(|document\s*\.\s*(?:cookie|write)|window\s*\.\s*location\s*=|location\s*=\s*["']|<\s*script|javascript\s*:|vbscript\s*:)/i;
  var GOOD_ON = /\b(?:TPL\s*\.|DETAIL\s*\.|VC\s*\.|FORM\s*\.|ACT\s*\.|PAGE\s*\.|E\s*\.|window\s*\.\s*TPL|this\s*\.|event\s*\.|return\b)/;
  function safeOn(m) {
    return !BAD_ON.test(m) && GOOD_ON.test(m);
  }
  function harden(input) {
    if (typeof input !== "string") return { html: input, hit: false, reasons: [] };
    if (!RISK.test(input)) return { html: input, hit: false, reasons: [] };
    var reasons = [], out = input;
    out = out.replace(/<\s*(script|iframe|object|embed|foreignobject|base|meta|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, function(m) {
      reasons.push("block " + m.slice(0, 36));
      return "";
    });
    out = out.replace(/<\s*(?:script|iframe|object|embed|foreignobject|base|meta|link)\b[^>]*\/?>/gi, function(m) {
      reasons.push("tag " + m.slice(0, 36));
      return "";
    });
    out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, function(m) {
      if (safeOn(m)) return m;
      reasons.push("onattr " + m.slice(0, 44));
      return "";
    });
    out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, function(m) {
      if (safeOn(m)) return m;
      reasons.push("onattr " + m.slice(0, 44));
      return "";
    });
    out = out.replace(/\s(?:href|src|action|formaction|xlink:href)\s*=\s*(["'])\s*(?:javascript|vbscript|data\s*:\s*text\s*\/\s*html)\s*:[^"']*\1/gi, function(m) {
      reasons.push("protocol");
      return "";
    });
    out = out.replace(/\sstyle\s*=\s*(["'])[^"']*expression\([^"']*\1/gi, function(m) {
      reasons.push("expression");
      return "";
    });
    return { html: out, hit: true, reasons };
  }
  window.__WL_GUARD__ = {
    batch: "1",
    install: "early",
    writes: 0,
    blocks: [],
    audits: [],
    coverage: ["innerHTML", "outerHTML", "insertAdjacentHTML"],
    escapeLayer: "escJS（内联事件 JS 字符串参数） / escA（HTML 属性、id、data-*） / esc（文本）"
  };
  function report(kind, r) {
    var G = window.__WL_GUARD__;
    G.blocks.push({ at: Date.now(), kind, reasons: r.reasons.slice(0, 8) });
    if (G.blocks.length > 120) G.blocks.shift();
  }
  function guard(kind, v) {
    var G = window.__WL_GUARD__;
    if (G) G.writes++;
    var r = harden(v);
    if (r.hit) report(kind, r);
    return r.html;
  }
  var P = window.Element && window.Element.prototype || null;
  if (P) {
    var dI = Object.getOwnPropertyDescriptor(P, "innerHTML");
    if (dI && dI.set && dI.configurable) {
      Object.defineProperty(P, "innerHTML", {
        configurable: true,
        enumerable: dI.enumerable,
        get: dI.get,
        set: function(v) {
          return dI.set.call(this, guard("innerHTML", v));
        }
      });
    }
    var dO = Object.getOwnPropertyDescriptor(P, "outerHTML");
    if (dO && dO.set && dO.configurable) {
      Object.defineProperty(P, "outerHTML", {
        configurable: true,
        enumerable: dO.enumerable,
        get: dO.get,
        set: function(v) {
          return dO.set.call(this, guard("outerHTML", v));
        }
      });
    }
    var IAH = P.insertAdjacentHTML;
    if (typeof IAH === "function") {
      P.insertAdjacentHTML = function(pos, v) {
        return IAH.call(this, pos, guard("insertAdjacentHTML", v));
      };
    }
  }
  window.GUARD = {
    harden: function(v) {
      return harden(v);
    },
    text: function(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    attr: function(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\r/g, "&#13;").replace(/\n/g, "&#10;");
    },
    js: function(v) {
      var t = String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
      return "'" + t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "'";
    },
    svg: function(v) {
      return harden(String(v == null ? "" : v)).html;
    }
  };
})();
(function() {
  if (window.__WL_B2_EARLY__) return;
  window.__WL_B2_EARLY__ = 1;
  var TC = window.Node && Object.getOwnPropertyDescriptor(Node.prototype, "textContent") || null;
  if (TC && TC.set && TC.configurable) {
    Object.defineProperty(Node.prototype, "textContent", {
      configurable: true,
      enumerable: TC.enumerable,
      get: TC.get,
      set: function(v) {
        var nv = v == null ? "" : String(v);
        try {
          var plain = this.nodeType === 3 || this.nodeType === 1 && this.childNodes.length === 1 && this.firstChild.nodeType === 3;
          if (plain && this.textContent === nv) {
            if (window.__WL_REDRAW__) window.__WL_REDRAW__.shortCircuits++;
            return;
          }
        } catch (e) {
        }
        return TC.set.call(this, v);
      }
    });
  }
  function wrap(proto, name) {
    if (!proto || typeof proto[name] !== "function") return;
    var orig = proto[name];
    proto[name] = function() {
      try {
        var g = window.__WL_B2_GATE__;
        if (g && g(this, name)) return;
      } catch (e) {
      }
      return orig.apply(this, arguments);
    };
  }
  wrap(window.HTMLElement && HTMLElement.prototype, "focus");
  wrap(window.HTMLInputElement && HTMLInputElement.prototype, "select");
  wrap(window.HTMLTextAreaElement && HTMLTextAreaElement.prototype, "select");
})();
