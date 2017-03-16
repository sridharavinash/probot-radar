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
     // TODO: Pagination
     const data = await github.integrations.getInstallationRepositories({});
     var issues = []
     return data.repositories.map(async repo => {
       const issues = await forRepository(github, repo);
       return issues;
     });
   }

  async function forRepository(github, repository) {
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
    var radar = new Radar(github, config);
    const issues_for_repo = await radar.getIssuesWithLabel();
    return issues_for_repo;
  }
};
