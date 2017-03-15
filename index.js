const yaml = require('js-yaml');
const Stale = require('./lib/radar');

// Check for stale issues every hour
const INTERVAL = 60 * 60 * 1000;

module.exports = (robot) => {
  // Your plugin code here
  console.log('Yay, the plugin was loaded!');

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
     return data.repositories.map(async repo => {
       const radar = await forRepository(github, repo);
       return radar.getIssues();
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

    return new radar(github, config);
  }
};
