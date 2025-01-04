const { type, name } = $arguments
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 定义需要过滤的 tag 列表
const excludedTags = ["hk", "hk-auto", "tw", "tw-auto", "jp", "jp-auto", "sg", "sg-auto", "us", "us-auto", "剩余流量","过期时间"];

// 在添加到 config.outbounds 之前过滤 proxies
proxies = proxies.filter(proxy => {
  return !excludedTags.includes(proxy.tag) &&
         !proxy.tag.includes("剩余流量") &&
         !proxy.tag.includes("过期时间");
});

config.outbounds.push(...proxies)

config.outbounds.map(i => {
  if (['select', 'auto'].includes(i.tag)) {
    // 此时 getTags 应该不会再返回包含 "剩余流量" 或 "过期时间" 的标签
    i.outbounds.push(...getTags(proxies).filter(tag => !excludedTags.includes(tag)));
  }
})

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies)
    .map(p => p.tag)
    .filter(tag => !tag.includes("剩余流量") && !tag.includes("过期时间"));
}
