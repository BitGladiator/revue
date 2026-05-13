exports.up = async (pgm) => {
    pgm.createTable('repo_settings', {
      id: { type: 'serial', primaryKey: true },
      repo_id: {
        type: 'integer',
        references: '"repos"',
        onDelete: 'CASCADE',
        unique: true,
      },
      enable_quality_agent:   { type: 'boolean', default: true },
      enable_security_agent:  { type: 'boolean', default: true },
      enable_tests_agent:     { type: 'boolean', default: true },
      min_severity:           { type: 'varchar(10)', default: "'low'" },
      auto_review:            { type: 'boolean', default: true },
      created_at:             { type: 'timestamp', default: pgm.func('NOW()') },
      updated_at:             { type: 'timestamp', default: pgm.func('NOW()') },
    });
  };
  
exports.down = async (pgm) => {
    pgm.dropTable('repo_settings');
};