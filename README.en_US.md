# A implementation of Meloong's PCL protocol on Node.js

Language: [简体中文](/README.md) English

A implematation of[https://github.com/Meloong-Git/PCL/wiki/简洁联机标记约定](https://github.com/Meloong-Git/PCL/wiki/简洁联机标记约定).

## Content

-   [x] Generating, parsing, and validating invitation code
-   [x] Generating EasyTier CLI arguments.
-   [x] unittest

## Installation

```sh
npm i easytier-pcl
```

## Usage

```typescript
// generate a random invitation code
const code = generateInvitationCode(8080);

// generate a random invitation code and attach information
const code = generateInvitationCode(8080, "-attachment");

// pars the invitation code, invalid ones will lead to error being thrown
const data = parseInvitationCode(code);
console.log(data.port); // 8080
console.log(data.networkName); // P1F90-XXXXX
console.log(data.networkSecret); // XXXXX
console.log(data.attachment); // "-attachment"

// fetch all available nodes with the tag 'MC' from the EasyTier Uptime API
const nodes = await getAvailableNodes();

// generate cli arguments as host, returns a string array
const args = generateEasyTierArguments({
    invitationCode: code,
    nodes,
    role: "host",
});

// generate cli arguments when not being a host, returns a string array
const args = generateEasyTierArguments({
    invitationCode: code,
    nodes,
    role: "client",
    hostnameSuffix: "-Player111", // check the PCL protocol documentation for detail
});
```

## Development

```sh
git clone https://github.com/TunaFish2K/easytier-pcl
npm i
# Building
npm run build
# Unittest
npm run test
```
