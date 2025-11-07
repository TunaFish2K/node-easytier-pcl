# Node.js 上对龙腾猫跃 PCL 约定的实现

语言：中文 [English](/README.en_US.md)

对[https://github.com/Meloong-Git/PCL/wiki/简洁联机标记约定](https://github.com/Meloong-Git/PCL/wiki/简洁联机标记约定)的实现。

## 内容

-   [x] 邀请码的生成，检验与解析
-   [x] EasyTier 命令行启动参数的生成
-   [x] 单元测试

## 安装

```sh
npm i easytier-pcl
```

## 使用（V2）

```typescript
import * as v2 from "easytier-pcl/v2";

// 随机生成邀请码
const code = v2.generateInvitationCode(8080, { nodeID: 0 });

// 随机生成邀请码并添加额外信息
const code = v2.generateInvitationCode(8080, {
    nodeID: 0,
    attachment: "-attachment",
});

// 解析邀请码，不合法的邀请码会报错
const data = v2.parseInvitationCode(code);
console.log(data.port); // 8080
console.log(data.networkName); // P1F90-XXXXX
console.log(data.networkSecret); // XXXXX
console.log(data.nodeID); // 0
console.log(data.attachment); // "-attachment"

// 从EasyTier Uptime API获取所有带有标签'MC'的PCL协议的节点，返回一个url列表
const nodes = await v2.getAvailableNodes();

// 生成作为服主时的EasyTier参数，返回字符数组
const args = v2.generateEasyTierArguments({
    invitationCode: code,
    nodes,
    role: "host",
    hostname: "Server-test",
});

// 生成不是服主时的EasyTier参数，返回字符数组
const args = v2.generateEasyTierArguments({
    invitationCode: code,
    nodes,
    role: "client",
    hostnameSuffix: "-Player111", // 详见PCL协议文档
    portToForward: 10888, // 在本地转发的端口
});
```

### 使用（V1）

```typescript
// 随机生成邀请码
const code = generateInvitationCode(8080);

// 随机生成邀请码并添加额外信息
const code = generateInvitationCode(8080, "-attachment");

// 解析邀请码，不合法的邀请码会报错
const data = parseInvitationCode(code);
console.log(data.port); // 8080
console.log(data.networkName); // P1F90-XXXXX
console.log(data.networkSecret); // XXXXX
console.log(data.attachment); // "-attachment"

// 从EasyTier Uptime API获取所有带有标签'MC'的PCL协议的节点，返回一个url列表
const nodes = await getAvailableNodes();

// 生成作为服主时的EasyTier参数，返回字符数组
const args = generateEasyTierArguments({
    invitationCode: code,
    nodes,
    role: "host",
    hostname: "Server-test",
});

// 生成不是服主时的EasyTier参数，返回字符数组
const args = generateEasyTierArguments({
    invitationCode: code,
    nodes,
    role: "client",
    hostnameSuffix: "-Player111", // 详见PCL协议文档
    portToForward: 10888, // 在本地转发的端口
});
```

## 开发

```sh
git clone https://github.com/TunaFish2K/easytier-pcl
npm i
# 构建
npm run build
# 单元测试
npm run test
```
