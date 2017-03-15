module.exports = class Radar {
  constructor(github, config) {
    this.github = github;
    this.config = Object.assign({}, require('./defaults'), config || {});
    this.logger = config.logger || console;
  }

  //return most recent issues with select labels
  async getIssuesWithLabel(){
    const {owner, repo, labels} = this.config;
    this.logger.info(owner, repo, labels);
    var all_issues = [];
    await Promise.all(labels.map( async (label) => {
      var query = `repo:${owner}/${repo} is:issue is:open label:${label} `
      const params = {
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 100
      };

      this.logger.info(params, 'searching %s/%s for blocked issues', owner, repo);
      var issues = await this.github.search.issues(params);
      all_issues.push(issues);
    }));

    this.logger.info("all_issues:", all_issues)
    return all_issues;
  }
};
