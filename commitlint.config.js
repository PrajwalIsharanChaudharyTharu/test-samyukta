export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'content', 'style', 'refactor', 'perf', 'docs', 'chore', 'ci', 'test'],
    ],
  },
};
