# Saddle's OpenZeppelin Defender Serverless Repo

For deploying to autotasks and other services via OpenZeppelin's Defender Serverless Plugin

## Installation

Install via yarn:

```
yarn install
```

Test each autotask in hardhat envionrment. Tests can be edited to setup the environment for each autotask job (ex. running against network forks)
```
yarn run test
```

Compile typescript before deploying. Javascript files will be generated in `dist/` folder.
```
yarn run build
```

Deploy the new resources and javascript files referenced in serverless.yml
```
yarn run deploy
```

## Commands

### Deploy

You can use `sls deploy` to deploy your current stack to Defender.

The deploy takes in an optional `--stage` flag, which is defaulted to `dev` when installed from the template above.

Moreover, the `serverless.yml` may contain an `ssot` property. More information can be found in the [SSOT mode](#SSOT-mode) section.

This command will append a log entry in the `.defender` folder of the current working directory. Additionally, if any new relayer keys are created, these will be stored as JSON objects in the `.defender/relayer-keys` folder.

> When installed from the template, we ensure the `.defender` folder is ignored from any git commits. However, when installing directly, make sure to add this folder it your `.gitignore` file.

### Info

You can use `sls info` to retrieve information on every resource defined in the `serverless.yml` file, including unique identifiers, and properties unique to each Defender component.

### Remove

You can use `sls remove` to remove all defender resources defined in the `serverless.yml` file.

> To avoid potential loss of funds, Relayers can only be deleted from the Defender UI directly.

### Logs

You can use `sls logs --function <stack_resource_id> --data {...}` to retrieve the latest autotask logs for a given autotask identifier (e.g. mystack.autotask-example-1). This command will run continiously and retrieve logs every 2 seconds. The `--data` flag is optional.

### Invoke

You can use `sls invoke --function <stack_resource_id>` to manually run an autotask, given its identifier (e.g. mystack.autotask-example-1).

> Each command has a standard output to a JSON object.

More information can be found on our documentation page [here](https://docs.openzeppelin.com/defender/serverless-plugin.html)

## Caveats

Errors thrown during the `deploy` process, will not revert any prior changes. Common errors are:

- Not having set the API key and secret
- Insufficient permissions for the API key
- Validation error of the `serverless.yml` file (see [Types and Schema validation](#Types-and-Schema-validation))

Usually, fixing the error and retrying the deploy should suffice as any existing resources will fall within the `update` clause of the deployment. However, if unsure, you can always call `sls remove` to remove the entire stack, and retry.
