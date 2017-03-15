module.exports = class Radar {
  constructor(github, config) {
    this.github = github;
    this.config = Object.assign({}, require('./defaults'), config || {});
    this.logger = config.logger || console;
  }

  //return most recent blocked issues
  async getIssuesWithLabel(){
    const {owner, repo, labels} = this.config;
    this.logger.info(owner, repo, labels)

    labels.forEach(label => {
      var query = `repo:${owner}/${repo} is:issue is:open label:${label} `
      const params = {
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 100
      };

      this.logger.info(params, 'searching %s/%s for blocked issues', owner, repo);
      return this.github.search.issues(params);
    });
  }
};
