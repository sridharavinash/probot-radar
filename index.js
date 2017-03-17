const yaml = require('js-yaml');
const Radar = require('./lib/radar');

module.exports = (robot) => {
  check()

  async function check() {
    robot.log.info('Checking for open issues');

    const github = await robot.integration.asIntegration();
    // TODO: Pagination
    const installations = await github.integrations.getInstallations({});
    return installations.map(i => checkInstallation(i));
  }

  async function checkInstallation(installation) {
     const github = await robot.auth(installation.id);
     let config;
     let radarOpen;
     const data = await github.integrations.getInstallationRepositories({});

     var coll_issues = [];
     coll_issues = await Promise.all(data.repositories.map(async repo => {
       var radar = await getRadarObj(github, repo);
       radarOpen = await radar.isRadarIssueOpen();
       if(radarOpen){
         return;
       }

       if(!config){
         config = await radar.getConfig();
       }
       const issues_for_repo = await radar.getIssuesWithLabel();
       return issues_for_repo;
     }));

     if(radarOpen){
       return 'Issue not created';
     }
     var mergedIssues = await mergeIssueData(coll_issues);
     robot.log.info(config);
     //HACK to get this to create a radar issue. Loses any yml set configs
     var radar2 = new Radar(github, config);

     var body = await radar2.generateRadarIssueBody(mergedIssues);
     var issue_created = await radar2.createRadarIssue(body);
     return issue_created.status;
   }

  async function mergeIssueData(data){
    var ret = {};
    data.forEach(item =>{
      Object.keys(item).map(async (label) => {
        if(!ret[label]){
          ret[label] = item[label];
        }else{
          ret[label] = ret[label].concat(item[label]);
        }
      });
    });
    return ret;
  }

  async function getRadarObj(github, repository) {
    const owner = repository.owner.login;
    const repo = repository.name;
    const path = '.github/radar.yml';
    let config;

    try {
      const data = await github.repos.getContent({owner, repo, path});
      config = yaml.load(new Buffer(data.content, 'base64').toString());
    } catch (err) {
      config = {};
    }
    config = Object.assign(config, {owner, repo, logger: robot.log});
    return new Radar(github, config);
  }
};
