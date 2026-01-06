const LANGUAGE_MAP = {
  javascript: 'js',
  python: 'py',
  cpp: 'cpp',
  java: 'java',
};

/**
 * Execute the user's code with optional input.
 * @param {Object} params
 * @param {'javascript'|'python'|'cpp'|'java'} params.language
 * @param {string} params.code - Source code to run
 * @param {string} params.input - Stdin to pass
 * @returns {Promise<{output: string, success: boolean, execTime?: number}>}
 */
export async function executeCode({ language, code, input = '' }) {
  const lang = LANGUAGE_MAP[language];

  const payload = {
    language: lang,
    source_code: code,
    stdin: input,
  };

  const startTime = performance.now();

  try {
    // Replace this block with your real execution API
    const result = await fakeExecution(payload);

    const endTime = performance.now();

    return {
      ...result,
      execTime: parseFloat((endTime - startTime).toFixed(2)),
    };
  } catch (error) {
    return {
      output: `Execution failed: ${error.message}`,
      success: false,
    };
  }
}

/**
 * Simulated code execution for all supported languages
 * @param {Object} payload
 * @param {string} payload.language - 'js' | 'py' | 'cpp' | 'java'
 * @param {string} payload.source_code
 * @param {string} payload.stdin
 * @returns {Promise<{output: string, success: boolean}>}
 */
async function fakeExecution({ language, source_code, stdin }) {
  await new Promise((res) => setTimeout(res, 1000));

  if (!source_code || typeof source_code !== 'string') {
    throw new Error('Invalid source code.');
  }

  let output = '';

  switch (language) {
    case 'js':
      // Basic eval for demo (unsafe in real apps)
      try {
        // Wrap function so it doesn't auto-execute
        const func = new Function('input', `${source_code}; return reverseString(input);`);
        output = func(stdin);
      } catch (err) {
        output = `JS Runtime Error: ${err.message}`;
      }
      break;

    case 'py':
      output = `Simulated Python output (input reversed): ${stdin.split('').reverse().join('')}`;
      break;

    case 'cpp':
      output = `Simulated C++ output (input uppercased): ${stdin.toUpperCase()}`;
      break;

    case 'java':
      output = `Simulated Java output (length of input): ${stdin.length}`;
      break;

    default:
      throw new Error(`Unsupported language: ${language}`);
  }

  return {
    output: output || '(No output)',
    success: true,
  };
}
