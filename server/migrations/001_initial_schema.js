exports.up = async (pgm) => {
    pgm.createTable('users', {
      id: { type: 'serial', primaryKey: true },
      github_id: { type: 'varchar(50)', unique: true, notNull: true },
      username: { type: 'varchar(100)', notNull: true },
      avatar_url: { type: 'text' },
      access_token: { type: 'text', notNull: true },
      created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.createTable('repos', {
      id: { type: 'serial', primaryKey: true },
      user_id: { type: 'integer', references: '"users"', onDelete: 'CASCADE' },
      github_repo_id: { type: 'varchar(50)', notNull: true },
      full_name: { type: 'varchar(255)', notNull: true }, 
      name: { type: 'varchar(100)', notNull: true },
      owner: { type: 'varchar(100)', notNull: true },
      private: { type: 'boolean', default: false },
      installation_id: { type: 'varchar(50)' }, 
      connected: { type: 'boolean', default: true },
      created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.createTable('pull_requests', {
      id: { type: 'serial', primaryKey: true },
      repo_id: { type: 'integer', references: '"repos"', onDelete: 'CASCADE' },
      github_pr_id: { type: 'varchar(50)', notNull: true },
      pr_number: { type: 'integer', notNull: true },
      title: { type: 'text', notNull: true },
      author: { type: 'varchar(100)', notNull: true },
      base_branch: { type: 'varchar(255)', notNull: true },
      head_branch: { type: 'varchar(255)', notNull: true },
      diff_url: { type: 'text' },
      status: {
        type: 'varchar(20)',
        default: "'pending'",
      },
      created_at: { type: 'timestamp', default: pgm.func('NOW()') },
      updated_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.createTable('reviews', {
      id: { type: 'serial', primaryKey: true },
      pr_id: { type: 'integer', references: '"pull_requests"', onDelete: 'CASCADE' },
      github_review_id: { type: 'varchar(50)' },
      overall_summary: { type: 'text' },
      quality_score: { type: 'integer' },
      security_issues: { type: 'jsonb', default: "'[]'" },
      quality_issues: { type: 'jsonb', default: "'[]'" },
      test_coverage_issues: { type: 'jsonb', default: "'[]'" },
      doc_issues: { type: 'jsonb', default: "'[]'" },
      agent_reasoning: { type: 'jsonb' },
      pipeline_meta: { type: 'jsonb' },
      created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.addConstraint(
      'pull_requests',
      'pull_requests_repo_pr_unique',
      'UNIQUE (repo_id, github_pr_id)'
    );
  };
  
  exports.down = async (pgm) => {
    pgm.dropTable('reviews');
    pgm.dropTable('pull_requests');
    pgm.dropTable('repos');
    pgm.dropTable('users');
  };