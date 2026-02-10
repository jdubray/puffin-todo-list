/**
 * Minimal browser-based test runner.
 * Zero dependencies — runs in any modern browser.
 */

const testRunner = {
  /** @type {Array<{name: string, fn: Function}>} */
  tests: [],
  /** @type {Array<{name: string, passed: boolean, error: string|null}>} */
  results: [],

  /**
   * Registers a test.
   * @param {string} name - Test description
   * @param {Function} fn - Test function (may be async)
   */
  test(name, fn) {
    this.tests.push({ name, fn });
  },

  /**
   * Runs all registered tests and reports results.
   * @returns {Promise<{passed: number, failed: number, total: number}>}
   */
  async run() {
    this.results = [];
    const output = document.getElementById('test-output');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.results.push({ name, passed: true, error: null });
      } catch (e) {
        this.results.push({ name, passed: false, error: e.message });
      }
    }

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    // Render results to DOM
    let html = '<h2>' + passed + '/' + total + ' tests passed</h2>';

    if (failed > 0) {
      html += '<h3 class="fail">Failed Tests:</h3>';
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          html += '<div class="result fail">';
          html += '<span class="icon">&#10007;</span> ';
          html += '<strong>' + escapeHtml(r.name) + '</strong>';
          html += '<pre>' + escapeHtml(r.error) + '</pre>';
          html += '</div>';
        });
    }

    html += '<h3>All Results:</h3>';
    this.results.forEach((r) => {
      const cls = r.passed ? 'pass' : 'fail';
      const icon = r.passed ? '&#10003;' : '&#10007;';
      html += '<div class="result ' + cls + '">';
      html += '<span class="icon">' + icon + '</span> ';
      html += escapeHtml(r.name);
      if (r.error) {
        html += '<pre>' + escapeHtml(r.error) + '</pre>';
      }
      html += '</div>';
    });

    if (output) output.innerHTML = html;

    // Also log to console for CLI/CI access
    console.log('\n=== Test Results: ' + passed + '/' + total + ' passed ===');
    this.results.forEach((r) => {
      if (r.passed) {
        console.log('  PASS: ' + r.name);
      } else {
        console.error('  FAIL: ' + r.name + ' — ' + r.error);
      }
    });

    return { passed, failed, total };
  }
};

/**
 * Escapes HTML special characters for safe display.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Assertion helpers.
 */
const assert = {
  equal(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(
        (msg || 'Assertion failed') +
          ': expected ' + JSON.stringify(expected) +
          ', got ' + JSON.stringify(actual)
      );
    }
  },

  deepEqual(actual, expected, msg) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        (msg || 'Deep equal failed') +
          ': expected ' + JSON.stringify(expected) +
          ', got ' + JSON.stringify(actual)
      );
    }
  },

  ok(value, msg) {
    if (!value) {
      throw new Error(msg || 'Expected truthy value, got ' + JSON.stringify(value));
    }
  },

  notOk(value, msg) {
    if (value) {
      throw new Error(msg || 'Expected falsy value, got ' + JSON.stringify(value));
    }
  },

  throws(fn, msg) {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(msg || 'Expected function to throw');
    }
  }
};

/**
 * Resets model state and localStorage for test isolation.
 */
function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FILTER_KEY);
  model.state = { todos: [], currentFilter: 'all' };
}
