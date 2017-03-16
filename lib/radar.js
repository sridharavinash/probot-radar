module.exports = class Radar {
  constructor(github, config) {
    this.github = github;
    this.config = Object.assign({}, require('./defaults'), config || {});
    this.logger = config.logger || console;
    this.issue_body = '## Here is the radar for the week\n'
  }

  //return most recent issues with select labels
  async getIssuesWithLabel(){
    const {owner, repo, labels} = this.config;
    this.logger.debug(owner, repo, labels);
    var all_issues = {};

    await Promise.all(labels.map( async (label) => {
      var query = `repo:${owner}/${repo} is:issue is:open label:${label} `;
      const params = {
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 100
      };

      this.logger.debug(params, 'searching %s/%s for issues', owner, repo);
      var issues = await this.github.search.issues(params);
      if(!all_issues[label]){
        all_issues[label] = issues;
      }else{
        all_issues[label] = all_issues.concat(issues);
      }
    }));

    this.logger.debug('all_issues:', all_issues);
    return all_issues;
  }

  async getIssueTitleLink(issues){
    issues.items.forEach(issue =>{
      this.logger.debug('issue_title', issue.title);
      this.logger.debug('issue_link', issue.html_url);
      this.issue_body += `[${issue.title}](${issue.html_url})\n`;
    });
  }

  // Create radar issue with issue titles links
  async createRadarIssue(){
    // Check if we need to create an issue
    //TODO  isRadarIssueOpen
    const {owner, radar} = this.config;
    const data = await this.getIssuesWithLabel();
    Object.keys(data).forEach(async (label) =>{
      this.issue_body += `### ${label}`;
      await this.getIssueTitleLink(data[label]);
    });

    var params = {
      title: 'Radar for the week',
      labels: radar.labels,
      body: this.issue_body
    };
    this.logger.info(parms);
    this.logger.info(radar);
    this.logger.info(owner);
    this.github.issues.create({owner, radar.repo, params});
  }

  // Close a radar issue if it's open for more than x days
  async closeRadarIssue(){

  }

  //check if there is an open radar issue in the radar repo
  async isRadarIssueOpen(){
    const {owner, radar} = this.config;

    // Get all radar labels
    var radar_labels = radar.labels.join(' label:')
    this.logger.debug('radar_labels: ', radar_labels)

    // Check if the radar issue has an open radar label issue
    var query = `repo:${owner}/${radar.repo} is:issue is:open label:${radar_labels} `
    const params = {
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: 1
    };

    var radar_issues = await this.github.search.issues(params);

    if(radar_issues.count === 1){
      this.logger.info('Found atleast 1 open radar open issue', radar_issues);
      return true;
    }
    return false;
  }
};
