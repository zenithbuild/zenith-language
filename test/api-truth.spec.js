/**
 * API truth gates for the Zenith VS Code language extension.
 *
 * Scope (context-aware, NOT repo-wide):
 *   - Snippet bodies, prefixes, and descriptions
 *   - README markdown (excluding fenced "forbidden" / "invalid" / "legacy" examples)
 *   - Manual verification docs
 *
 * Purpose:
 *   - Prove editor-facing surfaces only teach the current canonical Zenith API
 *     (signal().get() / signal().set(), state x = 0, on:event={handler}, etc.).
 *   - Block re-introduction of stale framework idioms (Vue .value, React hooks,
 *     Solid createSignal, Svelte $:, Svelte {#if}, vanilla onclick=, etc.).
 *
 * Source-of-truth audit:
 *   - signal: framework/packages/runtime/src/signal.ts (.get()/.set(), no .value)
 *   - state:  framework/docs/documentation/reactivity/reactivity-model.md
 *             framework/packages/runtime/src/state.ts (state({...}) object store)
 *   - events: framework/docs/documentation/syntax/events.md (on:click={handler})
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const SNIPPETS_PATH = path.join(ROOT, 'snippets', 'zenith.code-snippets');
const README_PATH = path.join(ROOT, 'README.md');
const NEOVIM_DOC_PATH = path.join(ROOT, 'docs', 'manual-neovim-verification.md');

// Stale patterns forbidden in public editor-facing surfaces.
// Each pattern is paired with a label describing why it is stale.
const STALE_PATTERNS = [
  {
    label: 'Vue-style signal/ref `.value` access',
    regex: /\.value\b/
  },
  {
    label: 'React-style `useState(` hook',
    regex: /\buseState\s*\(/
  },
  {
    label: 'React namespace reference',
    regex: /\bReact\./
  },
  {
    label: 'Solid-style `createSignal(`',
    regex: /\bcreateSignal\s*\(/
  },
  {
    label: 'Vue-style reactive `computed(`',
    regex: /\bcomputed\s*\(/
  },
  {
    label: 'Vue-style reactive `watch(`',
    regex: /\bwatch\s*\(/
  },
  {
    label: 'Svelte-style `$:` reactive statement',
    regex: /(^|\s)\$:\s/
  },
  {
    label: 'Svelte-style `{#if` / `{#each` / `{:else}` template blocks',
    regex: /\{(#if|#each|:else|\/if|\/each)\b/
  },
  {
    label: 'HTML `onclick=` inline handler (use `on:click={handler}`)',
    regex: /\bonclick\s*=/
  },
  {
    label: 'React-style `onClick=` handler (use `on:click={handler}`)',
    regex: /\bonClick\s*=/
  },
  {
    label: 'Vue-style `@click=` handler (use `on:click={handler}`)',
    regex: /@click\s*=/
  },
  {
    label: 'Legacy `zenOnMount` name (use canonical `zenMount`)',
    regex: /\bzenOnMount\b/
  },
  {
    label: 'React `children:` prop (Zenith uses `<slot />`)',
    regex: /\bchildren\s*:/
  },
  {
    label: 'React `ReactNode` type',
    regex: /\bReactNode\b/
  },
  {
    label: 'React `PropsWithChildren` helper',
    regex: /\bPropsWithChildren\b/
  },
  {
    label: 'React-style `className=` attribute (canonical is `class=`)',
    regex: /\bclassName\s*=/
  },
  {
    label: 'Legacy router hook `useRoute(`',
    regex: /\buseRoute\s*\(/
  },
  {
    label: 'Legacy router hook `useRouter(`',
    regex: /\buseRouter\s*\(/
  },
  {
    label: 'Stale router function `prefetch(`',
    regex: /\bprefetch\s*\(/
  },
  {
    label: 'Legacy router module id `zenith/router`',
    regex: /['"]zenith\/router['"]/
  }
];

// Stale patterns to flag in README/docs, but only inside fenced code blocks.
// Block-level scanning lets us tolerate prose like "do not use .value".
function extractFencedExamples(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let inFence = false;
  let fenceInfo = '';
  let buffer = [];
  let blockStartLine = 0;

  lines.forEach((line, idx) => {
    const fenceMatch = /^```(.*)$/.exec(line);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceInfo = fenceMatch[1].trim().toLowerCase();
        buffer = [];
        blockStartLine = idx + 1;
      } else {
        blocks.push({
          info: fenceInfo,
          startLine: blockStartLine,
          body: buffer.join('\n')
        });
        inFence = false;
      }
      return;
    }
    if (inFence) {
      buffer.push(line);
    }
  });

  return blocks;
}

function isExplicitlyLegacyBlock(info) {
  // Allow blocks tagged as legacy/invalid/forbidden/wrong/bad to demonstrate stale syntax.
  return /(legacy|invalid|forbidden|wrong|bad|do-?not|never)/i.test(info);
}

function assertNoStalePatterns(label, text) {
  for (const { label: patternLabel, regex } of STALE_PATTERNS) {
    const match = regex.exec(text);
    if (match) {
      throw new assert.AssertionError({
        message: `${label} contains stale pattern (${patternLabel}). Offending match: ${JSON.stringify(match[0])}`,
        actual: match[0],
        expected: 'no stale pattern',
        operator: 'no-stale-pattern'
      });
    }
  }
}

test('snippet bodies and descriptions only teach canonical Zenith API', () => {
  const snippets = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf8'));
  for (const [name, entry] of Object.entries(snippets)) {
    const bodyText = Array.isArray(entry.body) ? entry.body.join('\n') : String(entry.body || '');
    const description = String(entry.description || '');
    const prefix = String(entry.prefix || '');
    const combined = `${prefix}\n${description}\n${bodyText}`;
    assertNoStalePatterns(`snippet "${name}"`, combined);
  }
});

test('snippets expose canonical signal .get() / .set() API', () => {
  const snippets = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf8'));
  const serialized = JSON.stringify(snippets);
  assert.match(serialized, /\.get\(\)/, 'snippets must demonstrate signal.get()');
  assert.match(serialized, /\.set\(/, 'snippets must demonstrate signal.set(...)');
  assert.match(serialized, /signal\s*\(/, 'snippets must demonstrate signal( ... )');
});

test('snippets demonstrate canonical declarative `state x = ...` syntax', () => {
  const snippets = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf8'));
  const serialized = JSON.stringify(snippets);
  assert.match(
    serialized,
    /state\s+\$?\{?\d?:?\w+\}?\s*=/,
    'snippets must demonstrate declarative `state <name> = ...` form'
  );
});

test('snippets bind events with canonical `on:event={handler}` syntax', () => {
  const snippets = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf8'));
  const serialized = JSON.stringify(snippets);
  assert.match(serialized, /on:\w+\s*=\s*\{/, 'snippets must include on:event={handler}');
});

test('README canonical examples do not teach stale framework syntax', () => {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const blocks = extractFencedExamples(readme);

  for (const block of blocks) {
    if (isExplicitlyLegacyBlock(block.info)) {
      continue;
    }
    assertNoStalePatterns(
      `README fenced block starting at line ${block.startLine} (info="${block.info}")`,
      block.body
    );
  }
});

test('manual Neovim verification doc does not teach stale framework syntax', () => {
  if (!fs.existsSync(NEOVIM_DOC_PATH)) {
    return;
  }
  const doc = fs.readFileSync(NEOVIM_DOC_PATH, 'utf8');
  const blocks = extractFencedExamples(doc);

  for (const block of blocks) {
    if (isExplicitlyLegacyBlock(block.info)) {
      continue;
    }
    assertNoStalePatterns(
      `${path.basename(NEOVIM_DOC_PATH)} fenced block starting at line ${block.startLine} (info="${block.info}")`,
      block.body
    );
  }
});

test('grammar-test fixture authored examples use canonical Zenith API', () => {
  const fixturePath = path.join(ROOT, 'test', 'fixtures', 'grammar-test.zen');
  if (!fs.existsSync(fixturePath)) {
    return;
  }
  const fixture = fs.readFileSync(fixturePath, 'utf8');
  assertNoStalePatterns(`fixture ${path.basename(fixturePath)}`, fixture);
  assert.match(fixture, /on:click\s*=\s*\{/, 'fixture must use canonical on:click={handler}');
  assert.match(fixture, /\bstate\s+\w+\s*=/, 'fixture must use declarative `state name = ...`');
});

// ---------------------------------------------------------------------------
// Slot + router/ZenLink coverage in snippets
// ---------------------------------------------------------------------------

test('snippets teach the implicit `<slot />` and never invent a `children` prop', () => {
  const snippets = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf8'));
  const serialized = JSON.stringify(snippets);
  assert.match(serialized, /<slot/, 'snippets must demonstrate `<slot />`');
  assert.doesNotMatch(serialized, /\bchildren\s*:/, 'snippets must not declare `children:` props');
  assert.doesNotMatch(serialized, /\{\s*children\s*\}/, 'snippets must not embed `{children}` markup');
});

test('snippets include canonical @zenithbuild/router imports and ZenLink usage', () => {
  const snippets = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf8'));
  const serialized = JSON.stringify(snippets);
  assert.match(
    serialized,
    /@zenithbuild\/router/,
    'snippets must reference canonical `@zenithbuild/router` module'
  );
  assert.match(
    serialized,
    /<ZenLink\s+href=/,
    'snippets must use `<ZenLink href="..">` (no `to=` prop)'
  );
  assert.doesNotMatch(
    serialized,
    /<ZenLink[^>]*\bto=/,
    'snippets must not teach legacy `<ZenLink to="..">`'
  );
});
