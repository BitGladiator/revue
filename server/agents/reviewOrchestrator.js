const runReviewPipeline = async (formattedDiff, prTitle, prAuthor, settings = {}) => {
  const {
    enable_quality_agent  = true,
    enable_security_agent = true,
    enable_tests_agent    = true,
    min_severity          = 'low',
  } = settings;

  const start = Date.now();
  const userContent = `PR: "${prTitle}" by @${prAuthor}\n\n${formattedDiff}`;

 
  const agentTasks = [];
  if (enable_quality_agent)  agentTasks.push(limit(() => runAgent('quality',  REVIEW_PROMPTS.quality,  userContent)));
  if (enable_security_agent) agentTasks.push(limit(() => runAgent('security', REVIEW_PROMPTS.security, userContent)));
  if (enable_tests_agent)    agentTasks.push(limit(() => runAgent('tests',    REVIEW_PROMPTS.tests,    userContent)));

  const agentResults = await Promise.all(agentTasks);

  const qualityResult  = enable_quality_agent  ? agentResults.find((r) => r.agent === 'quality')  : { output: { issues: [], summary: 'Agent disabled' }, success: true, tokens: 0 };
  const securityResult = enable_security_agent ? agentResults.find((r) => r.agent === 'security') : { output: { issues: [], summary: 'Agent disabled' }, success: true, tokens: 0 };
  const testsResult    = enable_tests_agent    ? agentResults.find((r) => r.agent === 'tests')    : { output: { issues: [], summary: 'Agent disabled' }, success: true, tokens: 0 };

  
  const severityRank = { low: 0, medium: 1, high: 2, critical: 3 };
  const minRank = severityRank[min_severity] ?? 0;

  const filterBySeverity = (issues) =>
    (issues || []).filter((i) => (severityRank[i.severity] ?? 0) >= minRank);

  const filteredQuality  = filterBySeverity(qualityResult.output?.issues);
  const filteredSecurity = filterBySeverity(securityResult.output?.issues);
  const filteredTests    = filterBySeverity(testsResult.output?.issues);

 
  const aggregatorContent = `
PR: "${prTitle}" by @${prAuthor}

QUALITY AGENT: ${JSON.stringify({ ...qualityResult.output, issues: filteredQuality })}
SECURITY AGENT: ${JSON.stringify({ ...securityResult.output, issues: filteredSecurity })}
TEST COVERAGE AGENT: ${JSON.stringify({ ...testsResult.output, issues: filteredTests })}
`.trim();

  const aggregatorResult = await runAgent(
    'aggregator',
    REVIEW_PROMPTS.aggregator,
    aggregatorContent,
    SMART_MODEL
  );

  const totalTokens = agentResults.reduce((s, r) => s + r.tokens, 0) +
    (aggregatorResult.tokens || 0);

  const allIssues = [
    ...filteredQuality.map((i)  => ({ ...i, type: 'quality' })),
    ...filteredSecurity.map((i) => ({ ...i, type: 'security' })),
    ...filteredTests.map((i)    => ({ ...i, type: 'tests' })),
  ];

  return {
    overall_score:   aggregatorResult.output?.overall_score ?? 50,
    verdict:         aggregatorResult.output?.verdict ?? 'comment',
    summary:         aggregatorResult.output?.summary ?? 'Review complete.',
    top_issues:      aggregatorResult.output?.top_issues ?? [],
    security_issues: filteredSecurity,
    quality_issues:  filteredQuality,
    test_issues:     filteredTests,
    all_issues:      allIssues,
    agent_reasoning: {
      quality:  qualityResult.output?.summary,
      security: securityResult.output?.summary,
      tests:    testsResult.output?.summary,
    },
    pipeline_meta: {
      total_tokens:    totalTokens,
      duration_ms:     Date.now() - start,
      agents_enabled:  agentTasks.length,
      min_severity,
    },
  };
};