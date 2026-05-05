exports.up = async (pgm) => {
    pgm.createIndex('repos', ['user_id'], { name: 'idx_repos_user' });
    pgm.createIndex('pull_requests', ['repo_id', 'status'], { name: 'idx_prs_repo_status' });
    pgm.createIndex('reviews', ['pr_id'], { name: 'idx_reviews_pr' });
  };
  
  exports.down = async (pgm) => {
    pgm.dropIndex('repos', [], { name: 'idx_repos_user' });
    pgm.dropIndex('pull_requests', [], { name: 'idx_prs_repo_status' });
    pgm.dropIndex('reviews', [], { name: 'idx_reviews_pr' });
  };