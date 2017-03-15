module.exports = class radar {
  constructor(github, config) {
    this.github = github;
    this.config = Object.assign({}, require('./defaults'), config || {});
    this.logger = config.logger || console;
  }

  async getIssues(){
    const {owner, repo} = this.config;

    const params = {
      q: `repo:${owner}/${repo} is:issue is:open label:blocked `,
      sort: 'updated',
      order: 'desc',
      per_page: 10
    };

    this.logger.debug(params, 'searching %s/%s for blocked issues', owner, repo);
    return this.github.search.issues(params);
  }
}
