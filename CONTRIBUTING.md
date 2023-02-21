# RPI TV Glimpse API Contributing Guide

Thank you for your desire to contribute to RPI TV's Glimpse project. These are the contributing guidelines for the API service of the project. For information on other services within the project, I recommend you look at the [rpitv/glimpse](https://github.com/rpitv/glimpse) repository. 

## Getting started

If you're new to open source, here are some resources to help you get started with open source contributions, pulled from the [github/docs contributing guidelines](https://github.com/github/docs/blob/main/CONTRIBUTING.md):

- [Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
- [Set up Git](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Collaborating with pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests)

Once you are ready to contribute, our project is heavily documented both within the code and the [repository wiki](https://github.com/rpitv/glimpse-api/wiki). You can also take a look at our [README](README.md) for additional information on quick starting your development environment. Our contributors are mostly students, and therefore are rapidly coming and going. Therefore, documentation is **very important** to this and all Glimpse projects. The #1 rule to keep in mind when contributing to this repository is to do your best to make sure all your changes are documented; especially major ones.

# Contributors

## Rensselaer Student contributors

We're glad to have you spending your time working on this project! However, please remember that as a student, your grades should be your #1 priority. If you want to spend more time working on this project, we highly recommend you check out RPI's RCOS program. 

### RCOS

RCOS lets you work on open-source projects, optionally for credit. These credits count as "independent study", so you are able to take the class as many times as you wish to fulfill your free elective slots. If you skipped CS1 and went straight to Data Structures, RCOS can also be used to fulfill those extra four CS1 credits that you missed.

With that said, it may be ill-advised to take all of your free elective credits as RCOS credits. Having a diverse transcript could be helpful for your future career, and introduce you to interesting classes that you might not have considered before. Please talk to your student advisor and RCOS faculty advisors for advice on what is the best path for you.

[Click here for more information on the RCOS program](https://rcos.io/).

## External contributors

**Welcome to our project!** While this project is primarily managed by students and alumni of Rensselaer Polytechnic Institute, we will always be open to contributions from anyone else who wishes to help out. We recommend you [join our Discord](https://rpi.tv/discord-glimpse) to interact with the team. 

# Contributing

> ℹ️ Before contributing, make sure to read our [Code of Conduct](https://github.com/rpitv/glimpse-api/blob/master/CODE_OF_CONDUCT.md)!

## Overview

Contributions to this project go through a multi-step process:

1. A user (you?) assigns themselves to an issue and creates a branch for the issue. Branches should be named after the issue which they are trying to fix, with an optional short description. E.g. `fix-issue-68-add-documentation`.
    1. If you are privileged in this repository, you can create this branch within the repository itself. Otherwise, create it in your own fork.
    2. Hotfixes can be pushed directly onto master if necessary.
2. Once you are happy with your changes, submit a PR to merge them into the `master` branch. Before making a PR, do your due diligence to make sure the API still functions correctly; preferrably also testing it with the [UI](https://github.com/rpitv/glimpse-ui).
3. Github workflows will run on your code to make sure all unit, E2E, and formatting tests pass.
4. If all tests pass, at least one other contributor should review your code before merging it into `master`.
    1. While we don't want to take away from the autonomy of the students managing this project, some PRs can have some serious security implications for the project. If your change is non-trivial, or you are not sure if it could have any security impact, it's recommended that an alumni experienced with the project also reviews the PR (e.g. @robere2).
5. Once your PR is merged into `master`, it will be built and published to Docker with the first seven characters of the commit hash as it's tag. It will then be deployed to https://staging.rpi.tv/ in an isolated environment.
    1. A routine workflow will also build and push the `master` branch every night, tagged as `nightly`.
7. Finally, a repository contributor will eventually publish a new release by pulling the `master` branch onto the `release` branch. This will build and publish the Docker container with the `latest` tag and the corresponding release version number. The Docker container will then be deployed to https://rpi.tv/.
    1. Hotfixes should still be done via a PR to the `release` branch. Sometimes, GitHub actions can take a long time to run. If you need immediate changes, pull the repository and build the Docker image locally on the host machine. Refer to internal documents for more information.

> *Please note, at the time of writing this, not all of these GitHub Actions workflows have been set up, but are planned for the future.*
