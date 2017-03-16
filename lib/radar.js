module.exports = class Radar {
  constructor(github, config) {
    this.github = github;
    this.config = Object.assign({}, require('./defaults'), config || {});
    this.logger = config.logger || console;
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

      var issues = await this.github.search.issues(params);
      if(!all_issues[label]){
        all_issues[label] = issues;
      }else{
        all_issues[label] = all_issues.concat(issues);
      }
    }));

    return all_issues;
  }

  async getIssueTitleLink(issues){
    var body = "";
    issues.items.forEach(issue =>{
      this.logger.debug('issue_title', issue.title);
      this.logger.debug('issue_link', issue.html_url);
      body += `[${issue.title}](${issue.html_url})\n`;
    });
    return body
  }

  async populateRadarIssue(data){
    const {owner, radar} = this.config;
    var issue_body = '## Here is the radar for the week\n'
    await Promise.all(Object.keys(data).map(async (label) =>{
      issue_body += `### ${label}\n`;
      issue_body += await this.getIssueTitleLink(data[label]);
    }));
    return issue_body;
  }

  // Create radar issue with issue titles links
  async createRadarIssue(){
    // Check if we need to create an issue
    //TODO  isRadarIssueOpen
    const {owner, radar} = this.config;
    var repo = radar.repo;
    this.github.issues.create({
      owner: owner,
      repo: repo,
      title: 'Radar for the week',
      body: this.issue_body});
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
