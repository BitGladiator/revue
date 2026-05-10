const Groq = require('groq-sdk');
const { REVIEW_PROMPTS } = require('./prompts');

const pLimit = (concurrency) => {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  return (fn) => new Promise((resolve, reject) => {
    const run = async () => {
      activeCount++;
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        next();
      }
    };

    if (activeCount < concurrency) {
      run();
    } else {
      queue.push(run);
    }
  });
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const limit = pLimit(3);

const FAST_MODEL = 'llama-3.1-8b-instant';
const SMART_MODEL = 'llama-3.3-70b-versatile';

const runAgent = async (name, systemPrompt, userContent, model = FAST_MODEL) => {
  const start = Date.now();
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 400, 
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    return {
      agent: name,
      success: true,
      output: JSON.parse(raw),
      tokens: response.usage?.total_tokens || 0,
      ms: Date.now() - start,
    };
  } catch (err) {
    console.error(`Agent [${name}] failed:`, err.message);
    return {
      agent: name,
      success: false,
      output: { issues: [], summary: 'Agent failed' },
      tokens: 0,
      ms: Date.now() - start,
    };
  }
};

const runReviewPipeline = async (formattedDiff, prTitle, prAuthor) => {
  const start = Date.now();

  const userContent = `PR: "${prTitle}" by @${prAuthor}\n\n${formattedDiff}`;


  const [qualityResult, securityResult, testsResult] = await Promise.all([
    limit(() => runAgent('quality',  REVIEW_PROMPTS.quality,  userContent)),
    limit(() => runAgent('security', REVIEW_PROMPTS.security, userContent)),
    limit(() => runAgent('tests',    REVIEW_PROMPTS.tests,    userContent)),
  ]);

  
  const aggregatorContent = `
PR: "${prTitle}" by @${prAuthor}

QUALITY AGENT:
${JSON.stringify(qualityResult.output, null, 2)}

SECURITY AGENT:
${JSON.stringify(securityResult.output, null, 2)}

TEST COVERAGE AGENT:
${JSON.stringify(testsResult.output, null, 2)}
`.trim();

  const aggregatorResult = await runAgent(
    'aggregator',
    REVIEW_PROMPTS.aggregator,
    aggregatorContent,
    SMART_MODEL
  );

  const totalTokens =
    qualityResult.tokens +
    securityResult.tokens +
    testsResult.tokens +
    aggregatorResult.tokens;

  console.log(`Review pipeline complete — ${totalTokens} tokens — ${Date.now() - start}ms`);


  const allIssues = [
    ...(qualityResult.output?.issues  || []).map((i) => ({ ...i, type: 'quality' })),
    ...(securityResult.output?.issues || []).map((i) => ({ ...i, type: 'security' })),
    ...(testsResult.output?.issues    || []).map((i) => ({ ...i, type: 'tests' })),
  ];

  return {
    overall_score:  aggregatorResult.output?.overall_score ?? 50,
    verdict:        aggregatorResult.output?.verdict ?? 'comment',
    summary:        aggregatorResult.output?.summary ?? 'Review complete.',
    top_issues:     aggregatorResult.output?.top_issues ?? [],
    security_issues: securityResult.output?.issues  || [],
    quality_issues:  qualityResult.output?.issues   || [],
    test_issues:     testsResult.output?.issues     || [],
    all_issues:      allIssues,
    agent_reasoning: {
      quality:   qualityResult.output?.summary,
      security:  securityResult.output?.summary,
      tests:     testsResult.output?.summary,
    },
    pipeline_meta: {
      total_tokens: totalTokens,
      duration_ms:  Date.now() - start,
    },
  };
};

module.exports = { runReviewPipeline };